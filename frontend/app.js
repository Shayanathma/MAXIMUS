// Global state and configuration
let conceptMaps = [];
let currentEditingId = null;
let currentTab = 'home';

// API Base URL - matches your FastAPI server
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
    // Initialize form with one empty element
    setTimeout(() => {
        const elementsContainer = document.getElementById('elements-container');
        if (elementsContainer && elementsContainer.children.length === 0) {
            addElementToForm();
        }
    }, 100);
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
    } else if (tabName === 'create') {
        // Reset editing mode when switching to create
        currentEditingId = null;
        const formTitle = document.querySelector('#create h2');
        if (formTitle) {
            formTitle.textContent = 'Create New ConceptMap';
        }
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
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || errorMessage;
            } catch (e) {
                // If error response is not JSON, use default message
            }
            throw new Error(errorMessage);
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
                <div class="result-metadata">
                    <div class="metadata-item">
                        <span class="metadata-label">ID:</span>
                        <span class="metadata-value">${conceptMap.id}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Status:</span>
                        <span class="status status--${conceptMap.status === 'active' ? 'success' : 'warning'}">
                            ${conceptMap.status}
                        </span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Version:</span>
                        <span class="metadata-value">${conceptMap.version || 'N/A'}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Publisher:</span>
                        <span class="metadata-value">${conceptMap.publisher || 'N/A'}</span>
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
    if (!resultsContainer) return;

    if (!matches || matches.length === 0) {
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
                    <div class="target-item">
                        <span><strong>Target:</strong> ${target.display} (${target.targetCode})</span>
                        <span><strong>Equivalence:</strong> ${target.equivalence}</span>
                        ${target.similarity ? `<span class="similarity-score">${target.similarity}%</span>` : ''}
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
        if (currentEditingId) {
            // Update existing ConceptMap
            await makeApiRequest(`/conceptmaps/${currentEditingId}`, 'PUT', conceptMap);
            showToast('ConceptMap updated successfully', 'success');
            currentEditingId = null;
            
            // Reset form title
            const formTitle = document.querySelector('#create h2');
            if (formTitle) {
                formTitle.textContent = 'Create New ConceptMap';
            }
        } else {
            // Create new ConceptMap
            await makeApiRequest('/conceptmaps', 'POST', conceptMap);
            showToast('ConceptMap created successfully', 'success');
        }
        
        await loadConceptMaps();
        event.target.reset();
        clearElements();
        addElementToForm(); // Add one empty element
        
    } catch (error) {
        const action = currentEditingId ? 'update' : 'create';
        showToast(`Failed to ${action} ConceptMap`, 'error');
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
        version: formData.get('version') || undefined,
        publisher: formData.get('publisher') || undefined,
        group: [{
            source: 'NAMASTE',
            target: 'ICD-11',
            element: []
        }]
    };

    // Collect elements from the form
    const elements = document.querySelectorAll('.element-group');
    elements.forEach(elementDiv => {
        const code = elementDiv.querySelector('[name^="element-code"]').value;
        const display = elementDiv.querySelector('[name^="element-display"]').value;
        
        if (code && display) {
            const element = {
                code: code,
                display: display,
                target: []
            };

            // Collect targets for this element
            const targetDivs = elementDiv.querySelectorAll('.target-group');
            targetDivs.forEach(targetDiv => {
                const targetCode = targetDiv.querySelector('[name^="target-code"]').value;
                const targetDisplay = targetDiv.querySelector('[name^="target-display"]').value;
                const equivalence = targetDiv.querySelector('[name^="target-equivalence"]').value;
                const similarity = targetDiv.querySelector('[name^="target-similarity"]').value;

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

            if (element.target.length > 0) {
                conceptMap.group[0].element.push(element);
            }
        }
    });

    return conceptMap;
}

// Dynamic form management
function addElementToForm() {
    const container = document.getElementById('elements-container');
    if (!container) return;

    const elementIndex = container.children.length;
    const elementDiv = document.createElement('div');
    elementDiv.className = 'element-group';
    elementDiv.innerHTML = `
        <div class="element-group-header">
            <h4 class="element-group-title">Element ${elementIndex + 1}</h4>
            <button type="button" class="btn btn--secondary btn--sm" onclick="removeElement(this)">
                Remove
            </button>
        </div>
        <div class="form-grid">
            <div class="form-group">
                <label class="form-label">Source Code:</label>
                <input type="text" name="element-code-${elementIndex}" class="form-control" required>
            </div>
            <div class="form-group">
                <label class="form-label">Display Name:</label>
                <input type="text" name="element-display-${elementIndex}" class="form-control" required>
            </div>
        </div>
        <div class="targets-container">
            <h5>Target Mappings:</h5>
        </div>
        <button type="button" class="btn btn--secondary btn--sm" onclick="addTarget(this)">
            Add Target
        </button>
    `;

    container.appendChild(elementDiv);
    
    // Add one default target
    addTarget(elementDiv.querySelector('button'));
}

function removeElement(button) {
    button.closest('.element-group').remove();
}

function addTarget(button) {
    const elementDiv = button.closest('.element-group');
    const targetsContainer = elementDiv.querySelector('.targets-container');
    const elementIndex = Array.from(elementDiv.parentNode.children).indexOf(elementDiv);
    const targetIndex = targetsContainer.children.length - 1; // -1 for the h5

    const targetDiv = document.createElement('div');
    targetDiv.className = 'target-group';
    targetDiv.innerHTML = `
        <div class="target-group-header">
            <span class="target-group-title">Target ${targetIndex + 1}</span>
            <button type="button" class="btn btn--secondary btn--sm" onclick="removeTarget(this)">
                Remove
            </button>
        </div>
        <div class="form-grid">
            <div class="form-group">
                <label class="form-label">Target Code:</label>
                <input type="text" name="target-code-${elementIndex}-${targetIndex}" class="form-control" required>
            </div>
            <div class="form-group">
                <label class="form-label">Target Display:</label>
                <input type="text" name="target-display-${elementIndex}-${targetIndex}" class="form-control" required>
            </div>
            <div class="form-group">
                <label class="form-label">Equivalence:</label>
                <select name="target-equivalence-${elementIndex}-${targetIndex}" class="form-control">
                    <option value="equivalent">Equivalent</option>
                    <option value="narrower">Narrower</option>
                    <option value="broader">Broader</option>
                    <option value="inexact">Inexact</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Similarity (%):</label>
                <input type="number" name="target-similarity-${elementIndex}-${targetIndex}" class="form-control" min="0" max="100" step="0.1">
            </div>
        </div>
    `;

    targetsContainer.appendChild(targetDiv);
}

function removeTarget(button) {
    button.closest('.target-group').remove();
}

function clearElements() {
    const container = document.getElementById('elements-container');
    if (container) {
        container.innerHTML = '';
    }
}

// Manage ConceptMaps
function displayConceptMaps() {
    const container = document.getElementById('conceptmaps-list');
    if (!container) return;

    if (!conceptMaps.length) {
        container.innerHTML = `
            <div class="card">
                <div class="card__body">
                    <p>No ConceptMaps available.</p>
                </div>
            </div>
        `;
        return;
    }

    const conceptMapsHtml = conceptMaps.map(cm => `
        <div class="card">
            <div class="result-header">
                <h3>${cm.title || cm.name}</h3>
                <div class="table-actions">
                    <button class="btn btn--secondary btn--sm" onclick="viewJsonDetails('${cm.id}')">
                        JSON
                    </button>
                    <button class="btn btn--primary btn--sm" onclick="editConceptMap('${cm.id}')">
                        Edit
                    </button>
                    <button class="btn btn--secondary btn--sm" onclick="deleteConceptMap('${cm.id}')">
                        Delete
                    </button>
                </div>
            </div>
            <div class="card__body">
                <div class="result-metadata">
                    <div class="metadata-item">
                        <span class="metadata-label">ID:</span>
                        <span class="metadata-value">${cm.id}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Status:</span>
                        <span class="status status--${cm.status === 'active' ? 'success' : 'warning'}">
                            ${cm.status}
                        </span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Version:</span>
                        <span class="metadata-value">${cm.version || 'N/A'}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Elements:</span>
                        <span class="metadata-value">${cm.group && cm.group[0] ? cm.group[0].element.length : 0}</span>
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
    switchTab('create');

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

    // Clear existing elements
    clearElements();

    // Populate elements
    if (conceptMap.group && conceptMap.group[0] && conceptMap.group[0].element) {
        conceptMap.group[0].element.forEach((element, elementIndex) => {
            addElementToForm();
            const elementDiv = document.querySelectorAll('.element-group')[elementIndex];
            
            // Fill element data
            elementDiv.querySelector('[name^="element-code"]').value = element.code;
            elementDiv.querySelector('[name^="element-display"]').value = element.display;

            // Clear default target and add actual targets
            const targetsContainer = elementDiv.querySelector('.targets-container');
            // Remove existing targets except h5
            const existingTargets = targetsContainer.querySelectorAll('.target-group');
            existingTargets.forEach(target => target.remove());

            element.target.forEach((target, targetIndex) => {
                addTarget(elementDiv.querySelector('button'));
                const targetDiv = targetsContainer.querySelectorAll('.target-group')[targetIndex];
                
                targetDiv.querySelector('[name^="target-code"]').value = target.code;
                targetDiv.querySelector('[name^="target-display"]').value = target.display;
                targetDiv.querySelector('[name^="target-equivalence"]').value = target.equivalence || 'equivalent';
                
                if (target.extension && target.extension[0] && target.extension[0].valueDecimal) {
                    targetDiv.querySelector('[name^="target-similarity"]').value = target.extension[0].valueDecimal;
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

// Helper functions
function renderConceptMapElements(conceptMap) {
    if (!conceptMap.group || !conceptMap.group[0] || !conceptMap.group[0].element) {
        return '<p>No elements found.</p>';
    }

    const elements = conceptMap.group[0].element;
    return `
        <div class="mappings-section">
            <h4>Code Mappings (${elements.length} elements):</h4>
            ${elements.map(element => `
                <div class="mapping-element">
                    <div class="element-header">
                        <div class="element-info">
                            <span class="element-code">${element.code}</span>
                            <span class="element-display">${element.display}</span>
                        </div>
                    </div>
                    <div class="targets-list">
                        ${element.target ? element.target.map(target => `
                            <div class="target-item">
                                <span class="metadata-value">${target.code}</span>
                                <span class="metadata-value">${target.display}</span>
                                <span class="status status--primary">${target.equivalence}</span>
                                ${target.extension && target.extension[0] ? 
                                    `<span class="similarity-score">${target.extension[0].valueDecimal}%</span>` : 
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
        loader.classList.toggle('hidden', !show);
    }
}

function showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
        <div class="toast-icon"></div>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">Ã—</button>
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
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    if (modal && modalTitle && modalBody) {
        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        modal.classList.remove('hidden');
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Export functions for global access
window.editConceptMap = editConceptMap;
window.deleteConceptMap = deleteConceptMap;
window.viewJsonDetails = viewJsonDetails;
window.removeElement = removeElement;
window.addTarget = addTarget;
window.removeTarget = removeTarget;
window.closeModal = closeModal;
window.clearElements = clearElements;