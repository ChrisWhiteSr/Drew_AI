// Steam Arbitrage - Complete JavaScript Functionality

// Global state
let currentAnalysis = null;
let isAnalyzing = false;

// DOM Elements
const steamidForm = document.getElementById('steamid-form');
const loadingSection = document.getElementById('loading-section');
const resultsSection = document.getElementById('results-section');
const tiktokModal = document.getElementById('tiktok-modal');
const filterButtons = document.querySelectorAll('.filter-btn');
const resultsTableBody = document.getElementById('results-table-body');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeFilters();
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Event Listeners
function initializeEventListeners() {
    // Form submission
    steamidForm.addEventListener('submit', handleFormSubmission);
    
    // Filter buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', handleFilterChange);
    });
    
    // Modal close events
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeTikTokModal();
        }
    });
    
    // Click outside modal to close
    if (tiktokModal) {
        tiktokModal.addEventListener('click', function(e) {
            if (e.target === tiktokModal) {
                closeTikTokModal();
            }
        });
    }
}

// Form Submission Handler
async function handleFormSubmission(e) {
    e.preventDefault();
    
    if (isAnalyzing) return;
    
    const steamid = document.getElementById('steamid').value.trim();
    const gameId = document.getElementById('game').value;
    
    // Validate SteamID
    if (!validateSteamID(steamid)) {
        showError('Please enter a valid Steam ID or profile URL');
        return;
    }
    
    // Start analysis
    await startAnalysis(steamid, gameId);
}

// SteamID Validation
function validateSteamID(input) {
    // SteamID64 pattern
    const steamID64Pattern = /^7656119[0-9]{10}$/;
    
    // Profile URL patterns
    const profileURLPattern = /steamcommunity\.com\/(id|profiles)\/([^\/\s]+)/;
    
    return steamID64Pattern.test(input) || profileURLPattern.test(input);
}

// Analysis Process
async function startAnalysis(steamid, gameId) {
    isAnalyzing = true;
    
    // Hide hero, show loading
    document.querySelector('.hero').style.display = 'none';
    loadingSection.style.display = 'block';
    resultsSection.style.display = 'none';
    
    // Scroll to loading section
    loadingSection.scrollIntoView({ behavior: 'smooth' });
    
    try {
        // Simulate the analysis process with realistic timing
        await simulateAnalysis(steamid, gameId);
        
        // Show results
        showResults();
        
    } catch (error) {
        console.error('Analysis failed:', error);
        showError('Analysis failed. Please try again or check if your inventory is public.');
        resetToInitialState();
    } finally {
        isAnalyzing = false;
    }
}

// Simulate Analysis Process
async function simulateAnalysis(steamid, gameId) {
    const steps = document.querySelectorAll('.loading-step');
    const tips = [
        "Most Steam users are missing out on 15-30% extra value by not comparing marketplace prices.",
        "CS2 skins can have up to 40% price differences between marketplaces.",
        "StatTrak™ items often have better arbitrage opportunities due to their rarity.",
        "Timing matters - prices fluctuate based on tournaments and game updates."
    ];
    
    // Step 1: Fetching inventory
    steps[0].classList.add('active');
    await sleep(2000);
    
    // Step 2: Comparing prices
    steps[0].classList.remove('active');
    steps[1].classList.add('active');
    
    // Rotate through tips
    const tipElement = document.querySelector('.loading-tip p');
    let tipIndex = 0;
    const tipInterval = setInterval(() => {
        tipElement.textContent = tips[tipIndex % tips.length];
        tipIndex++;
    }, 3000);
    
    await sleep(3000);
    
    // Step 3: Calculating profits
    steps[1].classList.remove('active');
    steps[2].classList.add('active');
    await sleep(2000);
    
    clearInterval(tipInterval);
    
    // Generate mock results
    currentAnalysis = generateMockResults(steamid, gameId);
}

// Generate Mock Results
function generateMockResults(steamid, gameId) {
    const gameItems = {
        '730': [ // CS2
            {
                name: 'AK-47 | Redline',
                details: 'Field-Tested, StatTrak™',
                rarity: 'covert',
                steamPrice: 156.50,
                bestMarket: 'Skinport',
                marketPrice: 181.00,
                profit: 24.50,
                profitPercentage: 15.6
            },
            {
                name: 'M4A4 | Asiimov',
                details: 'Battle-Scarred',
                rarity: 'classified',
                steamPrice: 89.25,
                bestMarket: 'DMarket',
                marketPrice: 108.00,
                profit: 18.75,
                profitPercentage: 21.0
            },
            {
                name: 'AWP | Electric Hive',
                details: 'Minimal Wear',
                rarity: 'restricted',
                steamPrice: 67.80,
                bestMarket: 'Skinport',
                marketPrice: 83.00,
                profit: 15.20,
                profitPercentage: 22.4
            },
            {
                name: 'USP-S | Kill Confirmed',
                details: 'Field-Tested',
                rarity: 'restricted',
                steamPrice: 45.60,
                bestMarket: 'DMarket',
                marketPrice: 54.50,
                profit: 8.90,
                profitPercentage: 19.5
            },
            {
                name: 'Glock-18 | Water Elemental',
                details: 'Well-Worn',
                rarity: 'milspec',
                steamPrice: 23.45,
                bestMarket: 'Steam Market',
                marketPrice: 21.15,
                profit: -2.30,
                profitPercentage: -9.8
            }
        ],
        '570': [ // Dota 2
            {
                name: 'Pudge | Dragonclaw Hook',
                details: 'Immortal',
                rarity: 'knife',
                steamPrice: 2450.00,
                bestMarket: 'DMarket',
                marketPrice: 2680.00,
                profit: 230.00,
                profitPercentage: 9.4
            },
            {
                name: 'Legion Commander | Blades of Voth Domosh',
                details: 'Arcana',
                rarity: 'covert',
                steamPrice: 145.30,
                bestMarket: 'Skinport',
                marketPrice: 167.50,
                profit: 22.20,
                profitPercentage: 15.3
            }
        ]
    };
    
    const items = gameItems[gameId] || gameItems['730'];
    const totalProfit = items.reduce((sum, item) => sum + Math.max(0, item.profit), 0);
    const profitableItems = items.filter(item => item.profit > 0).length;
    
    return {
        steamid,
        gameId,
        totalProfit,
        itemsAnalyzed: items.length + Math.floor(Math.random() * 50) + 50, // Add some randomness
        profitableItems,
        items
    };
}

// Show Results
function showResults() {
    if (!currentAnalysis) return;
    
    // Hide loading, show results
    loadingSection.style.display = 'none';
    resultsSection.style.display = 'block';
    
    // Update summary stats
    document.getElementById('total-profit').textContent = `$${currentAnalysis.totalProfit.toFixed(2)}`;
    document.getElementById('items-analyzed').textContent = currentAnalysis.itemsAnalyzed;
    document.getElementById('profitable-items').textContent = currentAnalysis.profitableItems;
    
    // Update results table
    updateResultsTable(currentAnalysis.items);
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Update Results Table
function updateResultsTable(items) {
    if (!resultsTableBody) return;
    
    resultsTableBody.innerHTML = '';
    
    items.forEach(item => {
        const row = createItemRow(item);
        resultsTableBody.appendChild(row);
    });
}

// Create Item Row
function createItemRow(item) {
    const row = document.createElement('tr');
    row.className = `table-row ${item.profit > 0 ? 'profitable' : ''}`;
    row.setAttribute('data-profit', item.profit.toString());
    
    const profitClass = item.profit > 0 ? 'profit-positive' : 'profit-negative';
    const profitSign = item.profit > 0 ? '+' : '';
    
    const marketplaceClass = {
        'Skinport': 'skinport',
        'DMarket': 'dmarket',
        'Steam Market': 'steam'
    }[item.bestMarket] || 'steam';
    
    row.innerHTML = `
        <td class="item-cell">
            <div class="item-info">
                <div class="item-icon ${item.rarity}">${getItemIcon(item.name)}</div>
                <div>
                    <div class="item-name">${item.name}</div>
                    <div class="item-details">${item.details}</div>
                </div>
            </div>
        </td>
        <td class="price-cell">$${item.steamPrice.toFixed(2)}</td>
        <td class="market-cell">
            <div class="market-badge ${marketplaceClass}">${item.bestMarket}</div>
        </td>
        <td class="price-cell">$${item.marketPrice.toFixed(2)}</td>
        <td class="profit-cell">
            <div class="${profitClass}">${profitSign}$${Math.abs(item.profit).toFixed(2)}</div>
            <div class="profit-percentage">${profitSign}${item.profitPercentage.toFixed(1)}%</div>
        </td>
        <td class="actions-cell">
            ${item.profit > 0 ? 
                `<button class="btn btn-primary btn-sm" onclick="openMarketplace('${item.bestMarket}')">Sell Here</button>` :
                `<button class="btn btn-secondary btn-sm disabled">Keep on Steam</button>`
            }
            <button class="btn btn-ghost btn-sm" onclick="showItemDetails('${item.name}')">Details</button>
        </td>
    `;
    
    return row;
}

// Get Item Icon
function getItemIcon(itemName) {
    const icons = {
        'AK-47': 'AK',
        'M4A4': 'M4',
        'AWP': 'AWP',
        'USP-S': 'USP',
        'Glock-18': 'GLK',
        'Pudge': 'PDG',
        'Legion Commander': 'LC'
    };
    
    for (const [key, icon] of Object.entries(icons)) {
        if (itemName.includes(key)) {
            return icon;
        }
    }
    
    return 'ITM';
}

// Filter Functionality
function initializeFilters() {
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // Apply filter
            const filter = this.getAttribute('data-filter');
            applyTableFilter(filter);
        });
    });
}

function handleFilterChange(e) {
    const filter = e.target.getAttribute('data-filter');
    applyTableFilter(filter);
}

function applyTableFilter(filter) {
    const rows = document.querySelectorAll('.table-row');
    
    rows.forEach(row => {
        const profit = parseFloat(row.getAttribute('data-profit'));
        let show = true;
        
        switch (filter) {
            case 'profitable':
                show = profit > 0;
                break;
            case 'high-value':
                show = profit > 15; // Show items with >$15 profit
                break;
            case 'all':
            default:
                show = true;
                break;
        }
        
        row.style.display = show ? '' : 'none';
    });
}

// TikTok Sharing Functionality
function generateTikTokShare() {
    if (!currentAnalysis) return;
    
    // Update share content with current analysis data
    const shareCard = document.querySelector('.share-stat');
    const shareCaption = document.getElementById('share-caption');
    
    if (shareCard) {
        shareCard.textContent = `Found $${currentAnalysis.totalProfit.toFixed(2)} profit!`;
    }
    
    if (shareCaption) {
        shareCaption.textContent = `"Just found $${currentAnalysis.totalProfit.toFixed(2)} hidden in my Steam inventory 😳 Who else is missing out on this? #steamtrading #cs2 #gaming #profit"`;
    }
    
    // Show modal
    tiktokModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeTikTokModal() {
    tiktokModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function copyShareText() {
    const caption = document.getElementById('share-caption').textContent;
    
    navigator.clipboard.writeText(caption).then(() => {
        // Show success feedback
        const btn = event.target.closest('.btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="btn-icon">✓</span>Copied!';
        btn.style.background = 'var(--accent-success)';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text:', err);
        showError('Failed to copy text. Please copy manually.');
    });
}

function downloadShareImage() {
    // In a real implementation, this would generate and download the share image
    // For now, we'll just show a placeholder
    alert('Share image download feature coming soon! For now, take a screenshot of the preview above.');
}

// Utility Functions
function openMarketplace(marketplace) {
    const urls = {
        'Skinport': 'https://skinport.com',
        'DMarket': 'https://dmarket.com',
        'Steam Market': 'https://steamcommunity.com/market'
    };
    
    const url = urls[marketplace];
    if (url) {
        window.open(url, '_blank');
    }
}

function showItemDetails(itemName) {
    // In a real implementation, this would show detailed item information
    alert(`Detailed information for ${itemName} would be shown here, including:\n\n• Price history\n• Market trends\n• Best selling times\n• Fee breakdowns`);
}

function showSteamIDHelp() {
    const helpText = `To find your Steam ID:

1. Go to your Steam profile
2. Copy the URL (it will contain your Steam ID)
3. Or use a Steam ID finder website

Examples:
• Steam ID64: 76561198000000000
• Profile URL: steamcommunity.com/id/yourname
• Direct profile: steamcommunity.com/profiles/76561198000000000

Make sure your inventory is set to public in your Steam privacy settings!`;

    alert(helpText);
}

function showError(message) {
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.innerHTML = `
        <div class="error-content">
            <span class="error-icon">⚠️</span>
            <span class="error-message">${message}</span>
            <button class="error-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    // Add error styles if not already present
    if (!document.getElementById('error-styles')) {
        const style = document.createElement('style');
        style.id = 'error-styles';
        style.textContent = `
            .error-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--accent-danger);
                color: white;
                padding: var(--space-4);
                border-radius: var(--radius-md);
                box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                z-index: 1001;
                max-width: 400px;
                animation: slideIn 0.3s ease-out;
            }
            
            .error-content {
                display: flex;
                align-items: center;
                gap: var(--space-2);
            }
            
            .error-close {
                background: none;
                border: none;
                color: white;
                font-size: var(--text-lg);
                cursor: pointer;
                margin-left: auto;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 5000);
}

function resetToInitialState() {
    document.querySelector('.hero').style.display = 'block';
    loadingSection.style.display = 'none';
    resultsSection.style.display = 'none';
    
    // Reset loading steps
    document.querySelectorAll('.loading-step').forEach(step => {
        step.classList.remove('active');
    });
    document.querySelector('.loading-step').classList.add('active');
    
    // Scroll back to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Analytics and Tracking (placeholder)
function trackEvent(eventName, properties = {}) {
    // In a real implementation, this would send events to analytics
    console.log('Event tracked:', eventName, properties);
}

// Track key user actions
document.addEventListener('DOMContentLoaded', function() {
    // Track page load
    trackEvent('page_view', { page: 'landing' });
    
    // Track form interactions
    document.getElementById('steamid').addEventListener('focus', () => {
        trackEvent('steamid_input_focus');
    });
    
    // Track CTA clicks
    document.querySelectorAll('.btn-primary').forEach(btn => {
        btn.addEventListener('click', () => {
            trackEvent('cta_click', { button_text: btn.textContent.trim() });
        });
    });
});