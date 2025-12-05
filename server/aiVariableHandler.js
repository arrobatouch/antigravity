const templateEngine = require('./templateEngine');
const contactManager = require('./contactManager');
const db = require('./db');

// Load system tags for requesting missing data
const fs = require('fs');
const path = require('path');
const SYSTEM_TAGS_FILE = path.join(__dirname, 'data', 'system_tags.json');

let systemTags = {};
try {
    const data = fs.readFileSync(SYSTEM_TAGS_FILE, 'utf8');
    systemTags = JSON.parse(data);
} catch (err) {
    console.error('Error loading system tags:', err);
}

/**
 * Process a message with AI and handle variable filling
 * @param {string} phoneNumber - Contact phone number
 * @param {string} tenantId - Tenant ID
 * @param {string} message - User message
 * @param {object} selectedTag - Selected tag/template
 * @returns {object} { response, needsVariable, variableRequested }
 */
async function processMessageWithVariables(phoneNumber, tenantId, message, selectedTag) {
    try {
        // Get contact data
        let contact = contactManager.getContact(phoneNumber);

        // If no contact exists, create one
        if (!contact) {
            contact = contactManager.saveContact(phoneNumber, {
                tenantId: tenantId,
                phone: phoneNumber
            });
        }

        // Get tenant variables
        const tenantVariables = db.getVariables(tenantId);

        // Build tenant data object from variables
        const tenant = {};
        tenantVariables
            .filter(v => v.type === 'tenant')
            .forEach(v => {
                tenant[v.name] = v.value || v.description;
            });

        // If we have a selected tag/template
        if (selectedTag && selectedTag.template) {
            const template = selectedTag.template;

            // Try to fill the template
            const result = templateEngine.fillTemplate(template, contact, tenant);

            // If there are missing variables
            if (result.missingVars.length > 0) {
                // Get the first missing variable that should be asked
                const missingVar = result.missingVars[0];

                // Find the variable definition
                const varDef = tenantVariables.find(v => v.name === missingVar);

                // If it's a contact variable and should be asked
                if (varDef && varDef.type === 'contact' && varDef.askIfMissing) {
                    // Return the ask message
                    return {
                        response: varDef.askMessage || systemTags[`solicitar_${missingVar}`]?.text || `¿Me podés proporcionar tu ${missingVar}?`,
                        needsVariable: true,
                        variableRequested: missingVar,
                        pendingTemplate: template,
                        missingVars: result.missingVars
                    };
                }
            }

            // If all variables are filled, return the completed template
            return {
                response: result.filled,
                needsVariable: false,
                variableRequested: null,
                filledVars: result.foundVars
            };
        }

        // No template selected, return null
        return null;

    } catch (err) {
        console.error('Error processing message with variables:', err);
        return null;
    }
}

/**
 * Handle user response when a variable was requested
 * @param {string} phoneNumber - Contact phone number
 * @param {string} tenantId - Tenant ID
 * @param {string} userResponse - User's response
 * @param {string} variableName - Variable that was requested
 * @param {string} pendingTemplate - Template waiting to be filled
 * @returns {object} { response, completed }
 */
async function handleVariableResponse(phoneNumber, tenantId, userResponse, variableName, pendingTemplate) {
    try {
        // Save the variable value to contact
        contactManager.updateContactField(phoneNumber, variableName, userResponse);

        // Get updated contact
        const contact = contactManager.getContact(phoneNumber);

        // Get tenant data
        const tenantVariables = db.getVariables(tenantId);
        const tenant = {};
        tenantVariables
            .filter(v => v.type === 'tenant')
            .forEach(v => {
                tenant[v.name] = v.value || v.description;
            });

        // Try to fill the template again
        const result = templateEngine.fillTemplate(pendingTemplate, contact, tenant);

        // If still missing variables, ask for the next one
        if (result.missingVars.length > 0) {
            const missingVar = result.missingVars[0];
            const varDef = tenantVariables.find(v => v.name === missingVar);

            if (varDef && varDef.type === 'contact' && varDef.askIfMissing) {
                return {
                    response: varDef.askMessage || systemTags[`solicitar_${missingVar}`]?.text || `¿Me podés proporcionar tu ${missingVar}?`,
                    completed: false,
                    needsVariable: true,
                    variableRequested: missingVar,
                    pendingTemplate: pendingTemplate
                };
            }
        }

        // All variables filled, return completed template
        return {
            response: result.filled,
            completed: true,
            needsVariable: false
        };

    } catch (err) {
        console.error('Error handling variable response:', err);
        return {
            response: 'Hubo un error procesando tu respuesta. Por favor, intenta nuevamente.',
            completed: false,
            error: true
        };
    }
}

/**
 * Get conversation state for a contact
 * @param {string} phoneNumber - Contact phone number
 * @returns {object|null} Conversation state
 */
const conversationStates = new Map();

function getConversationState(phoneNumber) {
    return conversationStates.get(phoneNumber) || null;
}

function setConversationState(phoneNumber, state) {
    conversationStates.set(phoneNumber, state);
}

function clearConversationState(phoneNumber) {
    conversationStates.delete(phoneNumber);
}

module.exports = {
    processMessageWithVariables,
    handleVariableResponse,
    getConversationState,
    setConversationState,
    clearConversationState
};
