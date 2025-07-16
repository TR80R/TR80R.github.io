// Nocturna Customer App - TikTok-style Feed
class NocturnaCustomer {
    constructor() {
        this.isLoggedIn = false;
        this.currentUser = null;
        this.allContent = [];
        this.currentVideoIndex = 0;
        this.balance = 500;
        this.isPlaying = false;
        this.videoElement = null;
        this.comments = [];
        this.likes = [];
        this.tips = [];
        this.follows = [];
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.checkAuth();
    }

    loadData() {
        // Load all uploads from localStorage
        this.allContent = JSON.parse(localStorage.getItem('nocturna_uploads')) || [];
        this.comments = JSON.parse(localStorage.getItem('nocturna_comments')) || [];
        this.likes = JSON.parse(localStorage.getItem('nocturna_likes')) || [];
        this.tips = JSON.parse(localStorage.getItem('nocturna_tips')) || [];
        this.follows = JSON.parse(localStorage.getItem('nocturna_follows')) || [];
        
        // Add sample content to mix with real uploads
        this.addSampleContent();
        
        // Shuffle content for algorithm
        this.shuffleContent();
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
        // Check if sample content already exists to avoid duplicates
        const hasSampleContent = this.allContent.some(item => item.id && item.id.toString().startsWith('sample_'));
        
        if (!hasSampleContent) {
            this.allContent = [...this.allContent, ...sampleContent];
        }
    }

    shuffleContent() {
        // Simple algorithm to mix content
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
            this.balance = this.currentUser?.balance || 500;
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

            // Mouse wheel
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

        // Refresh data to get latest uploads
        this.refreshContent();
        this.updateBalance();
        this.renderCurrentVideo();
    }

    refreshContent() {
        // Reload data from localStorage to get latest uploads
        this.loadData();
        this.currentVideoIndex = 0; // Reset to first video
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    switchFeed(feedType) {
        // Update navigation buttons
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

    renderCurrentVideo() {
        if (this.allContent.length === 0) {
            this.renderEmptyState();
            return;
        }

        const current = this.allContent[this.currentVideoIndex];
        const videoFeed = document.getElementById('videoFeed');
        
        if (!videoFeed) return;

        videoFeed.innerHTML = `
            <div class="video-item active">
                ${this.renderMedia(current)}
            </div>
        `;

        this.updateVideoInfo(current);
        this.updateInteractionCounts(current);
        this.updateCreatorInfo(current);
        this.loadComments(current);
        
        // Auto-play if video
        if (current.file_type === 'video') {
            this.playVideo();
        }
    }

    renderMedia(content) {
        if (content.preview) {
            if (content.file_type === 'image') {
                return `<img src="${content.preview}" alt="${content.caption}" class="media-content">`;
            } else if (content.file_type === 'video') {
                return `<video src="${content.preview}" class="media-content" loop muted id="currentVideo"></video>`;
            }
        }
        
        // Placeholder for content without preview
        const icon = content.file_type === 'image' ? '🖼️' : '🎥';
        return `
            <div class="media-placeholder">
                <div class="placeholder-icon">${icon}</div>
                <h3>${content.caption}</h3>
                <p>by @${content.username}</p>
            </div>
        `;
    }

    renderEmptyState() {
        const videoFeed = document.getElementById('videoFeed');
        if (videoFeed) {
            videoFeed.innerHTML = `
                <div class="empty-feed">
                    <h3>No content available</h3>
                    <p>Check back later for amazing content!</p>
                </div>
            `;
        }
    }

    updateVideoInfo(content) {
        const caption = document.getElementById('videoCaption');
        const tags = document.getElementById('videoTags');
        
        if (caption) {
            caption.textContent = content.caption || 'No caption';
        }
        
        if (tags) {
            tags.innerHTML = content.tags.map(tag => 
                `<span class="tag">#${tag}</span>`
            ).join('');
        }
    }

    updateInteractionCounts(content) {
        const likeCount = document.getElementById('likeCount');
        const commentCount = document.getElementById('commentCount');
        
        if (likeCount) {
            const likes = this.likes.filter(like => like.content_id === content.id).length;
            likeCount.textContent = (content.likes_count || 0) + likes;
        }
        
        if (commentCount) {
            const comments = this.comments.filter(comment => comment.content_id === content.id).length;
            commentCount.textContent = (content.comments_count || 0) + comments;
        }

        // Update like button state
        const likeBtn = document.getElementById('likeBtn');
        const userLiked = this.likes.some(like => 
            like.content_id === content.id && like.user_id === this.currentUser.id
        );
        
        if (likeBtn) {
            likeBtn.classList.toggle('liked', userLiked);
        }
    }

    updateCreatorInfo(content) {
        const creatorName = document.getElementById('creatorName');
        const creatorFollowers = document.getElementById('creatorFollowers');
        const followBtn = document.getElementById('followBtn');
        
        if (creatorName) {
            creatorName.textContent = `@${content.username}`;
        }
        
        if (creatorFollowers) {
            const followerCount = this.follows.filter(follow => 
                follow.creator_id === content.user_id
            ).length;
            creatorFollowers.textContent = `${followerCount} followers`;
        }
        
        if (followBtn) {
            const isFollowing = this.follows.some(follow => 
                follow.creator_id === content.user_id && follow.user_id === this.currentUser.id
            );
            followBtn.textContent = isFollowing ? 'Following' : 'Follow';
            followBtn.classList.toggle('following', isFollowing);
        }
    }

    updateBalance() {
        const balanceDisplay = document.getElementById('customerBalance');
        if (balanceDisplay) {
            balanceDisplay.textContent = this.balance;
        }
    }

    playVideo() {
        this.videoElement = document.getElementById('currentVideo');
        if (this.videoElement) {
            this.videoElement.play().catch(console.error);
            this.isPlaying = true;
            this.updateProgress();
        }
    }

    pauseVideo() {
        if (this.videoElement) {
            this.videoElement.pause();
            this.isPlaying = false;
        }
    }

    updateProgress() {
        if (!this.isPlaying || !this.videoElement) return;
        
        const progressFill = document.getElementById('progressFill');
        if (progressFill && this.videoElement.duration) {
            const progress = (this.videoElement.currentTime / this.videoElement.duration) * 100;
            progressFill.style.width = `${progress}%`;
        }
        
        if (this.isPlaying) {
            requestAnimationFrame(this.updateProgress.bind(this));
        }
    }

    nextVideo() {
        this.currentVideoIndex = (this.currentVideoIndex + 1) % this.allContent.length;
        this.renderCurrentVideo();
    }

    previousVideo() {
        this.currentVideoIndex = this.currentVideoIndex === 0 ? 
            this.allContent.length - 1 : this.currentVideoIndex - 1;
        this.renderCurrentVideo();
    }

    handleKeyboard(e) {
        if (!this.isLoggedIn) return;
        
        switch (e.key) {
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

    toggleLike() {
        const current = this.allContent[this.currentVideoIndex];
        const existingLike = this.likes.find(like => 
            like.content_id === current.id && like.user_id === this.currentUser.id
        );

        if (existingLike) {
            // Remove like
            this.likes = this.likes.filter(like => like.id !== existingLike.id);
        } else {
            // Add like
            this.likes.push({
                id: Date.now().toString(),
                content_id: current.id,
                user_id: this.currentUser.id,
                username: this.currentUser.username,
                timestamp: new Date().toISOString()
            });
        }

        localStorage.setItem('nocturna_likes', JSON.stringify(this.likes));
        this.updateInteractionCounts(current);
    }

    toggleComments() {
        const panel = document.getElementById('commentsPanel');
        if (panel) {
            const isVisible = panel.style.display === 'block';
            panel.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                this.loadComments(this.allContent[this.currentVideoIndex]);
            }
        }
    }

    hideComments() {
        const panel = document.getElementById('commentsPanel');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    loadComments(content) {
        const commentsList = document.getElementById('commentsList');
        if (!commentsList) return;

        const contentComments = this.comments.filter(comment => 
            comment.content_id === content.id
        );

        if (contentComments.length === 0) {
            commentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first!</p>';
            return;
        }

        commentsList.innerHTML = contentComments.map(comment => `
            <div class="comment-item">
                <div class="comment-author">@${comment.username}</div>
                <div class="comment-text">${comment.text}</div>
                <div class="comment-time">${this.formatTime(comment.timestamp)}</div>
            </div>
        `).join('');
    }

    postComment() {
        const input = document.getElementById('newComment');
        const text = input.value.trim();
        
        if (!text) return;

        const comment = {
            id: Date.now().toString(),
            content_id: this.allContent[this.currentVideoIndex].id,
            user_id: this.currentUser.id,
            username: this.currentUser.username,
            text: text,
            timestamp: new Date().toISOString()
        };

        this.comments.push(comment);
        localStorage.setItem('nocturna_comments', JSON.stringify(this.comments));
        
        input.value = '';
        this.loadComments(this.allContent[this.currentVideoIndex]);
        this.updateInteractionCounts(this.allContent[this.currentVideoIndex]);
    }

    showTipModal() {
        const modal = document.getElementById('tipModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    hideTipModal() {
        const modal = document.getElementById('tipModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    sendTip(amount) {
        if (this.balance < amount) {
            alert('Insufficient balance!');
            return;
        }

        const current = this.allContent[this.currentVideoIndex];
        
        const tip = {
            id: Date.now().toString(),
            content_id: current.id,
            creator_id: current.user_id,
            tipper_id: this.currentUser.id,
            amount: amount,
            timestamp: new Date().toISOString()
        };

        this.tips.push(tip);
        this.balance -= amount;
        
        // Update user balance
        this.currentUser.balance = this.balance;
        sessionStorage.setItem('nocturna_customer_user', JSON.stringify(this.currentUser));
        
        localStorage.setItem('nocturna_tips', JSON.stringify(this.tips));
        
        this.updateBalance();
        this.hideTipModal();
        
        // Show success message
        alert(`Tip of ${amount} gems sent to @${current.username}!`);
    }

    sendCustomTip() {
        const input = document.getElementById('customTipAmount');
        const amount = parseInt(input.value);
        
        if (amount && amount > 0 && amount <= this.balance) {
            this.sendTip(amount);
            input.value = '';
        } else {
            alert('Please enter a valid amount!');
        }
    }

    toggleFollow() {
        const current = this.allContent[this.currentVideoIndex];
        const existingFollow = this.follows.find(follow => 
            follow.creator_id === current.user_id && follow.user_id === this.currentUser.id
        );

        if (existingFollow) {
            // Unfollow
            this.follows = this.follows.filter(follow => follow.id !== existingFollow.id);
        } else {
            // Follow
            this.follows.push({
                id: Date.now().toString(),
                creator_id: current.user_id,
                user_id: this.currentUser.id,
                timestamp: new Date().toISOString()
            });
        }

        localStorage.setItem('nocturna_follows', JSON.stringify(this.follows));
        this.updateCreatorInfo(current);
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 60) {
            return `${minutes}m ago`;
        } else if (hours < 24) {
            return `${hours}h ago`;
        } else {
            return `${days}d ago`;
        }
    }
}

// Initialize the customer app
const customerApp = new NocturnaCustomer();