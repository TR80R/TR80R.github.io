// Nocturna Creator App - Main JavaScript
class NocturnaApp {
    constructor() {
        this.currentUser = null;
        this.uploads = [];
        this.selectedFiles = [];
        this.aiProgress = 0;
        
        this.init();
    }

    init() {
        this.loadUserData();
        this.loadUploads();
        this.setupEventListeners();
        this.checkAuth();
        this.updateStats();
    }

    // Authentication Methods
    checkAuth() {
        const currentPath = window.location.pathname;
        const protectedPages = ['/dashboard.html'];
        
        if (protectedPages.some(page => currentPath.endsWith(page))) {
            if (!this.currentUser) {
                window.location.href = 'login.html';
                return;
            }
            this.initDashboard();
        }
    }

    loadUserData() {
        this.currentUser = JSON.parse(localStorage.getItem('nocturna_current_user')) || null;
    }

    saveUserData() {
        if (this.currentUser) {
            localStorage.setItem('nocturna_current_user', JSON.stringify(this.currentUser));
        }
    }

    loadUploads() {
        this.uploads = JSON.parse(localStorage.getItem('nocturna_uploads')) || [];
    }

    saveUploads() {
        localStorage.setItem('nocturna_uploads', JSON.stringify(this.uploads));
    }

    signup(userData) {
        // Get existing users
        const users = JSON.parse(localStorage.getItem('nocturna_users')) || [];
        
        // Check if user already exists
        const existingUser = users.find(user => 
            user.email === userData.email || user.username === userData.username
        );
        
        if (existingUser) {
            if (existingUser.email === userData.email) {
                throw new Error('Email already registered');
            }
            if (existingUser.username === userData.username) {
                throw new Error('Username already taken');
            }
        }

        // Create new user
        const newUser = {
            id: Date.now().toString(),
            username: userData.username,
            email: userData.email,
            phone: userData.phone,
            password: userData.password, // In real app, this would be hashed
            date_joined: new Date().toISOString(),
            last_active: new Date().toISOString(),
            status: 'active',
            uploads_count: 0
        };

        users.push(newUser);
        localStorage.setItem('nocturna_users', JSON.stringify(users));

        // Auto login after signup
        this.currentUser = newUser;
        this.saveUserData();
        
        return newUser;
    }

    login(identifier, password) {
        const users = JSON.parse(localStorage.getItem('nocturna_users')) || [];
        
        const user = users.find(user => 
            (user.email === identifier || user.username === identifier) && 
            user.password === password
        );

        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Update last active
        user.last_active = new Date().toISOString();
        const userIndex = users.findIndex(u => u.id === user.id);
        users[userIndex] = user;
        localStorage.setItem('nocturna_users', JSON.stringify(users));

        this.currentUser = user;
        this.saveUserData();
        
        return user;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('nocturna_current_user');
        window.location.href = 'index.html';
    }

    // Event Listeners
    setupEventListeners() {
        // Signup form
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', this.handleSignup.bind(this));
        }

        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.logout.bind(this));
        }

        // File upload
        this.setupFileUpload();

        // Submit to AI Engine
        const submitAiBtn = document.getElementById('submitAiBtn');
        if (submitAiBtn) {
            submitAiBtn.addEventListener('click', this.submitToAI.bind(this));
        }
    }

    setupFileUpload() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const uploadBtn = document.getElementById('uploadBtn');

        if (!uploadArea || !fileInput) return;

        // Click to select files
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files);
            this.handleFileSelection(files);
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleFileSelection(files);
        });

        // Upload button
        if (uploadBtn) {
            uploadBtn.addEventListener('click', this.uploadFiles.bind(this));
        }
    }

    // Form Handlers
    handleSignup(e) {
        e.preventDefault();
        this.clearErrors();

        const formData = new FormData(e.target);
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };

        // Validation
        if (!this.validateSignupData(userData)) {
            return;
        }

        try {
            this.signup(userData);
            window.location.href = 'dashboard.html';
        } catch (error) {
            this.showError('email', error.message);
        }
    }

    handleLogin(e) {
        e.preventDefault();
        this.clearErrors();

        const formData = new FormData(e.target);
        const identifier = formData.get('loginEmail');
        const password = formData.get('loginPassword');

        try {
            this.login(identifier, password);
            window.location.href = 'dashboard.html';
        } catch (error) {
            this.showError('loginEmail', error.message);
        }
    }

    validateSignupData(data) {
        let isValid = true;

        // Username validation
        if (!data.username || data.username.length < 3) {
            this.showError('username', 'Username must be at least 3 characters');
            isValid = false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            this.showError('email', 'Please enter a valid email address');
            isValid = false;
        }

        // Phone validation
        const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
        if (!phoneRegex.test(data.phone)) {
            this.showError('phone', 'Please enter a valid phone number');
            isValid = false;
        }

        // Password validation
        if (data.password.length < 8) {
            this.showError('password', 'Password must be at least 8 characters');
            isValid = false;
        }

        // Confirm password validation
        if (data.password !== data.confirmPassword) {
            this.showError('confirmPassword', 'Passwords do not match');
            isValid = false;
        }

        return isValid;
    }

    showError(fieldName, message) {
        const errorElement = document.getElementById(fieldName + 'Error');
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    clearErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            element.textContent = '';
        });
    }

    // Dashboard Methods
    initDashboard() {
        this.updateUserGreeting();
        this.updateStats();
        this.renderContent();
        this.setupVideoPreview();
        this.startAIProgress();
    }

    updateUserGreeting() {
        const userGreeting = document.getElementById('userGreeting');
        if (userGreeting && this.currentUser) {
            userGreeting.textContent = `Welcome, ${this.currentUser.username}`;
        }
    }

    updateStats() {
        if (!this.currentUser) return;

        const userUploads = this.uploads.filter(upload => upload.user_id === this.currentUser.id);
        const today = new Date().toDateString();
        const todayUploads = userUploads.filter(upload => 
            new Date(upload.upload_date).toDateString() === today
        );

        // Update stat elements
        this.updateElement('totalUploads', userUploads.length);
        this.updateElement('todayUploads', todayUploads.length);
        this.updateElement('aiProgress', Math.round(this.aiProgress) + '%');
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    // File Upload Methods
    handleFileSelection(files) {
        // Limit to 10 files
        const validFiles = files.slice(0, 10).filter(file => {
            const validTypes = ['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime'];
            return validTypes.includes(file.type);
        });

        this.selectedFiles = validFiles.map(file => ({
            file: file,
            caption: '',
            tags: '',
            preview: null,
            id: Date.now() + Math.random()
        }));

        this.generatePreviews();
        this.renderFilePreview();
        
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.style.display = this.selectedFiles.length > 0 ? 'block' : 'none';
        }
    }

    generatePreviews() {
        this.selectedFiles.forEach(fileObj => {
            const reader = new FileReader();
            reader.onload = (e) => {
                fileObj.preview = e.target.result;
                this.renderFilePreview();
            };
            reader.readAsDataURL(fileObj.file);
        });
    }

    renderFilePreview() {
        const preview = document.getElementById('filesPreview');
        if (!preview) return;

        preview.innerHTML = this.selectedFiles.map(fileObj => `
            <div class="file-preview" data-id="${fileObj.id}">
                <button class="remove-file" onclick="app.removeFile('${fileObj.id}')">×</button>
                ${this.renderPreviewMedia(fileObj)}
                <div class="file-info">
                    <div class="file-name">${fileObj.file.name}</div>
                    <div class="file-size">${this.formatFileSize(fileObj.file.size)}</div>
                </div>
                <input type="text" class="caption-input" placeholder="Add caption..." 
                       value="${fileObj.caption}" 
                       onchange="app.updateFileData('${fileObj.id}', 'caption', this.value)">
                <input type="text" class="tags-input" placeholder="Tags (comma-separated)" 
                       value="${fileObj.tags}" 
                       onchange="app.updateFileData('${fileObj.id}', 'tags', this.value)">
            </div>
        `).join('');
    }

    renderPreviewMedia(fileObj) {
        if (!fileObj.preview) {
            return '<div class="preview-placeholder">📄</div>';
        }

        if (fileObj.file.type.startsWith('image/')) {
            return `<img src="${fileObj.preview}" alt="Preview" class="preview-image">`;
        } else if (fileObj.file.type.startsWith('video/')) {
            return `<video src="${fileObj.preview}" class="preview-video" controls></video>`;
        }

        return '<div class="preview-placeholder">📄</div>';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    removeFile(id) {
        this.selectedFiles = this.selectedFiles.filter(file => file.id !== id);
        this.renderFilePreview();
        
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.style.display = this.selectedFiles.length > 0 ? 'block' : 'none';
        }
    }

    updateFileData(id, field, value) {
        const fileObj = this.selectedFiles.find(file => file.id === id);
        if (fileObj) {
            fileObj[field] = value;
        }
    }

    uploadFiles() {
        if (this.selectedFiles.length === 0) return;

        const uploads = this.selectedFiles.map(fileObj => ({
            id: Date.now() + Math.random(),
            user_id: this.currentUser.id,
            username: this.currentUser.username,
            file_name: fileObj.file.name,
            file_type: fileObj.file.type.startsWith('image/') ? 'image' : 'video',
            file_size: fileObj.file.size,
            caption: fileObj.caption,
            tags: fileObj.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            preview: fileObj.preview,
            upload_date: new Date().toISOString(),
            status: 'completed'
        }));

        this.uploads.push(...uploads);
        this.saveUploads();

        // Update user upload count
        this.currentUser.uploads_count += uploads.length;
        this.saveUserData();

        // Update users in localStorage
        const users = JSON.parse(localStorage.getItem('nocturna_users')) || [];
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = this.currentUser;
            localStorage.setItem('nocturna_users', JSON.stringify(users));
        }

        // Clear selected files
        this.selectedFiles = [];
        this.renderFilePreview();
        
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.style.display = 'none';
        }

        // Update stats and content
        this.updateStats();
        this.renderContent();
        this.setupVideoPreview();

        // Show success message
        alert('Files uploaded successfully!');
    }

    // Content Rendering
    renderContent() {
        const contentGrid = document.getElementById('contentGrid');
        if (!contentGrid || !this.currentUser) return;

        const userUploads = this.uploads.filter(upload => upload.user_id === this.currentUser.id);

        if (userUploads.length === 0) {
            contentGrid.innerHTML = '<p class="empty-state">No content uploaded yet. Start by uploading your first files!</p>';
            return;
        }

        contentGrid.innerHTML = userUploads.map(upload => `
            <div class="content-item">
                ${this.renderContentMedia(upload)}
                <div class="content-info">
                    <div class="content-caption">${upload.caption || 'No caption'}</div>
                    <div class="content-tags">
                        ${upload.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <div class="content-meta">
                        ${upload.file_type} • ${this.formatFileSize(upload.file_size)} • 
                        ${new Date(upload.upload_date).toLocaleDateString()}
                    </div>
                </div>
            </div>
        `).reverse().join('');
    }

    renderContentMedia(upload) {
        if (upload.file_type === 'image') {
            return `<img src="${upload.preview}" alt="Content" class="content-media">`;
        } else if (upload.file_type === 'video') {
            return `<video src="${upload.preview}" class="content-media" controls></video>`;
        }
        return '<div class="content-placeholder">📄</div>';
    }

    // Video Preview (TikTok-like rotation)
    setupVideoPreview() {
        const previewContainer = document.getElementById('videoPreview');
        if (!previewContainer || !this.currentUser) return;

        const userVideos = this.uploads.filter(upload => 
            upload.user_id === this.currentUser.id && upload.file_type === 'video'
        );

        if (userVideos.length === 0) {
            previewContainer.innerHTML = '<p class="preview-placeholder">Upload videos to see preview rotation</p>';
            return;
        }

        let currentVideoIndex = 0;
        const renderVideoRotation = () => {
            const video = userVideos[currentVideoIndex];
            previewContainer.innerHTML = `
                <div class="video-rotation">
                    <video src="${video.preview}" controls autoplay muted></video>
                    <div class="rotation-controls">
                        <button class="btn btn-outline" onclick="app.previousVideo()">Previous</button>
                        <button class="btn btn-outline" onclick="app.nextVideo()">Next</button>
                    </div>
                    <p>${video.caption || 'No caption'}</p>
                </div>
            `;
        };

        this.currentVideoIndex = currentVideoIndex;
        this.userVideos = userVideos;
        renderVideoRotation();
    }

    nextVideo() {
        if (this.userVideos && this.userVideos.length > 0) {
            this.currentVideoIndex = (this.currentVideoIndex + 1) % this.userVideos.length;
            this.setupVideoPreview();
        }
    }

    previousVideo() {
        if (this.userVideos && this.userVideos.length > 0) {
            this.currentVideoIndex = this.currentVideoIndex === 0 ? 
                this.userVideos.length - 1 : this.currentVideoIndex - 1;
            this.setupVideoPreview();
        }
    }

    // AI Engine Simulation
    startAIProgress() {
        // Simulate AI training progress based on upload count
        const userUploads = this.uploads.filter(upload => upload.user_id === this.currentUser?.id || '');
        const baseProgress = Math.min(userUploads.length * 5, 85);
        this.aiProgress = baseProgress + Math.random() * 10;

        this.updateAIProgress();
        
        // Enable submit button if progress > 50%
        const submitBtn = document.getElementById('submitAiBtn');
        if (submitBtn) {
            submitBtn.disabled = this.aiProgress < 50;
        }
    }

    updateAIProgress() {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        if (progressFill) {
            progressFill.style.width = `${this.aiProgress}%`;
        }

        if (progressText) {
            if (this.aiProgress < 25) {
                progressText.textContent = 'Initializing AI training...';
            } else if (this.aiProgress < 50) {
                progressText.textContent = 'Processing content patterns...';
            } else if (this.aiProgress < 75) {
                progressText.textContent = 'Optimizing engagement algorithms...';
            } else {
                progressText.textContent = 'Ready for AI enhancement!';
            }
        }
    }

    submitToAI() {
        const userUploads = this.uploads.filter(upload => upload.user_id === this.currentUser.id);
        
        console.log('=== SUBMITTING TO AI ENGINE ===');
        console.log('User:', this.currentUser.username);
        console.log('Total uploads:', userUploads.length);
        console.log('Upload data:', userUploads);
        console.log('AI Progress:', this.aiProgress + '%');
        console.log('===========================');

        // Simulate AI processing
        alert(`AI Engine processing ${userUploads.length} files for ${this.currentUser.username}. Check console for details.`);
        
        // Increase AI progress
        this.aiProgress = Math.min(100, this.aiProgress + 10);
        this.updateAIProgress();
    }
}

// Initialize app
const app = new NocturnaApp();

// Make some methods globally available for onclick handlers
window.app = app;
