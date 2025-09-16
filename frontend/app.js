// ================================
// Global state and configuration
// ================================
let allCodes = [];
let currentTab = 'home';
const API_BASE_URL = 'http://127.0.0.1:8000';

// ================================
// Initialize application
// ================================
document.addEventListener('DOMContentLoaded', () => {
    // Redirect to login page if not logged in (only for pages except login.html)
    if (!localStorage.getItem("access_token") && !window.location.pathname.endsWith("login.html")) {
        window.location.href = "login.html";
        return;
    }

    initializeApp();
    setupEventListeners();
    switchTab('home');

    // Login form handler (only exists in login.html)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            try {
                await login(username, password);
                window.location.href = 'index.html'; // redirect after login
            } catch (err) {
                console.error(err);
            }
        });
    }

    // Login button in navbar (redirect to login page)
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
    }

    // Logout button handler (if implemented)
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem("access_token");
            window.location.href = "login.html";
        });
    }
});

// ================================
// API Requests
// ================================
async function makeApiRequest(endpoint, method = 'GET', data = null) {
    const token = localStorage.getItem("access_token");
    if (!token) {
        showToast("You must login first to use the API", "warning");
        throw new Error("No access token found");
    }

    const config = {
        method,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    };

    if (data) config.body = JSON.stringify(data);

    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        let result;
        try { result = await response.json(); } catch { result = {}; }
        showLoading(false);

        if (!response.ok) {
            const msg = result.detail || result.message || `HTTP error ${response.status}`;
            throw new Error(msg);
        }

        return result;
    } catch (error) {
        showLoading(false);
        console.error("API request failed:", error);
        showToast("API request failed: " + error.message, "error");
        throw error;
    }
}

// ================================
// Login function
// ================================
async function login(username, password) {
    const response = await fetch(`${API_BASE_URL}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username, password })
    });

    const data = await response.json();
    if (response.ok) {
        localStorage.setItem("access_token", data.access_token);
        showToast("Login successful", "success");
    } else {
        showToast("Login failed: " + (data.detail || "Invalid credentials"), "error");
        throw new Error(data.detail || "Login failed");
    }
}

// ================================
// Initialize App Data
// ================================
async function initializeApp() {
    await checkApiHealth();
    await loadInitialData();
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
    } catch {
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
    } catch {
        allCodes = [];
        updateStats();
    }
}

function updateStats(totalMappings = null) {
    const totalCodesElement = document.getElementById('total-codes');
    const totalMappingsElement = document.getElementById('total-mappings');

    if (totalCodesElement) totalCodesElement.textContent = allCodes.length;
    if (totalMappingsElement) totalMappingsElement.textContent = totalMappings ?? allCodes.length;
}

// ================================
// Tab Navigation
// ================================
function setupEventListeners() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    const searchForm = document.getElementById('search-form');
    if (searchForm) searchForm.addEventListener('submit', handleSearch);

    const loadMappingsBtn = document.getElementById('load-mappings-btn');
    if (loadMappingsBtn) loadMappingsBtn.addEventListener('click', loadAllMappings);

    const refreshMappingsBtn = document.getElementById('refresh-mappings-btn');
    if (refreshMappingsBtn) {
        refreshMappingsBtn.addEventListener('click', () => {
            document.getElementById('mappings-container').innerHTML = '';
            loadAllMappings();
        });
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab) activeTab.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    const contentTab = document.getElementById(tabName);
    if (contentTab) contentTab.classList.add('active');

    currentTab = tabName;
}

// ================================
// Search Functionality
// ================================
async function handleSearch(event) {
    event.preventDefault();
    const searchInput = document.getElementById('search-input');
    const searchCode = searchInput.value.trim();
    if (!searchCode) return showToast('Please enter a NAMASTE code to search', 'warning');

    try {
        const response = await makeApiRequest('/translate', 'POST', { code: searchCode });
        displaySearchResults(response, searchCode);
        showToast('Search completed successfully', 'success');
    } catch {
        displaySearchResults(null, searchCode);
        showToast('No mapping found for that NAMASTE code', 'error');
    }
}

function displaySearchResults(response, searchedCode) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;

    if (!response || !response.matches || response.matches.length === 0) {
        resultsContainer.innerHTML = `<div class="card"><div class="card__body"><h3>No Results Found</h3><p>No mapping found for NAMASTE code: <code>${searchedCode}</code></p></div></div>`;
        return;
    }

    let resultsHtml = `<div class="card"><div class="card__body"><h3>Search Results for: <code>${searchedCode}</code></h3><p>Found ${response.matches.length} mapping${response.matches.length !== 1 ? 's' : ''}</p></div></div>`;

    response.matches.forEach((match, index) => {
        const similarity = match.similarity ? match.similarity.toFixed(2) + '%' : 'N/A';
        resultsHtml += `
            <div class="card result-card">
                <div class="card__body">
                    <div class="result-header">
                        <h4>Mapping ${index + 1}</h4>
                        <span class="similarity-score">Similarity: ${similarity}</span>
                    </div>
                    <div class="result-metadata">
                        <div class="metadata-item"><span class="metadata-label">ICD-11 Code(s)</span><span class="metadata-value"><code>${match.code}</code></span></div>
                        <div class="metadata-item"><span class="metadata-label">Display Name</span><span class="metadata-value">${match.display}</span></div>
                        <div class="metadata-item"><span class="metadata-label">Equivalence</span><span class="metadata-value">${match.equivalence || 'N/A'}</span></div>
                    </div>
                </div>
            </div>`;
    });

    resultsHtml += `<div class="card"><div class="card__body"><h4>Raw API Response</h4><pre>${JSON.stringify(response, null, 2)}</pre></div></div>`;
    resultsContainer.innerHTML = resultsHtml;
}

// ================================
// Load & Display All Mappings
// ================================
async function loadAllMappings() {
    const mappingsContainer = document.getElementById('mappings-container');
    mappingsContainer.innerHTML = `<div class="card"><div class="card__body"><p>Loading all mappings...</p></div></div>`;

    try {
        const response = await makeApiRequest('/codes');
        const allMappings = response.codes || [];
        displayAllMappings(allMappings);
        updateStats(allMappings.length);
        showToast(`Loaded ${allMappings.length} mappings successfully`, 'success');
    } catch (error) {
        console.error('Failed to load mappings:', error);
        mappingsContainer.innerHTML = `<div class="card"><div class="card__body"><h3>Error Loading Mappings</h3><p>${error.message}</p></div></div>`;
    }
}

function displayAllMappings(mappings) {
    const container = document.getElementById('mappings-container');
    if (!mappings || mappings.length === 0) {
        container.innerHTML = `<div class="card"><div class="card__body"><h3>No Mappings Found</h3></div></div>`;
        return;
    }

    let html = `<div class="card"><div class="card__body"><h3>All NAMASTE to ICD-11 Mappings</h3><p>Total mappings: ${mappings.length}</p></div></div>`;
    mappings.forEach((item, index) => {
        const similarity = item.similarity !== null ? item.similarity.toFixed(2) + '%' : 'N/A';
        html += `
            <div class="card mapping-card">
                <div class="card__body">
                    <div class="mapping-header"><h4>${index+1}. NAMASTE Code: <code>${item.namaste_code}</code></h4><span>${item.namaste_display}</span></div>
                    <div class="mapping-details">
                        <p><strong>ICD-11 Code:</strong> <code>${item.icd_code}</code></p>
                        <p><strong>ICD-11 Display:</strong> ${item.icd_display}</p>
                        <p><strong>Similarity:</strong> ${similarity}</p>
                    </div>
                </div>
            </div>`;
    });

    container.innerHTML = html;
}

// ================================
// Utilities
// ================================
function showLoading(show) {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.classList.toggle('hidden', !show);
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const id = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.id = id;
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<div class="toast-message">${message}</div><button class="toast-close" onclick="removeToast('${id}')">&times;</button>`;
    container.appendChild(toast);

    setTimeout(() => removeToast(id), 5000);
}

function removeToast(id) {
    const t = document.getElementById(id);
    if (t) t.remove();
}