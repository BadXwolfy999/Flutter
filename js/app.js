// DOM Elements
const csvFileInput = document.getElementById('csv-file');
const fileUploadArea = document.querySelector('.file-upload-area');
const fileInfo = document.getElementById('file-info');
const downloadTemplateBtn = document.getElementById('download-template');
const addMoreBtn = document.getElementById('add-more');
const contactsContainer = document.getElementById('contacts-container');
const contactsList = document.getElementById('contacts-list');
const clearAllBtn = document.getElementById('clear-all');
const saveContactsBtn = document.getElementById('save-contacts');
const searchInput = document.getElementById('search-contacts');
const filterGroup = document.getElementById('filter-group');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');
const closeNotificationBtn = document.getElementById('close-notification');

// Global variables
let contacts = [];
let contactCounter = 1;
let groups = new Set();

// Initialize the application
function init() {
    // Load contacts from localStorage if available
    loadContacts();
    
    // Set up event listeners
    setupEventListeners();
}

// Set up all event listeners
function setupEventListeners() {
    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // CSV file upload
    fileUploadArea.addEventListener('click', () => csvFileInput.click());
    csvFileInput.addEventListener('change', handleFileUpload);
    fileUploadArea.addEventListener('dragover', e => {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
    });
    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.classList.remove('dragover');
    });
    fileUploadArea.addEventListener('drop', e => {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
        
        if (e.dataTransfer.files.length) {
            csvFileInput.files = e.dataTransfer.files;
            handleFileUpload();
        }
    });

    // Download CSV template
    downloadTemplateBtn.addEventListener('click', downloadTemplate);

    // Manual entry
    addMoreBtn.addEventListener('click', addContactEntry);

    // Actions
    clearAllBtn.addEventListener('click', clearAllContacts);
    saveContactsBtn.addEventListener('click', saveContacts);
    
    // Search and filter
    searchInput.addEventListener('input', filterContacts);
    filterGroup.addEventListener('change', filterContacts);
    
    // Notification
    closeNotificationBtn.addEventListener('click', hideNotification);
}

// Switch between tabs
function switchTab(tabId) {
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tabId) {
            btn.classList.add('active');
        }
    });
    
    tabPanes.forEach(pane => {
        pane.classList.remove('active');
        if (pane.id === tabId) {
            pane.classList.add('active');
        }
    });
}

// Handle CSV file upload
function handleFileUpload() {
    const file = csvFileInput.files[0];
    
    if (!file) {
        return;
    }
    
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        showNotification('Please select a valid CSV file.', 'error');
        return;
    }
    
    fileInfo.innerHTML = `<p><strong>${file.name}</strong> (${formatFileSize(file.size)})</p>`;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const csvData = e.target.result;
            const parsedContacts = parseCSV(csvData);
            
            if (parsedContacts.length > 0) {
                contacts = [...contacts, ...parsedContacts];
                updateGroupsFilter();
                renderContactsTable();
                showNotification(`Successfully imported ${parsedContacts.length} contacts.`, 'success');
            } else {
                showNotification('No valid contacts found in the CSV file.', 'warning');
            }
        } catch (error) {
            showNotification('Error parsing CSV file. Please check the format.', 'error');
            console.error(error);
        }
    };
    
    reader.onerror = function() {
        showNotification('Error reading the file.', 'error');
    };
    
    reader.readAsText(file);
}

// Parse CSV data
function parseCSV(csvData) {
    const lines = csvData.split(/\\r?\\n/);
    const result = [];
    
    // Check if there's a header row
    const headerRow = lines[0].split(',');
    const hasHeader = headerRow.some(header => 
        ['name', 'email', 'phone', 'group'].includes(header.toLowerCase().trim())
    );
    
    const startIndex = hasHeader ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',');
        if (values.length >= 3) {
            const contact = {
                id: generateId(),
                name: values[0].trim(),
                email: values[1].trim(),
                phone: values[2].trim(),
                group: values[3] ? values[3].trim() : ''
            };
            
            if (contact.name && (contact.email || contact.phone)) {
                result.push(contact);
                if (contact.group) {
                    groups.add(contact.group);
                }
            }
        }
    }
    
    return result;
}

// Format file size
function formatFileSize(bytes) {
    if (bytes < 1024) {
        return bytes + ' bytes';
    } else if (bytes < 1048576) {
        return (bytes / 1024).toFixed(1) + ' KB';
    } else {
        return (bytes / 1048576).toFixed(1) + ' MB';
    }
}

// Download CSV template
function downloadTemplate(e) {
    e.preventDefault();
    
    const templateContent = 'Name,Email,Phone,Group\nJohn Doe,john@example.com,123-456-7890,Friends\nJane Smith,jane@example.com,987-654-3210,Work';
    const blob = new Blob([templateContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Add a new contact entry form
function addContactEntry() {
    contactCounter++;
    
    const entryDiv = document.createElement('div');
    entryDiv.className = 'contact-entry';
    entryDiv.innerHTML = `
        <div class="form-group">
            <label for="name-${contactCounter}">Name</label>
            <input type="text" id="name-${contactCounter}" class="contact-name" placeholder="Full Name">
        </div>
        <div class="form-group">
            <label for="email-${contactCounter}">Email</label>
            <input type="email" id="email-${contactCounter}" class="contact-email" placeholder="Email Address">
        </div>
        <div class="form-group">
            <label for="phone-${contactCounter}">Phone</label>
            <input type="tel" id="phone-${contactCounter}" class="contact-phone" placeholder="Phone Number">
        </div>
        <div class="form-group">
            <label for="group-${contactCounter}">Group</label>
            <input type="text" id="group-${contactCounter}" class="contact-group" placeholder="Group/Category">
        </div>
        <button class="remove-entry" onclick="removeEntry(this)"><i class="fas fa-times"></i></button>
    `;
    
    contactsContainer.appendChild(entryDiv);
}

// Remove a contact entry form
function removeEntry(button) {
    const entryDiv = button.parentElement;
    contactsContainer.removeChild(entryDiv);
}

// Clear all contacts
function clearAllContacts() {
    if (contacts.length === 0) {
        showNotification('No contacts to clear.', 'warning');
        return;
    }
    
    if (confirm('Are you sure you want to clear all contacts? This cannot be undone.')) {
        contacts = [];
        groups = new Set();
        updateGroupsFilter();
        renderContactsTable();
        localStorage.removeItem('contacts');
        showNotification('All contacts have been cleared.', 'success');
    }
}

// Save contacts from manual entry
function saveContacts() {
    const manualEntries = document.querySelectorAll('.contact-entry');
    let newContacts = [];
    let hasValidContact = false;
    
    manualEntries.forEach(entry => {
        const nameInput = entry.querySelector('.contact-name');
        const emailInput = entry.querySelector('.contact-email');
        const phoneInput = entry.querySelector('.contact-phone');
        const groupInput = entry.querySelector('.contact-group');
        
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const phone = phoneInput.value.trim();
        const group = groupInput.value.trim();
        
        if (name && (email || phone)) {
            hasValidContact = true;
            const contact = {
                id: generateId(),
                name,
                email,
                phone,
                group
            };
            
            newContacts.push(contact);
            
            if (group) {
                groups.add(group);
            }
            
            // Clear inputs after saving
            nameInput.value = '';
            emailInput.value = '';
            phoneInput.value = '';
            groupInput.value = '';
        }
    });
    
    if (hasValidContact) {
        contacts = [...contacts, ...newContacts];
        updateGroupsFilter();
        renderContactsTable();
        saveContactsToStorage();
        showNotification(`${newContacts.length} contacts have been saved.`, 'success');
    } else {
        showNotification('Please enter at least one valid contact with name and email/phone.', 'warning');
    }
}

// Generate a unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Render contacts table
function renderContactsTable() {
    if (contacts.length === 0) {
        contactsList.innerHTML = `
            <tr class="empty-state">
                <td colspan="5">
                    <div class="empty-message">
                        <i class="fas fa-users-slash"></i>
                        <p>No contacts added yet</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    const searchTerm = searchInput.value.toLowerCase();
    const selectedGroup = filterGroup.value;
    
    const filteredContacts = contacts.filter(contact => {
        const matchesSearch = 
            contact.name.toLowerCase().includes(searchTerm) ||
            contact.email.toLowerCase().includes(searchTerm) ||
            contact.phone.toLowerCase().includes(searchTerm) ||
            contact.group.toLowerCase().includes(searchTerm);
            
        const matchesGroup = selectedGroup === '' || contact.group === selectedGroup;
        
        return matchesSearch && matchesGroup;
    });
    
    if (filteredContacts.length === 0) {
        contactsList.innerHTML = `
            <tr class="empty-state">
                <td colspan="5">
                    <div class="empty-message">
                        <i class="fas fa-search"></i>
                        <p>No contacts match your search</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    contactsList.innerHTML = filteredContacts.map(contact => `
        <tr data-id="${contact.id}">
            <td>${contact.name}</td>
            <td>${contact.email}</td>
            <td>${contact.phone}</td>
            <td>${contact.group}</td>
            <td>
                <button class="btn-action edit-contact" onclick="editContact('${contact.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action delete-contact" onclick="deleteContact('${contact.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Edit a contact
function editContact(id) {
    const contact = contacts.find(c => c.id === id);
    
    if (!contact) return;
    
    // Switch to manual entry tab
    switchTab('manual-tab');
    
    // Add a new entry form if there are none
    if (contactsContainer.children.length === 0) {
        addContactEntry();
    }
    
    // Fill the first entry form with the contact data
    const entryForm = contactsContainer.children[0];
    entryForm.querySelector('.contact-name').value = contact.name;
    entryForm.querySelector('.contact-email').value = contact.email;
    entryForm.querySelector('.contact-phone').value = contact.phone;
    entryForm.querySelector('.contact-group').value = contact.group;
    
    // Delete the contact
    deleteContact(id, false);
    
    showNotification('Contact loaded for editing.', 'success');
}

// Delete a contact
function deleteContact(id, showConfirm = true) {
    if (showConfirm && !confirm('Are you sure you want to delete this contact?')) {
        return;
    }
    
    const index = contacts.findIndex(c => c.id === id);
    
    if (index !== -1) {
        contacts.splice(index, 1);
        
        // Rebuild groups
        groups = new Set();
        contacts.forEach(contact => {
            if (contact.group) {
                groups.add(contact.group);
            }
        });
        
        updateGroupsFilter();
        renderContactsTable();
        saveContactsToStorage();
        
        if (showConfirm) {
            showNotification('Contact deleted successfully.', 'success');
        }
    }
}

// Filter contacts based on search and group
function filterContacts() {
    renderContactsTable();
}

// Update groups filter dropdown
function updateGroupsFilter() {
    const currentValue = filterGroup.value;
    
    // Clear all options except the first one
    while (filterGroup.options.length > 1) {
        filterGroup.remove(1);
    }
    
    // Add group options
    Array.from(groups).sort().forEach(group => {
        const option = document.createElement('option');
        option.value = group;
        option.textContent = group;
        filterGroup.appendChild(option);
    });
    
    // Restore selected value if it still exists
    if (Array.from(groups).includes(currentValue)) {
        filterGroup.value = currentValue;
    }
}

// Save contacts to localStorage
function saveContactsToStorage() {
    localStorage.setItem('contacts', JSON.stringify(contacts));
}

// Load contacts from localStorage
function loadContacts() {
    const savedContacts = localStorage.getItem('contacts');
    
    if (savedContacts) {
        contacts = JSON.parse(savedContacts);
        
        // Rebuild groups
        groups = new Set();
        contacts.forEach(contact => {
            if (contact.group) {
                groups.add(contact.group);
            }
        });
        
        updateGroupsFilter();
        renderContactsTable();
    }
}

// Show notification
function showNotification(message, type = 'success') {
    notificationMessage.textContent = message;
    notification.className = 'notification ' + type;
    notification.classList.add('show');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

// Hide notification
function hideNotification() {
    notification.classList.remove('show');
}

// Make functions available globally
window.removeEntry = removeEntry;
window.editContact = editContact;
window.deleteContact = deleteContact;

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
