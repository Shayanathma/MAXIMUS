// Global state and configuration
let allCodes = [];
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
    await loadInitialData();
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

    // Load mappings button
    const loadMappingsBtn = document.getElementById('load-mappings-btn');
    if (loadMappingsBtn) {
        loadMappingsBtn.addEventListener('click', loadAllMappings);
    }

    // Refresh mappings button
    const refreshMappingsBtn = document.getElementById('refresh-mappings-btn');
    if (refreshMappingsBtn) {
        refreshMappingsBtn.addEventListener('click', () => {
            document.getElementById('mappings-container').innerHTML = '';
            loadAllMappings();
        });
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
        
        let result;
        try {
            result = await response.json();
        } catch (e) {
            result = { message: 'Empty response' };
        }

        showLoading(false);

        if (!response.ok) {
            let errorMessage = result.detail || result.message || `HTTP error! status: ${response.status}`;
            throw new Error(errorMessage);
        }

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

async function loadInitialData() {
    try {
        const response = await makeApiRequest('/codes');
        allCodes = response.codes || [];
        updateStats();
    } catch (error) {
        console.error('Failed to load initial data:', error);
        allCodes = [];
        updateStats();
    }
}

function updateStats() {
    const totalCodesElement = document.getElementById('total-codes');
    const totalMappingsElement = document.getElementById('total-mappings');
    
    if (totalCodesElement) {
        totalCodesElement.textContent = allCodes.length;
    }
    
    if (totalMappingsElement) {
        // We'll count total mappings when we load them
        totalMappingsElement.textContent = allCodes.length;
    }
}

// Search functionality
async function handleSearch(event) {
    event.preventDefault();
    
    const searchInput = document.getElementById('search-input');
    const searchCode = searchInput.value.trim();
    
    if (!searchCode) {
        showToast('Please enter a NAMASTE code to search', 'warning');
        return;
    }

    try {
        const response = await makeApiRequest('/translate', 'POST', { code: searchCode });
        displaySearchResults(response, searchCode);
        showToast('Search completed successfully', 'success');
    } catch (error) {
        displaySearchResults(null, searchCode);
        showToast('No mapping found for that NAMASTE code', 'error');
    }
}

function displaySearchResults(response, searchedCode) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;

    if (!response || !response.result) {
        resultsContainer.innerHTML = `
            <div class="card">
                <div class="card__body">
                    <h3>No Results Found</h3>
                    <p>No mapping found for NAMASTE code: <code>${searchedCode}</code></p>
                </div>
            </div>
        `;
        return;
    }

    const matches = response.matches || [];
    
    let resultsHtml = `
        <div class="card">
            <div class="card__body">
                <h3>Search Results for: <code>${searchedCode}</code></h3>
                <p>Found ${matches.length} mapping${matches.length !== 1 ? 's' : ''}</p>
            </div>
        </div>
    `;

    matches.forEach((match, index) => {
        const similarity = match.similarity ? match.similarity.toFixed(2) + '%' : 'N/A';
        
        resultsHtml += `
            <div class="card result-card">
                <div class="card__body">
                    <div class="result-header">
                        <h4>Mapping ${index + 1}</h4>
                        <span class="similarity-score">Similarity: ${similarity}</span>
                    </div>
                    
                    <div class="result-metadata">
                        <div class="metadata-item">
                            <span class="metadata-label">ICD-11 Code(s)</span>
                            <span class="metadata-value"><code>${match.code}</code></span>
                        </div>
                        <div class="metadata-item">
                            <span class="metadata-label">Display Name</span>
                            <span class="metadata-value">${match.display}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="metadata-label">Equivalence</span>
                            <span class="metadata-value">${match.equivalence || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    // Add raw JSON response
    resultsHtml += `
        <div class="card">
            <div class="card__body">
                <h4>Raw API Response</h4>
                <p>This shows the complete JSON response from the API for demonstration purposes:</p>
                <div class="json-viewer">${JSON.stringify(response, null, 2)}</div>
            </div>
        </div>
    `;

    resultsContainer.innerHTML = resultsHtml;
}

// View mappings functionality
// View mappings functionality
// Load all mappings from /codes endpoint
async function loadAllMappings() {
    try {
        const mappingsContainer = document.getElementById('mappings-container');
        mappingsContainer.innerHTML = '<div class="card"><div class="card__body"><p>Loading all mappings...</p></div></div>';

        // Fetch all codes from /codes endpoint
        const response = await makeApiRequest('/codes');
        const allMappings = response.codes || [];

        // Display codes
        displayAllMappings(allMappings);

        showToast(`Loaded ${allMappings.length} mappings successfully`, 'success');

    } catch (error) {
        console.error('Failed to load mappings:', error);
        document.getElementById('mappings-container').innerHTML = `
            <div class="card">
                <div class="card__body">
                    <h3>Error Loading Mappings</h3>
                    <p>Failed to load mappings: ${error.message}</p>
                </div>
            </div>
        `;
    }
}

// Display all mappings
function displayAllMappings(mappings) {
    const mappingsContainer = document.getElementById('mappings-container');

    if (!mappings || mappings.length === 0) {
        mappingsContainer.innerHTML = `
            <div class="card">
                <div class="card__body">
                    <h3>No Mappings Found</h3>
                    <p>No terminology mappings are currently available.</p>
                </div>
            </div>
        `;
        return;
    }

    let mappingsHtml = `
        <div class="card">
            <div class="card__body">
                <h3>All NAMASTE to ICD-11 Mappings</h3>
                <p>Total mappings: ${mappings.length}</p>
            </div>
        </div>
    `;

    mappings.forEach((item, index) => {
        const similarity = item.similarity !== null ? (item.similarity).toFixed(2) + '%' : 'N/A';
        mappingsHtml += `
            <div class="card mapping-card">
                <div class="card__body">
                    <div class="mapping-header">
                        <h4>${index + 1}. NAMASTE Code: <code>${item.namaste_code}</code></h4>
                        <span class="metadata-label">${item.namaste_display}</span>
                    </div>
                    <div class="mapping-details">
                        <p><strong>ICD-11 Code:</strong> <code>${item.icd_code}</code></p>
                        <p><strong>ICD-11 Display:</strong> ${item.icd_display}</p>
                        <p><strong>Similarity:</strong> ${similarity}</p>
                    </div>
                </div>
            </div>
        `;
    });

    mappingsContainer.innerHTML = mappingsHtml;
}
// Utility functions
function showLoading(show) {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) {
        loadingSpinner.classList.toggle('hidden', !show);
    }
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast toast--${type}`;
    
    toast.innerHTML = `
        <div class="toast-icon"></div>
        <div class="toast-message">${message}</div>
        <button class="toast-close" onclick="removeToast('${toastId}')">&times;</button>
    `;

    toastContainer.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        removeToast(toastId);
    }, 5000);
}

function removeToast(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
        toast.remove();
    }
}