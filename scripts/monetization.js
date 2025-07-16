// Nocturna Monetization Hub
class NocturnaMonetization {
    constructor() {
        this.currentUser = null;
        this.db = null;
        this.earnings = {
            total: 0,
            tips: 0,
            premium: 0,
            custom: 0,
            live: 0
        };
        this.pricing = {
            premium: 9.99,
            vip: 24.99,
            photoSet: 15.00,
            videoMinute: 5.00,
            videoCall: 3.00,
            message: 2.00
        };
        
        this.init();
    }

    async init() {
        await this.waitForDatabase();
        this.loadUserData();
        this.setupEventListeners();
        this.checkAuth();
        await this.loadEarnings();
        this.updateDisplays();
        this.renderRevenueChart();
    }

    async waitForDatabase() {
        while (!window.nocturnaDB || !window.nocturnaDB.isReady) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        this.db = window.nocturnaDB;
    }

    checkAuth() {
        this.currentUser = JSON.parse(localStorage.getItem('nocturna_current_user'));
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }
        this.updateUserGreeting();
    }

    loadUserData() {
        this.currentUser = JSON.parse(localStorage.getItem('nocturna_current_user')) || null;
        
        // Load saved pricing
        const savedPricing = localStorage.getItem(`nocturna_pricing_${this.currentUser?.id}`);
        if (savedPricing) {
            this.pricing = { ...this.pricing, ...JSON.parse(savedPricing) };
        }
    }

    updateUserGreeting() {
        const userGreeting = document.getElementById('userGreeting');
        if (userGreeting && this.currentUser) {
            userGreeting.textContent = `Welcome, ${this.currentUser.username}!`;
        }
    }

    setupEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.logout.bind(this));
        }

        // Withdrawal button
        const withdrawBtn = document.getElementById('withdrawBtn');
        if (withdrawBtn) {
            withdrawBtn.addEventListener('click', this.showWithdrawalModal.bind(this));
        }

        // Input change listeners for pricing
        const priceInputs = ['premiumPrice', 'vipPrice', 'photoSetPrice', 'videoMinutePrice', 'videoCallPrice', 'messagePrice'];
        priceInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.value = this.pricing[inputId.replace('Price', '')] || 0;
            }
        });
    }

    logout() {
        localStorage.removeItem('nocturna_current_user');
        window.location.href = 'index.html';
    }

    async loadEarnings() {
        if (!this.db || !this.currentUser) return;

        try {
            // Get tips received
            const uploads = await this.db.getUploadsByUser(this.currentUser.id);
            let totalTips = 0;
            
            for (const upload of uploads) {
                const tips = await this.db.getTipsByUpload(upload.id);
                totalTips += tips.reduce((sum, tip) => sum + tip.amount, 0);
            }

            // Simulate other revenue streams
            const premiumRevenue = Math.floor(Math.random() * 500) + 200;
            const customRevenue = Math.floor(Math.random() * 300) + 100;
            const liveRevenue = Math.floor(Math.random() * 200) + 50;

            this.earnings = {
                tips: totalTips,
                premium: premiumRevenue,
                custom: customRevenue,
                live: liveRevenue,
                total: totalTips + premiumRevenue + customRevenue + liveRevenue
            };

        } catch (error) {
            console.error('Failed to load earnings:', error);
            // Use simulated data if database fails
            this.earnings = {
                tips: Math.floor(Math.random() * 200) + 50,
                premium: Math.floor(Math.random() * 500) + 200,
                custom: Math.floor(Math.random() * 300) + 100,
                live: Math.floor(Math.random() * 200) + 50,
                total: 0
            };
            this.earnings.total = this.earnings.tips + this.earnings.premium + this.earnings.custom + this.earnings.live;
        }
    }

    updateDisplays() {
        // Update total earnings
        const totalEarnings = document.getElementById('totalEarnings');
        if (totalEarnings) {
            totalEarnings.textContent = `$${this.earnings.total.toFixed(2)}`;
        }

        // Update individual revenue streams
        const revenueElements = {
            monthlyTips: this.earnings.tips,
            premiumRevenue: this.earnings.premium,
            customRevenue: this.earnings.custom,
            liveRevenue: this.earnings.live
        };

        Object.entries(revenueElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = `$${value.toFixed(2)}`;
            }
        });

        // Update change percentages (simulated growth)
        const changes = {
            tipsChange: '+' + Math.floor(Math.random() * 20 + 5) + '%',
            premiumChange: '+' + Math.floor(Math.random() * 15 + 3) + '%',
            customChange: '+' + Math.floor(Math.random() * 25 + 8) + '%',
            liveChange: '+' + Math.floor(Math.random() * 30 + 10) + '%'
        };

        Object.entries(changes).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });

        // Update subscriber counts (simulated)
        const subscribers = {
            freeSubscribers: Math.floor(Math.random() * 500) + 100,
            premiumSubscribers: Math.floor(Math.random() * 200) + 50,
            vipSubscribers: Math.floor(Math.random() * 50) + 10
        };

        Object.entries(subscribers).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = `${value} subscribers`;
            }
        });

        // Update available balance
        const availableBalance = document.getElementById('availableBalance');
        if (availableBalance) {
            const available = this.earnings.total * 0.85; // 85% available after platform fees
            availableBalance.textContent = `$${available.toFixed(2)}`;
        }

        // Update pending balance
        const pendingBalance = document.getElementById('pendingBalance');
        if (pendingBalance) {
            const pending = Math.floor(Math.random() * 100) + 20;
            pendingBalance.textContent = `$${pending.toFixed(2)}`;
        }

        // Update revenue breakdown
        this.updateRevenueBreakdown();
    }

    updateRevenueBreakdown() {
        const total = this.earnings.total;
        if (total === 0) return;

        const percentages = {
            tips: (this.earnings.tips / total) * 100,
            subscriptions: (this.earnings.premium / total) * 100,
            custom: (this.earnings.custom / total) * 100
        };

        // Update percentage displays
        Object.entries(percentages).forEach(([type, percentage]) => {
            const element = document.getElementById(type + 'Percentage');
            if (element) {
                element.textContent = `${percentage.toFixed(1)}%`;
            }

            // Update progress bars
            const bar = document.querySelector(`.breakdown-fill.${type}`);
            if (bar) {
                bar.style.width = `${percentage}%`;
            }
        });
    }

    renderRevenueChart() {
        const canvas = document.getElementById('revenueChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.offsetWidth;
        const height = 200;
        canvas.width = width;
        canvas.height = height;

        // Generate 30 days of revenue data
        const days = 30;
        const revenueData = [];
        
        for (let i = 0; i < days; i++) {
            const baseRevenue = Math.floor(Math.random() * 100) + 20;
            revenueData.push(baseRevenue);
        }

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw grid
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 5; i++) {
            const y = (height / 5) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Draw revenue line
        ctx.strokeStyle = '#E2A6B7';
        ctx.lineWidth = 3;
        ctx.beginPath();

        const maxRevenue = Math.max(...revenueData);
        revenueData.forEach((revenue, index) => {
            const x = (width / (days - 1)) * index;
            const y = height - (revenue / maxRevenue) * height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();

        // Fill area under curve
        ctx.fillStyle = 'rgba(226, 166, 183, 0.1)';
        ctx.beginPath();
        ctx.moveTo(0, height);
        revenueData.forEach((revenue, index) => {
            const x = (width / (days - 1)) * index;
            const y = height - (revenue / maxRevenue) * height;
            ctx.lineTo(x, y);
        });
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
    }

    showWithdrawalModal() {
        const modal = document.getElementById('withdrawalModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    closeWithdrawalModal() {
        const modal = document.getElementById('withdrawalModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    submitWithdrawal() {
        const amount = document.getElementById('withdrawAmount').value;
        const method = document.getElementById('withdrawMethod').value;

        if (!amount || !method) {
            alert('Please fill in all fields');
            return;
        }

        if (parseFloat(amount) < 10) {
            alert('Minimum withdrawal amount is $10');
            return;
        }

        // Simulate withdrawal request
        alert(`Withdrawal request of $${amount} via ${method} has been submitted. Processing time: 3-5 business days.`);
        this.closeWithdrawalModal();
    }

    updatePremiumPrice() {
        const input = document.getElementById('premiumPrice');
        if (input) {
            this.pricing.premium = parseFloat(input.value);
            this.savePricing();
            alert('Premium tier pricing updated successfully!');
        }
    }

    updateVipPrice() {
        const input = document.getElementById('vipPrice');
        if (input) {
            this.pricing.vip = parseFloat(input.value);
            this.savePricing();
            alert('VIP tier pricing updated successfully!');
        }
    }

    updateCustomPricing() {
        const inputs = {
            photoSet: document.getElementById('photoSetPrice'),
            videoMinute: document.getElementById('videoMinutePrice'),
            videoCall: document.getElementById('videoCallPrice'),
            message: document.getElementById('messagePrice')
        };

        Object.entries(inputs).forEach(([key, input]) => {
            if (input) {
                this.pricing[key] = parseFloat(input.value);
            }
        });

        this.savePricing();
        alert('Custom content pricing updated successfully!');
    }

    savePricing() {
        localStorage.setItem(`nocturna_pricing_${this.currentUser.id}`, JSON.stringify(this.pricing));
    }

    configureBank() {
        const details = prompt('Enter your bank account details (Account Number):');
        if (details) {
            const bankDetails = document.getElementById('bankDetails');
            if (bankDetails) {
                bankDetails.textContent = `****${details.slice(-4)}`;
            }
            alert('Bank account configured successfully!');
        }
    }

    configurePaypal() {
        const email = prompt('Enter your PayPal email:');
        if (email) {
            const paypalDetails = document.getElementById('paypalDetails');
            if (paypalDetails) {
                paypalDetails.textContent = email;
            }
            alert('PayPal account configured successfully!');
        }
    }

    createDiscount() {
        const code = prompt('Enter discount code:');
        const percentage = prompt('Enter discount percentage (1-100):');
        
        if (code && percentage) {
            alert(`Discount code "${code}" for ${percentage}% off created successfully!`);
        }
    }

    createBundle() {
        alert('Bundle creation wizard will be available in the next update!');
    }

    createFlashSale() {
        const duration = prompt('Enter sale duration in hours:');
        const discount = prompt('Enter flash sale discount percentage:');
        
        if (duration && discount) {
            alert(`Flash sale for ${discount}% off created for ${duration} hours!`);
        }
    }
}

// Global functions for HTML onclick handlers
function updatePremiumPrice() {
    if (window.monetizationApp) {
        window.monetizationApp.updatePremiumPrice();
    }
}

function updateVipPrice() {
    if (window.monetizationApp) {
        window.monetizationApp.updateVipPrice();
    }
}

function updateCustomPricing() {
    if (window.monetizationApp) {
        window.monetizationApp.updateCustomPricing();
    }
}

function configureBank() {
    if (window.monetizationApp) {
        window.monetizationApp.configureBank();
    }
}

function configurePaypal() {
    if (window.monetizationApp) {
        window.monetizationApp.configurePaypal();
    }
}

function createDiscount() {
    if (window.monetizationApp) {
        window.monetizationApp.createDiscount();
    }
}

function createBundle() {
    if (window.monetizationApp) {
        window.monetizationApp.createBundle();
    }
}

function createFlashSale() {
    if (window.monetizationApp) {
        window.monetizationApp.createFlashSale();
    }
}

function closeWithdrawalModal() {
    if (window.monetizationApp) {
        window.monetizationApp.closeWithdrawalModal();
    }
}

function submitWithdrawal() {
    if (window.monetizationApp) {
        window.monetizationApp.submitWithdrawal();
    }
}

// Initialize monetization when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.monetizationApp = new NocturnaMonetization();
});