// Global state and configuration
let conceptMaps = [];
let currentEditingId = null;
let currentTab = 'home';

// API Base URL - adjust this to match your FastAPI server
const API_BASE_URL = 'http://127.0.0.1:8000';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    switchTab('home');
});

// Initialize application
async function initializeApp() {
    await checkApiHealth();
    await loadConceptMaps();
    updateStats();
}

// Setup all event listeners
function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Search form
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }

    // Create ConceptMap form
    const createForm = document.getElementById('create-form');
    if (createForm) {
        createForm.addEventListener('submit', handleCreateConceptMap);
    }

    // Update ConceptMap form
    const updateForm = document.getElementById('update-form');
    if (updateForm) {
        updateForm.addEventListener('submit', handleUpdateConceptMap);
    }

    // Add element button
    const addElementBtn = document.getElementById('add-element-btn');
    if (addElementBtn) {
        addElementBtn.addEventListener('click', addElementToForm);
    }

    // Patient search form
    const patientSearchForm = document.getElementById('patient-search-form');
    if (patientSearchForm) {
        patientSearchForm.addEventListener('submit', handlePatientSearch);
    }
}

// Tab switching functionality
function switchTab(tabName) {
    // Update navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');

    currentTab = tabName;

    // Load data for specific tabs
    if (tabName === 'manage') {
        displayConceptMaps();
    }
}

// API Functions
async function makeApiRequest(endpoint, method = 'GET', data = null) {
    const config = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        showLoading(false);
        return result;
    } catch (error) {
        showLoading(false);
        console.error('API request failed:', error);
        showToast('API request failed: ' + error.message, 'error');
        throw error;
    }
}

async function checkApiHealth() {
    try {
        const health = await makeApiRequest('/health');
        const statusElement = document.getElementById('api-status');
        if (statusElement) {
            statusElement.textContent = 'Online';
            statusElement.className = 'status status--success';
        }
        return health;
    } catch (error) {
        const statusElement = document.getElementById('api-status');
        if (statusElement) {
            statusElement.textContent = 'Offline';
            statusElement.className = 'status status--error';
        }
    }
}

async function loadConceptMaps() {
    try {
        const response = await makeApiRequest('/conceptmaps');
        conceptMaps = Array.isArray(response) ? response : [response];
        updateStats();
        return conceptMaps;
    } catch (error) {
        console.error('Failed to load ConceptMaps:', error);
        conceptMaps = [];
    }
}

// Search functionality
async function handleSearch(event) {
    event.preventDefault();
    const searchInput = document.getElementById('search-input');
    const searchCode = searchInput.value.trim();

    if (!searchCode) {
        showToast('Please enter a code to search', 'warning');
        return;
    }

    try {
        const conceptMap = await makeApiRequest(`/conceptmaps/${encodeURIComponent(searchCode)}`);
        displaySearchResults(conceptMap);
        showToast('Search completed successfully', 'success');
    } catch (error) {
        displaySearchResults(null);
        showToast('No ConceptMap found with that code', 'error');
    }
}

function displaySearchResults(conceptMap) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;

    if (!conceptMap) {
        resultsContainer.innerHTML = `
            <div class="card">
                <div class="card__body">
                    <p>No ConceptMap found.</p>
                </div>
            </div>
        `;
        return;
    }

    resultsContainer.innerHTML = `
        <div class="card">
            <div class="card__header">
                <h3>${conceptMap.title || conceptMap.name}</h3>
                <div class="card__actions">
                    <button class="btn btn--secondary" onclick="viewJsonDetails('${conceptMap.id}')">
                        View JSON
                    </button>
                    <button class="btn btn--primary" onclick="editConceptMap('${conceptMap.id}')">
                        Edit
                    </button>
                </div>
            </div>
            <div class="card__body">
                <div class="info-grid">
                    <div class="info-item">
                        <label>ID:</label>
                        <span>${conceptMap.id}</span>
                    </div>
                    <div class="info-item">
                        <label>Status:</label>
                        <span class="badge badge--${conceptMap.status === 'active' ? 'success' : 'warning'}">
                            ${conceptMap.status}
                        </span>
                    </div>
                    <div class="info-item">
                        <label>Version:</label>
                        <span>${conceptMap.version || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <label>Publisher:</label>
                        <span>${conceptMap.publisher || 'N/A'}</span>
                    </div>
                </div>
                ${renderConceptMapElements(conceptMap)}
            </div>
        </div>
    `;
}

// Patient search functionality
async function handlePatientSearch(event) {
    event.preventDefault();
    const symptomInput = document.getElementById('symptom-input');
    const symptom = symptomInput.value.trim();

    if (!symptom) {
        showToast('Please enter a symptom to search', 'warning');
        return;
    }

    try {
        const response = await makeApiRequest('/patients/search', 'POST', { symptom: symptom });
        displayPatientSearchResults(response.matches);
        showToast('Patient search completed', 'success');
    } catch (error) {
        displayPatientSearchResults([]);
        showToast('No matches found for the symptom', 'error');
    }
}

function displayPatientSearchResults(matches) {
    const resultsContainer = document.getElementById('patient-search-results');
    if (!resultsContainer || !matches) return;

    if (matches.length === 0) {
        resultsContainer.innerHTML = `
            <div class="card">
                <div class="card__body">
                    <p>No matches found.</p>
                </div>
            </div>
        `;
        return;
    }

    const resultsHtml = matches.map(match => `
        <div class="card">
            <div class="card__body">
                <h4>${match.display}</h4>
                <p><strong>Source Code:</strong> ${match.sourceCode}</p>
                ${match.targets ? match.targets.map(target => `
                    <div class="target-info">
                        <p><strong>Target:</strong> ${target.display} (${target.targetCode})</p>
                        <p><strong>Equivalence:</strong> ${target.equivalence}</p>
                        ${target.similarity ? `<p><strong>Similarity:</strong> ${target.similarity}%</p>` : ''}
                    </div>
                `).join('') : ''}
            </div>
        </div>
    `).join('');

    resultsContainer.innerHTML = resultsHtml;
}

// Create ConceptMap functionality
async function handleCreateConceptMap(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const conceptMap = buildConceptMapFromForm(formData);

    try {
        const newConceptMap = await makeApiRequest('/conceptmaps', 'POST', conceptMap);
        showToast('ConceptMap created successfully', 'success');
        await loadConceptMaps();
        event.target.reset();
        
        // Clear dynamic elements
        const elementsContainer = document.getElementById('elements-container');
        if (elementsContainer) {
            elementsContainer.innerHTML = '';
            addElementToForm(); // Add one empty element
        }
    } catch (error) {
        showToast('Failed to create ConceptMap', 'error');
    }
}

// Update ConceptMap functionality
async function handleUpdateConceptMap(event) {
    event.preventDefault();
    
    if (!currentEditingId) {
        showToast('No ConceptMap selected for editing', 'error');
        return;
    }

    const formData = new FormData(event.target);
    const conceptMap = buildConceptMapFromForm(formData);

    try {
        const updatedConceptMap = await makeApiRequest(`/conceptmaps/${currentEditingId}`, 'PUT', conceptMap);
        showToast('ConceptMap updated successfully', 'success');
        await loadConceptMaps();
        currentEditingId = null;
    } catch (error) {
        showToast('Failed to update ConceptMap', 'error');
    }
}

// Build ConceptMap object from form data
function buildConceptMapFromForm(formData) {
    const conceptMap = {
        resourceType: 'ConceptMap',
        id: formData.get('id'),
        name: formData.get('name'),
        title: formData.get('title'),
        status: formData.get('status'),
        version: formData.get('version'),
        publisher: formData.get('publisher'),
        group: [{
            source: formData.get('source') || 'NAMASTE',
            target: formData.get('target') || 'ICD-11',
            element: []
        }]
    };

    // Collect elements from the form
    const elements = document.querySelectorAll('.element-row');
    elements.forEach(elementRow => {
        const code = elementRow.querySelector('[name^="element-code"]').value;
        const display = elementRow.querySelector('[name^="element-display"]').value;
        
        if (code && display) {
            const element = {
                code: code,
                display: display,
                target: []
            };

            // Collect targets for this element
            const targetRows = elementRow.querySelectorAll('.target-row');
            targetRows.forEach(targetRow => {
                const targetCode = targetRow.querySelector('[name^="target-code"]').value;
                const targetDisplay = targetRow.querySelector('[name^="target-display"]').value;
                const equivalence = targetRow.querySelector('[name^="target-equivalence"]').value;
                const similarity = targetRow.querySelector('[name^="target-similarity"]').value;

                if (targetCode && targetDisplay) {
                    const target = {
                        code: targetCode,
                        display: targetDisplay,
                        equivalence: equivalence || 'equivalent'
                    };

                    if (similarity) {
                        target.extension = [{
                            url: 'http://example.org/fhir/ConceptMap/extension/similarity',
                            valueDecimal: parseFloat(similarity)
                        }];
                    }

                    element.target.push(target);
                }
            });

            conceptMap.group[0].element.push(element);
        }
    });

    return conceptMap;
}

// Dynamic form management
function addElementToForm() {
    const container = document.getElementById('elements-container');
    if (!container) return;

    const elementIndex = container.children.length;
    const elementHtml = `
        <div class="element-row card">
            <div class="card__header">
                <h4>Element ${elementIndex + 1}</h4>
                <button type="button" class="btn btn--danger btn--small" onclick="removeElement(this)">
                    Remove
                </button>
            </div>
            <div class="card__body">
                <div class="form-row">
                    <div class="form-group">
                        <label>Source Code:</label>
                        <input type="text" name="element-code-${elementIndex}" required>
                    </div>
                    <div class="form-group">
                        <label>Display:</label>
                        <input type="text" name="element-display-${elementIndex}" required>
                    </div>
                </div>
                <div class="targets-container">
                    <h5>Targets:</h5>
                    <div class="target-row">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Target Code:</label>
                                <input type="text" name="target-code-${elementIndex}-0" required>
                            </div>
                            <div class="form-group">
                                <label>Target Display:</label>
                                <input type="text" name="target-display-${elementIndex}-0" required>
                            </div>
                            <div class="form-group">
                                <label>Equivalence:</label>
                                <select name="target-equivalence-${elementIndex}-0">
                                    <option value="equivalent">Equivalent</option>
                                    <option value="narrower">Narrower</option>
                                    <option value="broader">Broader</option>
                                    <option value="inexact">Inexact</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Similarity (%):</label>
                                <input type="number" name="target-similarity-${elementIndex}-0" min="0" max="100" step="0.1">
                            </div>
                        </div>
                    </div>
                </div>
                <button type="button" class="btn btn--secondary btn--small" onclick="addTarget(this)">
                    Add Target
                </button>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', elementHtml);
}

function removeElement(button) {
    button.closest('.element-row').remove();
}

function addTarget(button) {
    const targetsContainer = button.previousElementSibling;
    const elementRow = button.closest('.element-row');
    const elementIndex = Array.from(elementRow.parentNode.children).indexOf(elementRow);
    const targetIndex = targetsContainer.children.length;

    const targetHtml = `
        <div class="target-row">
            <div class="form-row">
                <div class="form-group">
                    <label>Target Code:</label>
                    <input type="text" name="target-code-${elementIndex}-${targetIndex}" required>
                </div>
                <div class="form-group">
                    <label>Target Display:</label>
                    <input type="text" name="target-display-${elementIndex}-${targetIndex}" required>
                </div>
                <div class="form-group">
                    <label>Equivalence:</label>
                    <select name="target-equivalence-${elementIndex}-${targetIndex}">
                        <option value="equivalent">Equivalent</option>
                        <option value="narrower">Narrower</option>
                        <option value="broader">Broader</option>
                        <option value="inexact">Inexact</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Similarity (%):</label>
                    <input type="number" name="target-similarity-${elementIndex}-${targetIndex}" min="0" max="100" step="0.1">
                </div>
                <div class="form-group">
                    <button type="button" class="btn btn--danger btn--small" onclick="removeTarget(this)">
                        Remove
                    </button>
                </div>
            </div>
        </div>
    `;

    targetsContainer.insertAdjacentHTML('beforeend', targetHtml);
}

function removeTarget(button) {
    button.closest('.target-row').remove();
}

// Manage ConceptMaps
function displayConceptMaps() {
    const container = document.getElementById('conceptmaps-list');
    if (!container || !conceptMaps.length) {
        if (container) {
            container.innerHTML = `
                <div class="card">
                    <div class="card__body">
                        <p>No ConceptMaps available.</p>
                    </div>
                </div>
            `;
        }
        return;
    }

    const conceptMapsHtml = conceptMaps.map(cm => `
        <div class="card">
            <div class="card__header">
                <h3>${cm.title || cm.name}</h3>
                <div class="card__actions">
                    <button class="btn btn--secondary" onclick="viewJsonDetails('${cm.id}')">
                        JSON
                    </button>
                    <button class="btn btn--primary" onclick="editConceptMap('${cm.id}')">
                        Edit
                    </button>
                    <button class="btn btn--danger" onclick="deleteConceptMap('${cm.id}')">
                        Delete
                    </button>
                </div>
            </div>
            <div class="card__body">
                <div class="info-grid">
                    <div class="info-item">
                        <label>ID:</label>
                        <span>${cm.id}</span>
                    </div>
                    <div class="info-item">
                        <label>Status:</label>
                        <span class="badge badge--${cm.status === 'active' ? 'success' : 'warning'}">
                            ${cm.status}
                        </span>
                    </div>
                    <div class="info-item">
                        <label>Version:</label>
                        <span>${cm.version || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <label>Elements:</label>
                        <span>${cm.group && cm.group[0] ? cm.group[0].element.length : 0}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = conceptMapsHtml;
}

// ConceptMap management functions
async function editConceptMap(id) {
    const conceptMap = conceptMaps.find(cm => cm.id === id);
    if (!conceptMap) return;

    currentEditingId = id;
    switchTab('create'); // Reuse create form for editing

    // Populate form with existing data
    populateFormWithConceptMap(conceptMap);
    
    // Update form title
    const formTitle = document.querySelector('#create h2');
    if (formTitle) {
        formTitle.textContent = 'Update ConceptMap';
    }

    showToast('Editing ConceptMap: ' + conceptMap.name, 'info');
}

function populateFormWithConceptMap(conceptMap) {
    // Populate basic fields
    const fields = ['id', 'name', 'title', 'status', 'version', 'publisher'];
    fields.forEach(field => {
        const input = document.querySelector(`[name="${field}"]`);
        if (input) {
            input.value = conceptMap[field] || '';
        }
    });

    // Populate source and target
    const sourceInput = document.querySelector('[name="source"]');
    const targetInput = document.querySelector('[name="target"]');
    if (conceptMap.group && conceptMap.group[0]) {
        if (sourceInput) sourceInput.value = conceptMap.group[0].source || 'NAMASTE';
        if (targetInput) targetInput.value = conceptMap.group[0].target || 'ICD-11';
    }

    // Clear existing elements
    const elementsContainer = document.getElementById('elements-container');
    if (elementsContainer) {
        elementsContainer.innerHTML = '';
    }

    // Populate elements
    if (conceptMap.group && conceptMap.group[0] && conceptMap.group[0].element) {
        conceptMap.group[0].element.forEach(element => {
            addElementToForm();
            const elementRow = elementsContainer.lastElementChild;
            
            // Fill element data
            elementRow.querySelector('[name^="element-code"]').value = element.code;
            elementRow.querySelector('[name^="element-display"]').value = element.display;

            // Clear default target and add actual targets
            const targetsContainer = elementRow.querySelector('.targets-container');
            targetsContainer.innerHTML = '<h5>Targets:</h5>';

            element.target.forEach(target => {
                addTarget(elementRow.querySelector('button'));
                const targetRow = targetsContainer.lastElementChild;
                
                targetRow.querySelector('[name^="target-code"]').value = target.code;
                targetRow.querySelector('[name^="target-display"]').value = target.display;
                targetRow.querySelector('[name^="target-equivalence"]').value = target.equivalence || 'equivalent';
                
                if (target.extension && target.extension[0] && target.extension[0].valueDecimal) {
                    targetRow.querySelector('[name^="target-similarity"]').value = target.extension[0].valueDecimal;
                }
            });
        });
    }
}

async function deleteConceptMap(id) {
    if (!confirm('Are you sure you want to delete this ConceptMap? This action cannot be undone.')) {
        return;
    }

    try {
        await makeApiRequest(`/conceptmaps/${id}`, 'DELETE');
        showToast('ConceptMap deleted successfully', 'success');
        await loadConceptMaps();
        displayConceptMaps();
    } catch (error) {
        showToast('Failed to delete ConceptMap', 'error');
    }
}

function viewJsonDetails(id) {
    const conceptMap = conceptMaps.find(cm => cm.id === id);
    if (!conceptMap) return;

    showModal('ConceptMap JSON Details', `
        <pre class="json-viewer">${JSON.stringify(conceptMap, null, 2)}</pre>
    `);
}

// Translation functionality
async function translateCode(code) {
    try {
        const response = await makeApiRequest('/ConceptMap/$translate', 'POST', {
            code: code,
            system: 'namaste'
        });
        return response.matches;
    } catch (error) {
        console.error('Translation failed:', error);
        return [];
    }
}

// Helper functions
function renderConceptMapElements(conceptMap) {
    if (!conceptMap.group || !conceptMap.group[0] || !conceptMap.group[0].element) {
        return '<p>No elements found.</p>';
    }

    const elements = conceptMap.group[0].element;
    return `
        <div class="elements-list">
            <h4>Code Mappings (${elements.length} elements):</h4>
            ${elements.map(element => `
                <div class="element-card">
                    <div class="element-header">
                        <strong>${element.code}</strong> - ${element.display}
                    </div>
                    <div class="targets-list">
                        ${element.target ? element.target.map(target => `
                            <div class="target-item">
                                <span class="target-code">${target.code}</span>
                                <span class="target-display">${target.display}</span>
                                <span class="badge badge--primary">${target.equivalence}</span>
                                ${target.extension && target.extension[0] ? 
                                    `<span class="similarity">${target.extension[0].valueDecimal}%</span>` : 
                                    ''
                                }
                            </div>
                        `).join('') : '<p>No targets</p>'}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function updateStats() {
    const totalElement = document.getElementById('total-concepts');
    if (totalElement) {
        totalElement.textContent = conceptMaps.length;
    }

    const elementsElement = document.getElementById('total-elements');
    if (elementsElement) {
        const totalElements = conceptMaps.reduce((sum, cm) => {
            return sum + (cm.group && cm.group[0] ? cm.group[0].element.length : 0);
        }, 0);
        elementsElement.textContent = totalElements;
    }
}

// UI Helper functions
function showLoading(show) {
    const loader = document.getElementById('loading');
    if (loader) {
        loader.style.display = show ? 'block' : 'none';
    }
}

function showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
        <div class="toast__content">
            <span class="toast__message">${message}</span>
            <button class="toast__close" onclick="this.parentElement.parentElement.remove()">Ã—</button>
        </div>
    `;

    document.body.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast && toast.parentNode) {
            toast.remove();
        }
    }, 5000);
}

function showModal(title, content) {
    // Remove existing modal
    const existingModal = document.getElementById('modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal__backdrop" onclick="closeModal()"></div>
        <div class="modal__content">
            <div class="modal__header">
                <h3>${title}</h3>
                <button class="modal__close" onclick="closeModal()">Ã—</button>
            </div>
            <div class="modal__body">
                ${content}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.remove();
    }
}

// Initialize form with one empty element when create tab is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const elementsContainer = document.getElementById('elements-container');
        if (elementsContainer && elementsContainer.children.length === 0) {
            addElementToForm();
        }
    }, 100);
});

// Export functions for global access
window.editConceptMap = editConceptMap;
window.deleteConceptMap = deleteConceptMap;
window.viewJsonDetails = viewJsonDetails;
window.removeElement = removeElement;
window.addTarget = addTarget;
window.removeTarget = removeTarget;
window.closeModal = closeModal;