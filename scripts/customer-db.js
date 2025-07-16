// Nocturna Customer App with Database Integration
class NocturnaCustomerDB {
    constructor() {
        this.isLoggedIn = false;
        this.currentUser = null;
        this.allContent = [];
        this.currentVideoIndex = 0;
        this.balance = 1000;
        this.isPlaying = false;
        this.videoElement = null;
        this.db = null;
        
        this.init();
    }

    async init() {
        await this.waitForDatabase();
        await this.loadData();
        this.setupEventListeners();
        this.checkAuth();
    }

    async waitForDatabase() {
        while (!window.nocturnaDB || !window.nocturnaDB.isReady) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        this.db = window.nocturnaDB;
    }

    async loadData() {
        if (!this.db) return;

        try {
            // Load all uploads from database
            this.allContent = await this.db.getAllUploads();
            
            // Add sample content to mix with real uploads
            this.addSampleContent();
            
            // Shuffle content for algorithm
            this.shuffleContent();
        } catch (error) {
            console.warn('Failed to load data from database:', error);
            this.allContent = [];
            this.addSampleContent();
            this.shuffleContent();
        }
    }

    addSampleContent() {
        const sampleContent = [
            {
                id: 'sample_1',
                user_id: 'creator_1',
                username: 'NightQueen',
                file_name: 'sample_video_1.mp4',
                file_type: 'video',
                caption: 'Late night vibes ✨',
                tags: ['mood', 'aesthetic', 'night'],
                upload_date: new Date().toISOString(),
                likes_count: 245,
                comments_count: 18,
                tips_count: 12
            },
            {
                id: 'sample_2',
                user_id: 'creator_2',
                username: 'MoonlightMuse',
                file_name: 'sample_image_1.jpg',
                file_type: 'image',
                caption: 'Feeling mysterious tonight 🌙',
                tags: ['mystery', 'mood', 'art'],
                upload_date: new Date().toISOString(),
                likes_count: 189,
                comments_count: 24,
                tips_count: 8
            },
            {
                id: 'sample_3',
                user_id: 'creator_3',
                username: 'VelvetDreams',
                file_name: 'sample_video_2.mp4',
                file_type: 'video',
                caption: 'Dancing through the darkness 💫',
                tags: ['dance', 'artistic', 'creative'],
                upload_date: new Date().toISOString(),
                likes_count: 312,
                comments_count: 31,
                tips_count: 15
            }
        ];

        // Add sample content to existing real uploads (if any)
        const hasSampleContent = this.allContent.some(item => item.id && item.id.toString().startsWith('sample_'));
        
        if (!hasSampleContent) {
            this.allContent = [...this.allContent, ...sampleContent];
        }
    }

    shuffleContent() {
        for (let i = this.allContent.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.allContent[i], this.allContent[j]] = [this.allContent[j], this.allContent[i]];
        }
    }

    checkAuth() {
        const customerSession = sessionStorage.getItem('nocturna_customer_session');
        if (customerSession === 'active') {
            this.isLoggedIn = true;
            this.currentUser = JSON.parse(sessionStorage.getItem('nocturna_customer_user'));
            this.balance = this.currentUser?.balance || 1000;
            this.showApp();
        } else {
            this.showLoginModal();
        }
    }

    setupEventListeners() {
        // Customer login
        const loginForm = document.getElementById('customerLoginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        // Logout
        const logoutBtn = document.getElementById('customerLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.logout.bind(this));
        }

        // Navigation
        const forYouBtn = document.getElementById('forYouBtn');
        const followingBtn = document.getElementById('followingBtn');
        const refreshBtn = document.getElementById('refreshBtn');
        
        if (forYouBtn) {
            forYouBtn.addEventListener('click', () => this.switchFeed('forYou'));
        }
        if (followingBtn) {
            followingBtn.addEventListener('click', () => this.switchFeed('following'));
        }
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshContent();
                this.renderCurrentVideo();
            });
        }

        // Interactions
        const likeBtn = document.getElementById('likeBtn');
        const commentBtn = document.getElementById('commentBtn');
        const tipBtn = document.getElementById('tipBtn');

        if (likeBtn) {
            likeBtn.addEventListener('click', this.toggleLike.bind(this));
        }
        if (commentBtn) {
            commentBtn.addEventListener('click', this.toggleComments.bind(this));
        }
        if (tipBtn) {
            tipBtn.addEventListener('click', this.showTipModal.bind(this));
        }

        // Comments
        const closeComments = document.getElementById('closeComments');
        const postComment = document.getElementById('postComment');
        
        if (closeComments) {
            closeComments.addEventListener('click', this.hideComments.bind(this));
        }
        if (postComment) {
            postComment.addEventListener('click', this.postComment.bind(this));
        }

        // Tips
        const tipAmounts = document.querySelectorAll('.tip-amount');
        const sendCustomTip = document.getElementById('sendCustomTip');
        const closeTipModal = document.getElementById('closeTipModal');

        tipAmounts.forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = parseInt(btn.dataset.amount);
                this.sendTip(amount);
            });
        });

        if (sendCustomTip) {
            sendCustomTip.addEventListener('click', this.sendCustomTip.bind(this));
        }
        if (closeTipModal) {
            closeTipModal.addEventListener('click', this.hideTipModal.bind(this));
        }

        // Follow button
        const followBtn = document.getElementById('followBtn');
        if (followBtn) {
            followBtn.addEventListener('click', this.toggleFollow.bind(this));
        }

        // Keyboard controls
        document.addEventListener('keydown', this.handleKeyboard.bind(this));

        // Touch/scroll controls for mobile
        let startY = 0;
        const feedContainer = document.querySelector('.feed-container');
        
        if (feedContainer) {
            feedContainer.addEventListener('touchstart', (e) => {
                startY = e.touches[0].clientY;
            });

            feedContainer.addEventListener('touchend', (e) => {
                const endY = e.changedTouches[0].clientY;
                const diff = startY - endY;
                
                if (Math.abs(diff) > 50) {
                    if (diff > 0) {
                        this.nextVideo();
                    } else {
                        this.previousVideo();
                    }
                }
            });

            feedContainer.addEventListener('wheel', (e) => {
                e.preventDefault();
                if (e.deltaY > 0) {
                    this.nextVideo();
                } else {
                    this.previousVideo();
                }
            });
        }

        // Page visibility listener to refresh content when tab becomes active
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isLoggedIn) {
                this.refreshContent();
                this.renderCurrentVideo();
            }
        });

        // Storage listener to detect uploads from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'nocturna_uploads' && this.isLoggedIn) {
                this.refreshContent();
                this.renderCurrentVideo();
            }
        });
    }

    handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('customerUsername').value;
        const password = document.getElementById('customerPassword').value;

        // Hardcoded customer accounts
        if ((username === 'premium_user' && password === 'nocturna123') || 
            (username === 'customer1' && password === 'pass123')) {
            this.currentUser = {
                id: 'customer_premium',
                username: username,
                balance: 1000,
                premium: true,
                following: []
            };
            
            this.isLoggedIn = true;
            this.balance = this.currentUser.balance;
            
            sessionStorage.setItem('nocturna_customer_session', 'active');
            sessionStorage.setItem('nocturna_customer_user', JSON.stringify(this.currentUser));
            
            this.showApp();
        } else {
            this.showError('customerLoginError', 'Invalid customer credentials');
        }
    }

    logout() {
        this.isLoggedIn = false;
        this.currentUser = null;
        sessionStorage.removeItem('nocturna_customer_session');
        sessionStorage.removeItem('nocturna_customer_user');
        window.location.reload();
    }

    showLoginModal() {
        const modal = document.getElementById('customerLoginModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    showApp() {
        const modal = document.getElementById('customerLoginModal');
        const app = document.getElementById('customerApp');
        
        if (modal) {
            modal.style.display = 'none';
        }
        if (app) {
            app.style.display = 'block';
        }

        this.refreshContent();
        this.updateBalance();
        this.renderCurrentVideo();
    }

    async refreshContent() {
        await this.loadData();
        this.currentVideoIndex = 0;
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    switchFeed(feedType) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (feedType === 'forYou') {
            document.getElementById('forYouBtn').classList.add('active');
            this.shuffleContent();
        } else {
            document.getElementById('followingBtn').classList.add('active');
            // Filter to only show followed creators
            this.allContent = this.allContent.filter(content => 
                this.follows.some(follow => follow.creator_id === content.user_id)
            );
        }
        
        this.currentVideoIndex = 0;
        this.renderCurrentVideo();
    }

    async renderCurrentVideo() {
        const videoFeed = document.getElementById('videoFeed');
        if (!videoFeed || this.allContent.length === 0) {
            this.renderEmptyState();
            return;
        }

        const content = this.allContent[this.currentVideoIndex];
        if (!content) return;

        let mediaHTML = '';
        
        // Try to get file data from database for real uploads
        if (this.db && !content.id.toString().startsWith('sample_')) {
            try {
                const { file } = await this.db.getUploadWithFile(content.id);
                if (file && file.file_data) {
                    mediaHTML = this.renderMedia(content, file.file_data);
                } else {
                    mediaHTML = this.renderMedia(content);
                }
            } catch (error) {
                mediaHTML = this.renderMedia(content);
            }
        } else {
            mediaHTML = this.renderMedia(content);
        }

        videoFeed.innerHTML = `
            <div class="video-item" data-id="${content.id}">
                ${mediaHTML}
                <div class="video-overlay">
                    <div class="video-info">
                        <h3>${content.caption || content.file_name}</h3>
                        <p class="creator-name">@${content.username}</p>
                        <div class="video-tags">
                            ${(content.tags || []).map(tag => `<span class="tag">#${tag}</span>`).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.updateVideoInfo(content);
        this.updateInteractionCounts(content);
        this.updateCreatorInfo(content);
        this.setupVideoPreview();
    }

    renderMedia(content, fileData = null) {
        if (content.file_type === 'video') {
            const videoSrc = fileData || `assets/sample-video.mp4`;
            return `
                <video 
                    id="currentVideo" 
                    class="video-player" 
                    src="${videoSrc}"
                    loop 
                    muted
                    playsinline
                    poster="assets/video-poster.jpg">
                </video>
                <div class="video-controls">
                    <button class="play-pause-btn" id="playPauseBtn">▶️</button>
                    <div class="progress-bar" id="progressBar">
                        <div class="progress" id="progress"></div>
                    </div>
                </div>
            `;
        } else {
            const imageSrc = fileData || `assets/sample-image.jpg`;
            return `<img src="${imageSrc}" alt="${content.caption}" class="content-image">`;
        }
    }

    renderEmptyState() {
        const videoFeed = document.getElementById('videoFeed');
        if (videoFeed) {
            videoFeed.innerHTML = `
                <div class="empty-state">
                    <h2>No content available</h2>
                    <p>Check back later for new uploads!</p>
                </div>
            `;
        }
    }

    updateVideoInfo(content) {
        // Update interaction counts
        this.updateInteractionCounts(content);
    }

    updateInteractionCounts(content) {
        const likeCount = document.getElementById('likeCount');
        const commentCount = document.getElementById('commentCount');
        
        if (likeCount) likeCount.textContent = content.likes_count || 0;
        if (commentCount) commentCount.textContent = content.comments_count || 0;

        // Update like button state
        this.updateLikeButton(content);
    }

    async updateLikeButton(content) {
        const likeBtn = document.getElementById('likeBtn');
        if (!likeBtn || !this.db || !this.currentUser) return;

        try {
            const isLiked = await this.db.isLikedByUser(content.id, this.currentUser.id);
            const icon = likeBtn.querySelector('.icon');
            if (icon) {
                icon.textContent = isLiked ? '❤️' : '🤍';
            }
        } catch (error) {
            console.warn('Failed to check like status:', error);
        }
    }

    updateCreatorInfo(content) {
        const creatorName = document.getElementById('creatorName');
        if (creatorName) {
            creatorName.textContent = content.username;
        }

        // Update follow button state
        this.updateFollowButton(content);
    }

    async updateFollowButton(content) {
        const followBtn = document.getElementById('followBtn');
        if (!followBtn || !this.db || !this.currentUser) return;

        try {
            const isFollowing = await this.db.isFollowing(this.currentUser.id, content.user_id);
            followBtn.textContent = isFollowing ? 'Following' : 'Follow';
            followBtn.classList.toggle('following', isFollowing);
        } catch (error) {
            console.warn('Failed to check follow status:', error);
        }
    }

    updateBalance() {
        const balanceElement = document.getElementById('customerBalance');
        if (balanceElement) {
            balanceElement.textContent = this.balance;
        }
    }

    // Video controls
    playVideo() {
        const video = document.getElementById('currentVideo');
        if (video) {
            video.play();
            this.isPlaying = true;
            const playBtn = document.getElementById('playPauseBtn');
            if (playBtn) playBtn.textContent = '⏸️';
        }
    }

    pauseVideo() {
        const video = document.getElementById('currentVideo');
        if (video) {
            video.pause();
            this.isPlaying = false;
            const playBtn = document.getElementById('playPauseBtn');
            if (playBtn) playBtn.textContent = '▶️';
        }
    }

    updateProgress() {
        const video = document.getElementById('currentVideo');
        const progress = document.getElementById('progress');
        
        if (video && progress) {
            const percentage = (video.currentTime / video.duration) * 100;
            progress.style.width = percentage + '%';
        }
    }

    nextVideo() {
        if (this.allContent.length === 0) return;
        
        this.currentVideoIndex = (this.currentVideoIndex + 1) % this.allContent.length;
        this.renderCurrentVideo();
    }

    previousVideo() {
        if (this.allContent.length === 0) return;
        
        this.currentVideoIndex = this.currentVideoIndex === 0 
            ? this.allContent.length - 1 
            : this.currentVideoIndex - 1;
        this.renderCurrentVideo();
    }

    handleKeyboard(e) {
        if (!this.isLoggedIn) return;

        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.previousVideo();
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.nextVideo();
                break;
            case ' ':
                e.preventDefault();
                if (this.isPlaying) {
                    this.pauseVideo();
                } else {
                    this.playVideo();
                }
                break;
            case 'l':
                this.toggleLike();
                break;
            case 'c':
                this.toggleComments();
                break;
        }
    }

    // Interaction methods
    async toggleLike() {
        if (!this.db || !this.currentUser || this.allContent.length === 0) return;

        const content = this.allContent[this.currentVideoIndex];
        if (!content) return;

        try {
            const result = await this.db.toggleLike(content.id, this.currentUser.id, this.currentUser.username);
            
            // Update local content
            content.likes_count = result.count;
            
            // Update UI
            this.updateInteractionCounts(content);
        } catch (error) {
            console.error('Failed to toggle like:', error);
        }
    }

    toggleComments() {
        const commentsPanel = document.getElementById('commentsPanel');
        if (commentsPanel) {
            const isVisible = commentsPanel.style.display === 'block';
            commentsPanel.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                this.loadComments(this.allContent[this.currentVideoIndex]);
            }
        }
    }

    hideComments() {
        const commentsPanel = document.getElementById('commentsPanel');
        if (commentsPanel) {
            commentsPanel.style.display = 'none';
        }
    }

    async loadComments(content) {
        if (!this.db || !content) return;

        try {
            const comments = await this.db.getCommentsByUpload(content.id);
            const commentsList = document.getElementById('commentsList');
            
            if (commentsList) {
                commentsList.innerHTML = comments.map(comment => `
                    <div class="comment">
                        <strong>@${comment.username}</strong>
                        <p>${comment.text}</p>
                        <span class="comment-time">${this.formatTime(comment.created_date)}</span>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Failed to load comments:', error);
        }
    }

    async postComment() {
        const commentInput = document.getElementById('commentInput');
        if (!commentInput || !this.db || !this.currentUser || this.allContent.length === 0) return;

        const text = commentInput.value.trim();
        if (!text) return;

        const content = this.allContent[this.currentVideoIndex];
        if (!content) return;

        try {
            await this.db.addComment(content.id, this.currentUser.id, this.currentUser.username, text);
            
            commentInput.value = '';
            content.comments_count = (content.comments_count || 0) + 1;
            
            this.updateInteractionCounts(content);
            this.loadComments(content);
        } catch (error) {
            console.error('Failed to post comment:', error);
        }
    }

    showTipModal() {
        const tipModal = document.getElementById('tipModal');
        if (tipModal) {
            tipModal.style.display = 'flex';
        }
    }

    hideTipModal() {
        const tipModal = document.getElementById('tipModal');
        if (tipModal) {
            tipModal.style.display = 'none';
        }
    }

    async sendTip(amount) {
        if (!this.db || !this.currentUser || this.allContent.length === 0) return;

        const content = this.allContent[this.currentVideoIndex];
        if (!content || this.balance < amount) {
            alert('Insufficient balance!');
            return;
        }

        try {
            await this.db.sendTip(content.id, this.currentUser.id, content.user_id, amount);
            
            this.balance -= amount;
            this.currentUser.balance = this.balance;
            sessionStorage.setItem('nocturna_customer_user', JSON.stringify(this.currentUser));
            
            content.tips_count = (content.tips_count || 0) + 1;
            
            this.updateBalance();
            this.updateInteractionCounts(content);
            this.hideTipModal();
            
            alert(`Sent ${amount} gems to @${content.username}!`);
        } catch (error) {
            console.error('Failed to send tip:', error);
            alert('Failed to send tip. Please try again.');
        }
    }

    sendCustomTip() {
        const customAmount = document.getElementById('customTipAmount');
        if (customAmount) {
            const amount = parseInt(customAmount.value);
            if (amount > 0) {
                this.sendTip(amount);
            }
        }
    }

    async toggleFollow() {
        if (!this.db || !this.currentUser || this.allContent.length === 0) return;

        const content = this.allContent[this.currentVideoIndex];
        if (!content || content.user_id === this.currentUser.id) return;

        try {
            await this.db.toggleFollow(this.currentUser.id, content.user_id);
            this.updateFollowButton(content);
        } catch (error) {
            console.error('Failed to toggle follow:', error);
        }
    }

    setupVideoPreview() {
        const video = document.getElementById('currentVideo');
        const playPauseBtn = document.getElementById('playPauseBtn');
        
        if (video) {
            video.addEventListener('timeupdate', this.updateProgress.bind(this));
            video.addEventListener('click', () => {
                if (this.isPlaying) {
                    this.pauseVideo();
                } else {
                    this.playVideo();
                }
            });
        }

        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => {
                if (this.isPlaying) {
                    this.pauseVideo();
                } else {
                    this.playVideo();
                }
            });
        }
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) {
            return 'just now';
        } else if (diff < 3600000) {
            return Math.floor(diff / 60000) + 'm';
        } else if (diff < 86400000) {
            return Math.floor(diff / 3600000) + 'h';
        } else {
            return Math.floor(diff / 86400000) + 'd';
        }
    }
}

// Initialize customer app with database
let customerApp;
document.addEventListener('DOMContentLoaded', async () => {
    customerApp = new NocturnaCustomerDB();
});