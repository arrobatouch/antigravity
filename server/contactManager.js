const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');

// Ensure contacts file exists
if (!fs.existsSync(CONTACTS_FILE)) {
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify({}, null, 2));
}

// ============ CONTACTS MANAGEMENT ============

const readContacts = () => {
    try {
        const data = fs.readFileSync(CONTACTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading contacts file:', err);
        return {};
    }
};

const writeContacts = (contacts) => {
    try {
        fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
    } catch (err) {
        console.error('Error writing contacts file:', err);
    }
};

/**
 * Get contact data by phone number
 * @param {string} phoneNumber - Phone number (e.g., "5491122334455@c.us")
 * @returns {object|null} Contact data or null
 */
function getContact(phoneNumber) {
    const contacts = readContacts();
    return contacts[phoneNumber] || null;
}

/**
 * Create or update contact
 * @param {string} phoneNumber - Phone number
 * @param {object} data - Contact data to save
 * @returns {object} Updated contact data
 */
function saveContact(phoneNumber, data) {
    const contacts = readContacts();

    const existingContact = contacts[phoneNumber] || {};

    contacts[phoneNumber] = {
        ...existingContact,
        ...data,
        phone: phoneNumber,
        updatedAt: new Date().toISOString()
    };

    if (!existingContact.createdAt) {
        contacts[phoneNumber].createdAt = new Date().toISOString();
    }

    writeContacts(contacts);
    return contacts[phoneNumber];
}

/**
 * Update a specific field in contact
 * @param {string} phoneNumber - Phone number
 * @param {string} field - Field name
 * @param {any} value - Field value
 * @returns {object} Updated contact
 */
function updateContactField(phoneNumber, field, value) {
    const contact = getContact(phoneNumber) || {};
    contact[field] = value;
    return saveContact(phoneNumber, contact);
}

/**
 * Delete contact
 * @param {string} phoneNumber - Phone number
 * @returns {boolean} Success
 */
function deleteContact(phoneNumber) {
    const contacts = readContacts();
    if (contacts[phoneNumber]) {
        delete contacts[phoneNumber];
        writeContacts(contacts);
        return true;
    }
    return false;
}

/**
 * Get all contacts for a tenant
 * @param {string} tenantId - Tenant ID
 * @returns {array} Array of contacts
 */
function getContactsByTenant(tenantId) {
    const contacts = readContacts();
    return Object.values(contacts).filter(c => c.tenantId === tenantId);
}

/**
 * Check if contact has a specific field
 * @param {string} phoneNumber - Phone number
 * @param {string} field - Field name
 * @returns {boolean} True if field exists and has value
 */
function contactHasField(phoneNumber, field) {
    const contact = getContact(phoneNumber);
    return contact && contact[field] !== undefined && contact[field] !== null && contact[field] !== '';
}

/**
 * Get missing fields from a list
 * @param {string} phoneNumber - Phone number
 * @param {array} fields - Array of field names
 * @returns {array} Array of missing field names
 */
function getMissingFields(phoneNumber, fields) {
    const contact = getContact(phoneNumber) || {};
    return fields.filter(field => !contact[field] || contact[field] === '');
}

module.exports = {
    getContact,
    saveContact,
    updateContactField,
    deleteContact,
    getContactsByTenant,
    contactHasField,
    getMissingFields,
    readContacts,
    writeContacts
};
