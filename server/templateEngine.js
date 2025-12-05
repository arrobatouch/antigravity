const fs = require('fs');
const path = require('path');

// ============ SYSTEM VARIABLES ============
const systemVariables = {
    fecha: () => {
        const now = new Date();
        return now.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    },

    hora: () => {
        const now = new Date();
        return now.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    fecha_humana: () => {
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const d = new Date();
        return `${days[d.getDay()]} ${d.getDate()} de ${months[d.getMonth()]}`;
    },

    dia_semana: () => {
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        return days[new Date().getDay()];
    },

    mes: () => {
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return months[new Date().getMonth()];
    }
};

// ============ TEMPLATE FILLING ENGINE ============

/**
 * Fill a template with variables from contact, tenant, operator, and system
 * @param {string} template - Template string with {variable} placeholders
 * @param {object} contact - Contact data object
 * @param {object} tenant - Tenant data object
 * @param {object} operator - Operator data object (optional)
 * @returns {object} { filled: string, missingVars: array }
 */
function fillTemplate(template, contact = {}, tenant = {}, operator = {}) {
    const missingVars = [];
    const foundVars = [];

    // Extract all variables from template
    const variableRegex = /\{(\w+)\}/g;
    let match;
    const variablesInTemplate = [];

    while ((match = variableRegex.exec(template)) !== null) {
        variablesInTemplate.push(match[1]);
    }

    // Fill template
    const filled = template.replace(/\{(\w+)\}/g, (match, varName) => {
        let value = null;

        // Priority order: contact -> tenant -> operator -> system
        if (contact && contact[varName] !== undefined && contact[varName] !== null && contact[varName] !== '') {
            value = contact[varName];
            foundVars.push({ name: varName, source: 'contact', value });
        }
        else if (tenant && tenant[varName] !== undefined && tenant[varName] !== null && tenant[varName] !== '') {
            value = tenant[varName];
            foundVars.push({ name: varName, source: 'tenant', value });
        }
        else if (operator && operator[varName] !== undefined && operator[varName] !== null && operator[varName] !== '') {
            value = operator[varName];
            foundVars.push({ name: varName, source: 'operator', value });
        }
        else if (systemVariables[varName]) {
            value = systemVariables[varName]();
            foundVars.push({ name: varName, source: 'system', value });
        }

        // If no value found, mark as missing
        if (value === null || value === undefined || value === '') {
            missingVars.push(varName);
            return match; // Keep {variable} placeholder
        }

        return value;
    });

    return {
        filled,
        missingVars: [...new Set(missingVars)], // Remove duplicates
        foundVars,
        variablesInTemplate: [...new Set(variablesInTemplate)]
    };
}

/**
 * Extract all variables from a template
 * @param {string} template - Template string
 * @returns {array} Array of variable names
 */
function extractVariables(template) {
    const variableRegex = /\{(\w+)\}/g;
    const variables = [];
    let match;

    while ((match = variableRegex.exec(template)) !== null) {
        variables.push(match[1]);
    }

    return [...new Set(variables)]; // Remove duplicates
}

/**
 * Check if a template has all required variables filled
 * @param {string} template - Template string
 * @param {object} contact - Contact data
 * @param {object} tenant - Tenant data
 * @param {object} operator - Operator data
 * @returns {boolean} True if all variables are filled
 */
function isTemplateComplete(template, contact = {}, tenant = {}, operator = {}) {
    const result = fillTemplate(template, contact, tenant, operator);
    return result.missingVars.length === 0;
}

/**
 * Get system variable value
 * @param {string} varName - Variable name
 * @returns {string|null} Variable value or null
 */
function getSystemVariable(varName) {
    if (systemVariables[varName]) {
        return systemVariables[varName]();
    }
    return null;
}

module.exports = {
    fillTemplate,
    extractVariables,
    isTemplateComplete,
    getSystemVariable,
    systemVariables
};
