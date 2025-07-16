// Nocturna Analytics Dashboard
class NocturnaAnalytics {
    constructor() {
        this.currentUser = null;
        this.db = null;
        this.timeRange = 30; // Default 30 days
        this.metrics = {
            views: 0,
            likes: 0,
            comments: 0,
            tips: 0,
            followers: 0,
            engagementRate: 0
        };
        
        this.init();
    }

    async init() {
        await this.waitForDatabase();
        this.loadUserData();
        this.setupEventListeners();
        this.checkAuth();
        await this.loadAnalytics();
        this.renderCharts();
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
    }

    updateUserGreeting() {
        const userGreeting = document.getElementById('userGreeting');
        if (userGreeting && this.currentUser) {
            userGreeting.textContent = `Welcome, ${this.currentUser.username}!`;
        }
    }

    setupEventListeners() {
        // Time range selector
        const timeRange = document.getElementById('timeRange');
        if (timeRange) {
            timeRange.addEventListener('change', (e) => {
                this.timeRange = parseInt(e.target.value);
                this.loadAnalytics();
                this.renderCharts();
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshAnalytics');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadAnalytics();
                this.renderCharts();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.logout.bind(this));
        }
    }

    logout() {
        localStorage.removeItem('nocturna_current_user');
        window.location.href = 'index.html';
    }

    async loadAnalytics() {
        if (!this.db || !this.currentUser) return;

        try {
            // Get user's uploads
            const uploads = await this.db.getUploadsByUser(this.currentUser.id);
            
            // Calculate date range
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - this.timeRange);

            // Filter uploads by date range
            const filteredUploads = uploads.filter(upload => {
                const uploadDate = new Date(upload.upload_date);
                return uploadDate >= startDate && uploadDate <= endDate;
            });

            // Calculate metrics
            await this.calculateMetrics(filteredUploads);
            this.updateMetricsDisplay();
            await this.loadTopContent(filteredUploads);
            this.generateInsights();
            this.generateRecommendations();

        } catch (error) {
            console.error('Failed to load analytics:', error);
        }
    }

    async calculateMetrics(uploads) {
        let totalLikes = 0;
        let totalComments = 0;
        let totalTips = 0;
        let totalViews = 0;

        for (const upload of uploads) {
            totalLikes += upload.likes_count || 0;
            totalComments += upload.comments_count || 0;
            totalTips += upload.tips_count || 0;
            // Simulate views (in real app, this would be tracked)
            totalViews += Math.floor(Math.random() * 1000) + (upload.likes_count || 0) * 10;
        }

        // Get follower count
        const followers = await this.db.getFollowers(this.currentUser.id);
        const followerCount = followers ? followers.length : 0;

        // Calculate engagement rate
        const totalInteractions = totalLikes + totalComments + totalTips;
        const engagementRate = totalViews > 0 ? ((totalInteractions / totalViews) * 100) : 0;

        this.metrics = {
            views: totalViews,
            likes: totalLikes,
            comments: totalComments,
            tips: totalTips,
            followers: followerCount,
            engagementRate: Math.round(engagementRate * 100) / 100
        };
    }

    updateMetricsDisplay() {
        const elements = {
            totalViews: this.metrics.views.toLocaleString(),
            totalLikes: this.metrics.likes.toLocaleString(),
            totalComments: this.metrics.comments.toLocaleString(),
            totalTips: this.metrics.tips.toLocaleString(),
            totalFollowers: this.metrics.followers.toLocaleString(),
            engagementRate: this.metrics.engagementRate + '%'
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });

        // Update change indicators (simulate growth)
        const changes = {
            viewsChange: '+' + Math.floor(Math.random() * 20 + 5) + '%',
            likesChange: '+' + Math.floor(Math.random() * 15 + 3) + '%',
            commentsChange: '+' + Math.floor(Math.random() * 25 + 8) + '%',
            tipsChange: '+' + Math.floor(Math.random() * 30 + 10) + '%',
            followersChange: '+' + Math.floor(Math.random() * 12 + 2) + '%',
            engagementChange: '+' + Math.floor(Math.random() * 8 + 1) + '%'
        };

        Object.entries(changes).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    async loadTopContent(uploads) {
        const topContentList = document.getElementById('topContentList');
        if (!topContentList) return;

        // Sort uploads by engagement (likes + comments)
        const sortedUploads = uploads.sort((a, b) => {
            const engagementA = (a.likes_count || 0) + (a.comments_count || 0);
            const engagementB = (b.likes_count || 0) + (b.comments_count || 0);
            return engagementB - engagementA;
        }).slice(0, 10);

        const contentHTML = sortedUploads.map(upload => {
            const views = Math.floor(Math.random() * 1000) + (upload.likes_count || 0) * 10;
            const engagement = ((upload.likes_count || 0) + (upload.comments_count || 0)) / Math.max(views, 1) * 100;
            
            return `
                <div class="table-row">
                    <div class="table-cell">
                        <div class="content-preview">
                            <div class="content-thumbnail ${upload.file_type}">
                                ${upload.file_type === 'image' ? '🖼️' : '🎥'}
                            </div>
                            <div class="content-info">
                                <span class="content-title">${upload.caption || upload.file_name}</span>
                                <span class="content-date">${new Date(upload.upload_date).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    <div class="table-cell">${views.toLocaleString()}</div>
                    <div class="table-cell">${(upload.likes_count || 0).toLocaleString()}</div>
                    <div class="table-cell">${(upload.comments_count || 0).toLocaleString()}</div>
                    <div class="table-cell">${(upload.tips_count || 0).toLocaleString()}</div>
                    <div class="table-cell">${engagement.toFixed(1)}%</div>
                </div>
            `;
        }).join('');

        topContentList.innerHTML = contentHTML;
    }

    generateInsights() {
        const peakHours = document.getElementById('peakHours');
        if (peakHours) {
            // Generate peak activity hours visualization
            const hours = [];
            for (let i = 0; i < 24; i++) {
                const activity = Math.floor(Math.random() * 100);
                hours.push(`
                    <div class="hour-block" style="opacity: ${activity / 100}">
                        <span class="hour-label">${i}:00</span>
                        <div class="activity-bar" style="height: ${activity}%"></div>
                    </div>
                `);
            }
            peakHours.innerHTML = hours.join('');
        }

        const engagementTrends = document.getElementById('engagementTrends');
        if (engagementTrends) {
            const trends = [
                { trend: 'Video content performs 3x better than images', icon: '🎥', type: 'positive' },
                { trend: 'Posts at 8-10 PM get highest engagement', icon: '🌙', type: 'neutral' },
                { trend: 'Caption length of 50-100 characters optimal', icon: '✍️', type: 'positive' },
                { trend: 'Weekend posts receive 25% more tips', icon: '💎', type: 'positive' }
            ];

            engagementTrends.innerHTML = trends.map(trend => `
                <div class="trend-item ${trend.type}">
                    <span class="trend-icon">${trend.icon}</span>
                    <span class="trend-text">${trend.trend}</span>
                </div>
            `).join('');
        }
    }

    generateRecommendations() {
        const aiRecommendations = document.getElementById('aiRecommendations');
        if (!aiRecommendations) return;

        const recommendations = [
            {
                title: 'Optimize Posting Schedule',
                description: 'Post during 8-10 PM for 35% higher engagement',
                action: 'Schedule Posts',
                priority: 'high'
            },
            {
                title: 'Create More Video Content',
                description: 'Video posts receive 3x more interactions than images',
                action: 'Upload Video',
                priority: 'medium'
            },
            {
                title: 'Engage with Comments',
                description: 'Respond to 80% more comments to boost algorithm ranking',
                action: 'View Comments',
                priority: 'high'
            },
            {
                title: 'Cross-Promote Content',
                description: 'Share top-performing content to social media for growth',
                action: 'Share Content',
                priority: 'low'
            }
        ];

        aiRecommendations.innerHTML = recommendations.map(rec => `
            <div class="recommendation-card ${rec.priority}">
                <div class="rec-header">
                    <h4>${rec.title}</h4>
                    <span class="priority-badge ${rec.priority}">${rec.priority}</span>
                </div>
                <p>${rec.description}</p>
                <button class="btn btn-primary">${rec.action}</button>
            </div>
        `).join('');
    }

    renderCharts() {
        this.renderPerformanceChart();
        this.renderContentTypeChart();
    }

    renderPerformanceChart() {
        const canvas = document.getElementById('performanceChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.offsetWidth;
        const height = 300;
        canvas.width = width;
        canvas.height = height;

        // Generate sample data for the time range
        const days = Math.min(this.timeRange, 30);
        const data = {
            views: [],
            likes: [],
            comments: []
        };

        for (let i = 0; i < days; i++) {
            const baseViews = Math.floor(Math.random() * 500) + 100;
            data.views.push(baseViews);
            data.likes.push(Math.floor(baseViews * 0.1) + Math.floor(Math.random() * 20));
            data.comments.push(Math.floor(baseViews * 0.02) + Math.floor(Math.random() * 5));
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

        // Draw lines for each metric
        const colors = {
            views: '#E2A6B7',
            likes: '#FF6B6B',
            comments: '#4ECDC4'
        };

        Object.entries(data).forEach(([metric, values]) => {
            ctx.strokeStyle = colors[metric];
            ctx.lineWidth = 2;
            ctx.beginPath();

            const maxValue = Math.max(...values);
            values.forEach((value, index) => {
                const x = (width / (days - 1)) * index;
                const y = height - (value / maxValue) * height;
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
        });
    }

    renderContentTypeChart() {
        const canvas = document.getElementById('contentTypeChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const size = 200;
        canvas.width = size;
        canvas.height = size;

        // Sample data
        const data = [
            { label: 'Videos', value: 65, color: '#E2A6B7' },
            { label: 'Images', value: 30, color: '#7F3D67' },
            { label: 'Other', value: 5, color: '#5A2A6E' }
        ];

        const centerX = size / 2;
        const centerY = size / 2;
        const radius = 80;

        let currentAngle = 0;

        data.forEach(segment => {
            const sliceAngle = (segment.value / 100) * 2 * Math.PI;
            
            // Draw slice
            ctx.fillStyle = segment.color;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();

            currentAngle += sliceAngle;
        });
    }
}

// Initialize analytics when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new NocturnaAnalytics();
});