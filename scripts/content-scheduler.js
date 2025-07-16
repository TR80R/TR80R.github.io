// Nocturna Content Scheduler
class NocturnaScheduler {
    constructor() {
        this.currentUser = null;
        this.db = null;
        this.scheduledPosts = [];
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.currentView = 'month';
        this.selectedFiles = [];
        
        this.init();
    }

    async init() {
        await this.waitForDatabase();
        this.loadUserData();
        this.setupEventListeners();
        this.checkAuth();
        await this.loadScheduledPosts();
        this.renderCalendar();
        this.renderScheduledPosts();
        this.generateAIRecommendations();
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
        // Navigation
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.logout.bind(this));
        }

        // Calendar navigation
        const prevMonth = document.getElementById('prevMonth');
        const nextMonth = document.getElementById('nextMonth');
        if (prevMonth) prevMonth.addEventListener('click', this.navigateMonth.bind(this, -1));
        if (nextMonth) nextMonth.addEventListener('click', this.navigateMonth.bind(this, 1));

        // View toggles
        document.querySelectorAll('.view-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });

        // Modal triggers
        const addScheduledPost = document.getElementById('addScheduledPost');
        const bulkSchedule = document.getElementById('bulkSchedule');
        if (addScheduledPost) addScheduledPost.addEventListener('click', this.showScheduleModal.bind(this));
        if (bulkSchedule) bulkSchedule.addEventListener('click', this.showBulkModal.bind(this));

        // File uploads
        this.setupFileUpload();
        this.setupBulkUpload();

        // Caption counter
        const captionInput = document.getElementById('scheduleCaption');
        const captionCount = document.getElementById('captionCount');
        if (captionInput && captionCount) {
            captionInput.addEventListener('input', () => {
                captionCount.textContent = captionInput.value.length;
            });
        }

        // Filters
        const statusFilter = document.getElementById('statusFilter');
        const platformFilter = document.getElementById('platformFilter');
        if (statusFilter) statusFilter.addEventListener('change', this.filterPosts.bind(this));
        if (platformFilter) platformFilter.addEventListener('change', this.filterPosts.bind(this));
    }

    logout() {
        localStorage.removeItem('nocturna_current_user');
        window.location.href = 'index.html';
    }

    async loadScheduledPosts() {
        // Load from localStorage (in real app, this would be from database)
        const saved = localStorage.getItem(`nocturna_scheduled_${this.currentUser?.id}`);
        if (saved) {
            this.scheduledPosts = JSON.parse(saved);
        } else {
            // Create sample scheduled posts
            this.scheduledPosts = this.generateSamplePosts();
            this.saveScheduledPosts();
        }
    }

    generateSamplePosts() {
        const now = new Date();
        const posts = [];
        
        for (let i = 1; i <= 10; i++) {
            const scheduleDate = new Date(now);
            scheduleDate.setDate(now.getDate() + i);
            scheduleDate.setHours(20 + (i % 4), (i * 15) % 60);
            
            posts.push({
                id: `scheduled_${i}`,
                caption: `Scheduled post ${i} - Exciting content coming your way!`,
                tags: ['scheduled', 'content', 'exciting'],
                scheduleDate: scheduleDate.toISOString(),
                platforms: ['nocturna', i % 2 === 0 ? 'instagram' : 'twitter'],
                privacy: i % 3 === 0 ? 'premium' : 'subscribers',
                status: 'scheduled',
                fileCount: Math.floor(Math.random() * 3) + 1,
                mediaType: i % 2 === 0 ? 'image' : 'video'
            });
        }

        return posts;
    }

    saveScheduledPosts() {
        localStorage.setItem(`nocturna_scheduled_${this.currentUser.id}`, JSON.stringify(this.scheduledPosts));
    }

    navigateMonth(direction) {
        this.currentMonth += direction;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        } else if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.renderCalendar();
    }

    switchView(view) {
        document.querySelectorAll('.view-toggle').forEach(toggle => {
            toggle.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        this.currentView = view;
        this.renderCalendar();
    }

    renderCalendar() {
        const calendarGrid = document.getElementById('calendarGrid');
        const currentMonthEl = document.getElementById('currentMonth');
        
        if (!calendarGrid || !currentMonthEl) return;

        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        currentMonthEl.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;

        if (this.currentView === 'month') {
            this.renderMonthView(calendarGrid);
        } else if (this.currentView === 'week') {
            this.renderWeekView(calendarGrid);
        } else {
            this.renderListView(calendarGrid);
        }
    }

    renderMonthView(container) {
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        let html = '<div class="calendar-month">';
        
        // Header
        html += '<div class="calendar-header-row">';
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
            html += `<div class="calendar-header-cell">${day}</div>`;
        });
        html += '</div>';

        // Days
        const currentDate = new Date(startDate);
        for (let week = 0; week < 6; week++) {
            html += '<div class="calendar-week">';
            for (let day = 0; day < 7; day++) {
                const isCurrentMonth = currentDate.getMonth() === this.currentMonth;
                const isToday = this.isToday(currentDate);
                const posts = this.getPostsForDate(currentDate);

                html += `
                    <div class="calendar-day ${isCurrentMonth ? 'current-month' : 'other-month'} ${isToday ? 'today' : ''}" 
                         onclick="selectDate('${currentDate.toISOString()}')">
                        <div class="day-number">${currentDate.getDate()}</div>
                        <div class="day-posts">
                            ${posts.map(post => `
                                <div class="post-indicator ${post.status}" title="${post.caption}">
                                    ${post.mediaType === 'video' ? '🎥' : '📸'}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
                currentDate.setDate(currentDate.getDate() + 1);
            }
            html += '</div>';
        }

        html += '</div>';
        container.innerHTML = html;
    }

    renderWeekView(container) {
        // Week view implementation
        container.innerHTML = '<div class="week-view">Week view coming soon!</div>';
    }

    renderListView(container) {
        // List view implementation
        container.innerHTML = '<div class="list-view">List view - see Upcoming Posts section below</div>';
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    getPostsForDate(date) {
        return this.scheduledPosts.filter(post => {
            const postDate = new Date(post.scheduleDate);
            return postDate.toDateString() === date.toDateString();
        });
    }

    renderScheduledPosts() {
        const postsList = document.getElementById('scheduledPostsList');
        if (!postsList) return;

        const sortedPosts = [...this.scheduledPosts].sort((a, b) => 
            new Date(a.scheduleDate) - new Date(b.scheduleDate)
        );

        const html = sortedPosts.map(post => {
            const scheduleDate = new Date(post.scheduleDate);
            const isOverdue = scheduleDate < new Date() && post.status === 'scheduled';
            
            return `
                <div class="scheduled-post-item ${post.status}" data-id="${post.id}">
                    <div class="post-preview">
                        <div class="media-indicator ${post.mediaType}">
                            ${post.mediaType === 'video' ? '🎥' : '📸'}
                        </div>
                        <div class="post-details">
                            <h4>${post.caption.substring(0, 50)}${post.caption.length > 50 ? '...' : ''}</h4>
                            <div class="post-meta">
                                <span class="schedule-time">
                                    ${scheduleDate.toLocaleDateString()} at ${scheduleDate.toLocaleTimeString()}
                                </span>
                                <span class="platforms">
                                    ${post.platforms.map(platform => `<span class="platform-tag ${platform}">${platform}</span>`).join('')}
                                </span>
                            </div>
                            <div class="post-tags">
                                ${post.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="post-actions">
                        <span class="status-badge ${post.status}">${post.status}</span>
                        ${isOverdue ? '<span class="overdue-badge">Overdue</span>' : ''}
                        <div class="action-buttons">
                            <button class="btn btn-small" onclick="editPost('${post.id}')">Edit</button>
                            <button class="btn btn-small btn-danger" onclick="deletePost('${post.id}')">Delete</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        postsList.innerHTML = html || '<div class="empty-state">No scheduled posts found.</div>';
    }

    filterPosts() {
        const statusFilter = document.getElementById('statusFilter')?.value || 'all';
        const platformFilter = document.getElementById('platformFilter')?.value || 'all';

        const items = document.querySelectorAll('.scheduled-post-item');
        items.forEach(item => {
            const post = this.scheduledPosts.find(p => p.id === item.dataset.id);
            if (!post) return;

            const statusMatch = statusFilter === 'all' || post.status === statusFilter;
            const platformMatch = platformFilter === 'all' || post.platforms.includes(platformFilter);

            item.style.display = statusMatch && platformMatch ? 'flex' : 'none';
        });
    }

    generateAIRecommendations() {
        const container = document.getElementById('aiSchedulingRecommendations');
        if (!container) return;

        const recommendations = [
            {
                title: 'Peak Engagement Window',
                description: 'Schedule 3 posts between 8-10 PM this week for 40% higher engagement',
                action: 'Auto-Schedule',
                priority: 'high',
                icon: '📈'
            },
            {
                title: 'Content Gap Detected',
                description: 'No video content scheduled for next week. Videos get 3x more tips',
                action: 'Add Video',
                priority: 'medium',
                icon: '🎥'
            },
            {
                title: 'Optimal Frequency',
                description: 'Current posting schedule is optimal. Maintain 1 post every 2 days',
                action: 'Continue',
                priority: 'low',
                icon: '✅'
            },
            {
                title: 'Cross-Platform Opportunity',
                description: 'Share your top post to Instagram for 25% more followers',
                action: 'Cross-Post',
                priority: 'medium',
                icon: '🔄'
            }
        ];

        container.innerHTML = recommendations.map(rec => `
            <div class="recommendation-card ${rec.priority}">
                <div class="rec-icon">${rec.icon}</div>
                <div class="rec-content">
                    <h4>${rec.title}</h4>
                    <p>${rec.description}</p>
                    <button class="btn btn-primary">${rec.action}</button>
                </div>
                <span class="priority-badge ${rec.priority}">${rec.priority}</span>
            </div>
        `).join('');
    }

    setupFileUpload() {
        const uploadArea = document.getElementById('scheduleUploadArea');
        const fileInput = document.getElementById('scheduleFileInput');

        if (!uploadArea || !fileInput) return;

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            this.handleFileSelection(e.dataTransfer.files, 'schedule');
        });

        fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files, 'schedule');
        });
    }

    setupBulkUpload() {
        const bulkInput = document.getElementById('bulkFileInput');
        if (bulkInput) {
            bulkInput.addEventListener('change', (e) => {
                this.handleFileSelection(e.target.files, 'bulk');
            });
        }
    }

    handleFileSelection(files, type) {
        const fileArray = Array.from(files);
        const validFiles = fileArray.filter(file => {
            return file.type.startsWith('image/') || file.type.startsWith('video/');
        });

        if (type === 'schedule') {
            this.selectedFiles = validFiles;
            this.renderFilePreviews();
        } else if (type === 'bulk') {
            this.renderBulkFiles(validFiles);
        }
    }

    renderFilePreviews() {
        const container = document.getElementById('scheduleFilePreviews');
        if (!container) return;

        if (this.selectedFiles.length === 0) {
            container.innerHTML = '';
            return;
        }

        const html = this.selectedFiles.map((file, index) => `
            <div class="file-preview-item">
                <div class="file-icon">${file.type.startsWith('video/') ? '🎥' : '📸'}</div>
                <span class="file-name">${file.name}</span>
                <button class="btn btn-small btn-danger" onclick="removeFile(${index})">×</button>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    renderBulkFiles(files) {
        const container = document.getElementById('bulkFilesList');
        if (!container) return;

        if (files.length === 0) {
            container.innerHTML = '';
            return;
        }

        const html = files.map((file, index) => `
            <div class="bulk-file-item">
                <div class="file-info">
                    <div class="file-icon">${file.type.startsWith('video/') ? '🎥' : '📸'}</div>
                    <span class="file-name">${file.name}</span>
                </div>
                <div class="file-settings">
                    <input type="text" placeholder="Caption for this file..." class="file-caption">
                    <input type="text" placeholder="Tags..." class="file-tags">
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
        this.bulkFiles = files;
    }

    showScheduleModal() {
        const modal = document.getElementById('schedulePostModal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Set default date and time
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            document.getElementById('scheduleDate').value = tomorrow.toISOString().split('T')[0];
            document.getElementById('scheduleTime').value = '20:00';
        }
    }

    closeScheduleModal() {
        const modal = document.getElementById('schedulePostModal');
        if (modal) {
            modal.style.display = 'none';
            this.selectedFiles = [];
            this.renderFilePreviews();
        }
    }

    showBulkModal() {
        const modal = document.getElementById('bulkScheduleModal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Set default start date
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            document.getElementById('bulkStartDate').value = tomorrow.toISOString().split('T')[0];
        }
    }

    closeBulkModal() {
        const modal = document.getElementById('bulkScheduleModal');
        if (modal) {
            modal.style.display = 'none';
            this.bulkFiles = [];
            document.getElementById('bulkFilesList').innerHTML = '';
        }
    }

    schedulePost() {
        const caption = document.getElementById('scheduleCaption')?.value;
        const tags = document.getElementById('scheduleTags')?.value.split(',').map(t => t.trim()).filter(t => t);
        const date = document.getElementById('scheduleDate')?.value;
        const time = document.getElementById('scheduleTime')?.value;
        const privacy = document.getElementById('schedulePrivacy')?.value;

        if (!caption || !date || !time) {
            alert('Please fill in all required fields');
            return;
        }

        const scheduleDate = new Date(`${date}T${time}`);
        const platforms = [];
        
        ['nocturna', 'instagram', 'twitter', 'tiktok'].forEach(platform => {
            const checkbox = document.getElementById(`platform${platform.charAt(0).toUpperCase() + platform.slice(1)}`);
            if (checkbox?.checked) {
                platforms.push(platform);
            }
        });

        const newPost = {
            id: `scheduled_${Date.now()}`,
            caption,
            tags,
            scheduleDate: scheduleDate.toISOString(),
            platforms,
            privacy,
            status: 'scheduled',
            fileCount: this.selectedFiles.length,
            mediaType: this.selectedFiles.some(f => f.type.startsWith('video/')) ? 'video' : 'image'
        };

        this.scheduledPosts.push(newPost);
        this.saveScheduledPosts();
        this.renderCalendar();
        this.renderScheduledPosts();
        this.closeScheduleModal();

        alert('Post scheduled successfully!');
    }

    saveDraft() {
        // Save as draft functionality
        alert('Post saved as draft!');
        this.closeScheduleModal();
    }

    processBulkSchedule() {
        if (!this.bulkFiles || this.bulkFiles.length === 0) {
            alert('Please select files to schedule');
            return;
        }

        const startDate = new Date(document.getElementById('bulkStartDate')?.value);
        const frequency = document.getElementById('bulkFrequency')?.value;
        const time = document.getElementById('bulkTime')?.value;
        const privacy = document.getElementById('bulkPrivacy')?.value;

        let scheduleDate = new Date(startDate);
        const [hours, minutes] = time.split(':');
        scheduleDate.setHours(parseInt(hours), parseInt(minutes));

        this.bulkFiles.forEach((file, index) => {
            const captionInput = document.querySelectorAll('.file-caption')[index];
            const tagsInput = document.querySelectorAll('.file-tags')[index];
            
            const newPost = {
                id: `bulk_${Date.now()}_${index}`,
                caption: captionInput?.value || `Auto-scheduled post ${index + 1}`,
                tags: tagsInput?.value ? tagsInput.value.split(',').map(t => t.trim()) : [],
                scheduleDate: scheduleDate.toISOString(),
                platforms: ['nocturna'],
                privacy,
                status: 'scheduled',
                fileCount: 1,
                mediaType: file.type.startsWith('video/') ? 'video' : 'image'
            };

            this.scheduledPosts.push(newPost);

            // Calculate next schedule date based on frequency
            if (frequency === 'daily') {
                scheduleDate.setDate(scheduleDate.getDate() + 1);
            } else if (frequency === 'every-other-day') {
                scheduleDate.setDate(scheduleDate.getDate() + 2);
            } else if (frequency === 'weekly') {
                scheduleDate.setDate(scheduleDate.getDate() + 7);
            }
        });

        this.saveScheduledPosts();
        this.renderCalendar();
        this.renderScheduledPosts();
        this.closeBulkModal();

        alert(`${this.bulkFiles.length} posts scheduled successfully!`);
    }

    editPost(postId) {
        const post = this.scheduledPosts.find(p => p.id === postId);
        if (!post) return;

        // Open schedule modal with post data pre-filled
        this.showScheduleModal();
        
        document.getElementById('scheduleCaption').value = post.caption;
        document.getElementById('scheduleTags').value = post.tags.join(', ');
        
        const scheduleDate = new Date(post.scheduleDate);
        document.getElementById('scheduleDate').value = scheduleDate.toISOString().split('T')[0];
        document.getElementById('scheduleTime').value = scheduleDate.toTimeString().slice(0, 5);
        document.getElementById('schedulePrivacy').value = post.privacy;

        // Set platform checkboxes
        ['nocturna', 'instagram', 'twitter', 'tiktok'].forEach(platform => {
            const checkbox = document.getElementById(`platform${platform.charAt(0).toUpperCase() + platform.slice(1)}`);
            if (checkbox) {
                checkbox.checked = post.platforms.includes(platform);
            }
        });
    }

    deletePost(postId) {
        if (confirm('Are you sure you want to delete this scheduled post?')) {
            this.scheduledPosts = this.scheduledPosts.filter(p => p.id !== postId);
            this.saveScheduledPosts();
            this.renderCalendar();
            this.renderScheduledPosts();
        }
    }

    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.renderFilePreviews();
    }

    useOptimalTime(date, time) {
        document.getElementById('scheduleDate').value = date;
        document.getElementById('scheduleTime').value = time;
    }

    useTemplate(templateType) {
        const templates = {
            'photo-series': {
                caption: '📸 New photo series dropping soon! Can\'t wait to share these moments with you all ✨',
                tags: 'photoseries,newcontent,excited'
            },
            'video-teaser': {
                caption: '🎥 Something special is coming your way... Any guesses what it could be? 😉',
                tags: 'teaser,comingsoon,mystery'
            },
            'behind-scenes': {
                caption: '🎬 Behind the scenes of today\'s shoot! Love showing you the process 💫',
                tags: 'behindthescenes,process,creative'
            },
            'announcement': {
                caption: '🎉 Big announcement coming! Make sure notifications are on so you don\'t miss it 🔔',
                tags: 'announcement,exciting,news'
            }
        };

        const template = templates[templateType];
        if (template) {
            this.showScheduleModal();
            document.getElementById('scheduleCaption').value = template.caption;
            document.getElementById('scheduleTags').value = template.tags;
        }
    }
}

// Global functions for HTML onclick handlers
function closeScheduleModal() {
    if (window.schedulerApp) {
        window.schedulerApp.closeScheduleModal();
    }
}

function closeBulkModal() {
    if (window.schedulerApp) {
        window.schedulerApp.closeBulkModal();
    }
}

function schedulePost() {
    if (window.schedulerApp) {
        window.schedulerApp.schedulePost();
    }
}

function saveDraft() {
    if (window.schedulerApp) {
        window.schedulerApp.saveDraft();
    }
}

function processBulkSchedule() {
    if (window.schedulerApp) {
        window.schedulerApp.processBulkSchedule();
    }
}

function editPost(postId) {
    if (window.schedulerApp) {
        window.schedulerApp.editPost(postId);
    }
}

function deletePost(postId) {
    if (window.schedulerApp) {
        window.schedulerApp.deletePost(postId);
    }
}

function removeFile(index) {
    if (window.schedulerApp) {
        window.schedulerApp.removeFile(index);
    }
}

function selectDate(dateString) {
    // Handle calendar date selection
    console.log('Selected date:', dateString);
}

function useOptimalTime(date, time) {
    if (window.schedulerApp) {
        window.schedulerApp.useOptimalTime(date, time);
    }
}

function useTemplate(templateType) {
    if (window.schedulerApp) {
        window.schedulerApp.useTemplate(templateType);
    }
}

// Initialize scheduler when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.schedulerApp = new NocturnaScheduler();
});