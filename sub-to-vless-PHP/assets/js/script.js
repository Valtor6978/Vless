// DOM Elements
const subscriptionUrlInput = document.getElementById('subscriptionUrl');
const convertBtn = document.getElementById('convertBtn');
const errorMessage = document.getElementById('errorMessage');
const loadingIndicator = document.getElementById('loadingIndicator');
const loadingStage = document.getElementById('loadingStage');
const resultsSection = document.getElementById('resultsSection');
const configsList = document.getElementById('configsList');
const configCount = document.getElementById('configCount');
const processingTime = document.getElementById('processingTime');
const copyAllBtn = document.getElementById('copyAllBtn');
const exportBtn = document.getElementById('exportBtn');
const expandAllBtn = document.getElementById('expandAllBtn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const optionsBtn = document.getElementById('optionsBtn');
const optionsPanel = document.getElementById('optionsPanel');
const customPrefix = document.getElementById('customPrefix');
const includeLocation = document.getElementById('includeLocation');
const showDetails = document.getElementById('showDetails');
const autoExpand = document.getElementById('autoExpand');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('.filter-btn');

// State
let currentConfigs = [];
let allExpanded = false;
let startTime = 0;

// Toast notification
function showToast(message, duration = 3000) {
    toastMessage.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// Error handling
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// Loading states
function showLoading(show) {
    loadingIndicator.style.display = show ? 'flex' : 'none';
    convertBtn.classList.toggle('loading', show);
    
    if (show) {
        startTime = Date.now();
        updateLoadingStage(0);
    }
}

function updateLoadingStage(stage) {
    const stages = [
        'Fetching subscription...',
        'Processing data...',
        'Converting configs...',
        'Almost done...'
    ];
    
    if (stage < stages.length) {
        loadingStage.textContent = stages[stage];
        setTimeout(() => updateLoadingStage(stage + 1), 500);
    }
}

// Copy to clipboard with fallback
async function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return Promise.resolve();
        } catch (err) {
            document.body.removeChild(textArea);
            return Promise.reject(err);
        }
    }
}

// Create config card
function createConfigCard(config, index) {
    const card = document.createElement('div');
    card.className = 'config-card';
    card.style.animationDelay = `${index * 0.05}s`;
    card.dataset.network = config.network;
    card.dataset.security = config.security;
    
    const shouldShowDetails = showDetails.checked;
    const shouldAutoExpand = autoExpand.checked;
    
    if (shouldAutoExpand) {
        card.classList.add('expanded');
    }
    
    const detailsHTML = shouldShowDetails ? `
        <div class="config-details">
            <div class="detail-item">
                <span class="detail-label">Address</span>
                <span class="detail-value">${config.address}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Port</span>
                <span class="detail-value">${config.port}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Type</span>
                <span class="detail-value">${config.network.toUpperCase()}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Security</span>
                <span class="detail-value">${config.security.toUpperCase()}</span>
            </div>
        </div>
    ` : '';
    
    card.innerHTML = `
        <div class="config-header">
            <span class="config-name">${config.name}</span>
            <svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        </div>
        ${detailsHTML}
        <div class="config-uri">
            <code>${config.uri}</code>
        </div>
        <button class="btn-copy" onclick="copyConfig(${index})">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Copy Config</span>
        </button>
    `;
    
    // Toggle expand on header click
    const header = card.querySelector('.config-header');
    header.addEventListener('click', () => {
        card.classList.toggle('expanded');
    });
    
    return card;
}

// Display configs
function displayConfigs(configs) {
    currentConfigs = configs;
    configsList.innerHTML = '';
    configCount.textContent = configs.length;
    
    const elapsed = Date.now() - startTime;
    processingTime.textContent = `${elapsed}ms`;
    
    configs.forEach((config, index) => {
        const card = createConfigCard(config, index);
        configsList.appendChild(card);
    });
    
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Copy single config
window.copyConfig = function(index) {
    const config = currentConfigs[index];
    copyToClipboard(config.uri)
        .then(() => {
            showToast(`✅ ${config.name} copied`);
        })
        .catch(() => {
            showError('Failed to copy');
        });
};

// Copy all configs
copyAllBtn.addEventListener('click', () => {
    if (currentConfigs.length === 0) return;
    
    const allUris = currentConfigs.map(c => c.uri).join('\n');
    copyToClipboard(allUris)
        .then(() => {
            showToast(`✅ ${currentConfigs.length} configs copied`);
        })
        .catch(() => {
            showError('Failed to copy all');
        });
});

// Export configs
exportBtn.addEventListener('click', () => {
    if (currentConfigs.length === 0) return;
    
    const allUris = currentConfigs.map(c => c.uri).join('\n');
    const blob = new Blob([allUris], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vless-configs-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('✅ File downloaded');
});

// Expand/Collapse all
expandAllBtn.addEventListener('click', () => {
    allExpanded = !allExpanded;
    const cards = document.querySelectorAll('.config-card');
    
    cards.forEach(card => {
        if (allExpanded) {
            card.classList.add('expanded');
        } else {
            card.classList.remove('expanded');
        }
    });
    
    expandAllBtn.innerHTML = allExpanded ? `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="17 13 12 18 7 13"></polyline>
            <polyline points="17 6 12 11 7 6"></polyline>
        </svg>
    ` : `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="17 11 12 6 7 11"></polyline>
            <polyline points="17 18 12 13 7 18"></polyline>
        </svg>
    `;
});

// Options toggle
optionsBtn.addEventListener('click', () => {
    optionsPanel.classList.toggle('show');
    optionsBtn.classList.toggle('active');
});

// Search functionality
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.config-card');
    
    cards.forEach(card => {
        const name = card.querySelector('.config-name').textContent.toLowerCase();
        const uri = card.querySelector('.config-uri code').textContent.toLowerCase();
        
        if (name.includes(searchTerm) || uri.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
});

// Filter functionality
filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filter = btn.dataset.filter;
        const cards = document.querySelectorAll('.config-card');
        
        cards.forEach(card => {
            if (filter === 'all') {
                card.style.display = 'block';
            } else if (filter === 'tls') {
                card.style.display = card.dataset.security.includes('tls') || 
                                     card.dataset.security.includes('reality') ? 'block' : 'none';
            } else {
                card.style.display = card.dataset.network === filter ? 'block' : 'none';
            }
        });
    });
});

// Convert subscription
async function convertSubscription() {
    const url = subscriptionUrlInput.value.trim();
    
    if (!url) {
        showError('Please enter a subscription URL');
        subscriptionUrlInput.focus();
        return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        showError('URL must start with http:// or https://');
        return;
    }

    showLoading(true);
    errorMessage.style.display = 'none';
    resultsSection.style.display = 'none';

    try {
        const response = await fetch('api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                url,
                prefix: customPrefix.value.trim(),
                includeLocation: includeLocation.checked
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Conversion failed');
        }

        if (data.success && data.configs) {
            displayConfigs(data.configs);
            showToast(`✅ ${data.count} configs converted successfully`);
        } else {
            throw new Error('Invalid response from server');
        }

    } catch (error) {
        showError(error.message || 'Failed to connect to server');
    } finally {
        showLoading(false);
    }
}

// Event listeners
convertBtn.addEventListener('click', convertSubscription);

subscriptionUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        convertSubscription();
    }
});

// Auto-focus input on load
window.addEventListener('load', () => {
    subscriptionUrlInput.focus();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
    }
    
    // Ctrl/Cmd + A to copy all (when results are visible)
    if ((e.ctrlKey || e.metaKey) && e.key === 'a' && resultsSection.style.display === 'block') {
        e.preventDefault();
        copyAllBtn.click();
    }
    
    // Escape to clear search
    if (e.key === 'Escape' && document.activeElement === searchInput) {
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input'));
    }
});

// Save preferences to localStorage
function savePreferences() {
    localStorage.setItem('vless-preferences', JSON.stringify({
        customPrefix: customPrefix.value,
        includeLocation: includeLocation.checked,
        showDetails: showDetails.checked,
        autoExpand: autoExpand.checked
    }));
}

function loadPreferences() {
    const saved = localStorage.getItem('vless-preferences');
    if (saved) {
        try {
            const prefs = JSON.parse(saved);
            customPrefix.value = prefs.customPrefix || '';
            includeLocation.checked = prefs.includeLocation || false;
            showDetails.checked = prefs.showDetails || false;
            autoExpand.checked = prefs.autoExpand || false;
        } catch (e) {
            console.error('Failed to load preferences');
        }
    }
}

// Save preferences on change
[customPrefix, includeLocation, showDetails, autoExpand].forEach(element => {
    element.addEventListener('change', savePreferences);
});

// Load preferences on startup
loadPreferences();

// Service Worker registration (for PWA support)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {
        // Silent fail if SW not available
    });
}

console.log('🔥 VLESS Converter Pro v2.0 - Made by Valtor');
