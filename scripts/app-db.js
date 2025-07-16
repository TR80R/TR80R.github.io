// Nocturna Creator App with Database Integration
class NocturnaAppDB {
    constructor() {
        this.currentUser = null;
        this.uploads = [];
        this.selectedFiles = [];
        this.aiProgress = 0;
        this.db = null;
        
        this.init();
    }

    async init() {
        console.log('Initializing NocturnaAppDB...');
        try {
            await this.waitForDatabase();
            console.log('Database ready');
            this.loadUserData();
            await this.loadUploads();
            this.setupEventListeners();
            this.checkAuth();
            this.updateStats();
            console.log('NocturnaAppDB initialization complete');
        } catch (error) {
            console.error('Failed to initialize NocturnaAppDB:', error);
        }
    }

    async waitForDatabase() {
        // Wait for the global database instance to be ready
        while (!window.nocturnaDB || !window.nocturnaDB.isReady) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        this.db = window.nocturnaDB;
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

    async saveUserData() {
        if (this.currentUser && this.db) {
            try {
                await this.db.put('users', this.currentUser);
                localStorage.setItem('nocturna_current_user', JSON.stringify(this.currentUser));
            } catch (error) {
                console.error('Failed to save user data:', error);
            }
        }
    }

    async loadUploads() {
        if (this.db) {
            try {
                if (this.currentUser) {
                    this.uploads = await this.db.getUploadsByUser(this.currentUser.id);
                } else {
                    this.uploads = await this.db.getAllUploads();
                }
            } catch (error) {
                console.warn('Failed to load uploads from database:', error);
                this.uploads = [];
            }
        }
    }

    async signup(userData) {
        if (!this.db) {
            throw new Error('Database not available');
        }

        try {
            const newUser = await this.db.createUser(userData);
            
            // Auto login after signup
            this.currentUser = newUser;
            this.saveUserData();
            
            return newUser;
        } catch (error) {
            throw error;
        }
    }

    async login(identifier, password) {
        if (!this.db) {
            throw new Error('Database not available');
        }

        try {
            const user = await this.db.authenticateUser(identifier, password);
            this.currentUser = user;
            this.saveUserData();
            return user;
        } catch (error) {
            throw error;
        }
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
    }

    setupFileUpload() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const uploadBtn = document.getElementById('uploadBtn');

        if (!uploadArea || !fileInput) return;

        // Drag and drop
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
            this.handleFileSelection(e.dataTransfer.files);
        });

        // Click to select
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files);
        });

        // Upload button
        if (uploadBtn) {
            uploadBtn.addEventListener('click', this.uploadFiles.bind(this));
        }
    }

    async handleSignup(e) {
        e.preventDefault();
        console.log('Signup form submitted');
        
        this.clearErrors();

        // Wait for database if not ready
        if (!this.db) {
            console.log('Database not ready, waiting...');
            await this.waitForDatabase();
        }

        const formData = new FormData(e.target);
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };

        console.log('Form data:', userData);

        if (!this.validateSignupData(userData)) {
            console.log('Validation failed');
            return;
        }

        try {
            console.log('Attempting signup...');
            await this.signup(userData);
            console.log('Signup successful, redirecting...');
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error('Signup error:', error);
            if (error.message.includes('Username')) {
                this.showError('username', error.message);
            } else if (error.message.includes('Email')) {
                this.showError('email', error.message);
            } else {
                this.showError('general', 'Registration failed: ' + error.message);
            }
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        console.log('Login form submitted');
        
        this.clearErrors();

        // Wait for database if not ready
        if (!this.db) {
            console.log('Database not ready, waiting...');
            await this.waitForDatabase();
        }

        const formData = new FormData(e.target);
        const identifier = formData.get('identifier');
        const password = formData.get('password');

        console.log('Login attempt for:', identifier);

        try {
            await this.login(identifier, password);
            console.log('Login successful, redirecting...');
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error('Login error:', error);
            this.showError('general', 'Invalid credentials: ' + error.message);
        }
    }

    validateSignupData(data) {
        let isValid = true;

        if (!data.username || data.username.length < 3) {
            this.showError('username', 'Username must be at least 3 characters');
            isValid = false;
        }

        if (!data.email || !data.email.includes('@')) {
            this.showError('email', 'Please enter a valid email address');
            isValid = false;
        }

        if (!data.phone || data.phone.length < 10) {
            this.showError('phone', 'Please enter a valid phone number');
            isValid = false;
        }

        if (!data.password || data.password.length < 6) {
            this.showError('password', 'Password must be at least 6 characters');
            isValid = false;
        }

        if (data.password !== data.confirmPassword) {
            this.showError('confirmPassword', 'Passwords do not match');
            isValid = false;
        }

        return isValid;
    }

    showError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}Error`);
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
        if (!this.currentUser) return;

        this.updateUserGreeting();
        this.updateStats();
        this.renderContent();
        this.setupVideoPreview();
    }

    updateUserGreeting() {
        const userGreeting = document.getElementById('userGreeting');
        if (userGreeting && this.currentUser) {
            userGreeting.textContent = `Welcome back, ${this.currentUser.username}!`;
        }
    }

    updateStats() {
        if (!this.currentUser) return;

        this.updateElement('uploadsCount', this.uploads.length);
        this.updateElement('todayUploads', this.getTodayUploads());
        this.updateElement('aiProgress', Math.min(100, this.aiProgress + (this.uploads.length * 5)));
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value + (id === 'aiProgress' ? '%' : '');
        }
    }

    getTodayUploads() {
        const today = new Date().toDateString();
        return this.uploads.filter(upload => 
            new Date(upload.upload_date).toDateString() === today
        ).length;
    }

    // File Upload Methods
    handleFileSelection(files) {
        const fileArray = Array.from(files);
        const validFiles = fileArray.filter(file => {
            const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
            const isValidSize = file.size <= 100 * 1024 * 1024; // 100MB limit
            return isValidType && isValidSize;
        });

        if (validFiles.length === 0) {
            alert('Please select valid image or video files (max 100MB each)');
            return;
        }

        // Limit to 10 files
        const filesToAdd = validFiles.slice(0, 10 - this.selectedFiles.length);
        
        filesToAdd.forEach(file => {
            const fileObj = {
                id: Date.now() + Math.random(),
                file: file,
                preview: null,
                caption: '',
                tags: ''
            };

            // Generate preview
            const reader = new FileReader();
            reader.onload = (e) => {
                fileObj.preview = e.target.result;
                this.renderFilePreview();
            };
            reader.readAsDataURL(file);

            this.selectedFiles.push(fileObj);
        });

        this.generatePreviews();
    }

    generatePreviews() {
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.style.display = this.selectedFiles.length > 0 ? 'block' : 'none';
        }
        this.renderFilePreview();
    }

    renderFilePreview() {
        const previewContainer = document.getElementById('filesPreview');
        if (!previewContainer) return;

        previewContainer.innerHTML = this.selectedFiles.map(fileObj => `
            <div class="file-preview" data-id="${fileObj.id}">
                <div class="preview-media">
                    ${this.renderPreviewMedia(fileObj)}
                </div>
                <div class="file-info">
                    <span class="file-name">${fileObj.file.name}</span>
                    <span class="file-size">${this.formatFileSize(fileObj.file.size)}</span>
                    <button class="remove-file" onclick="app.removeFile('${fileObj.id}')">×</button>
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

    async uploadFiles() {
        if (this.selectedFiles.length === 0 || !this.db) return;

        try {
            for (const fileObj of this.selectedFiles) {
                const uploadData = {
                    user_id: this.currentUser.id,
                    username: this.currentUser.username,
                    file_name: fileObj.file.name,
                    file_type: fileObj.file.type.startsWith('image/') ? 'image' : 'video',
                    file_size: fileObj.file.size,
                    caption: fileObj.caption,
                    tags: fileObj.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
                };

                await this.db.createUpload(uploadData, fileObj.preview);
            }

            // Update user upload count
            this.currentUser.uploads_count = (this.currentUser.uploads_count || 0) + this.selectedFiles.length;
            await this.saveUserData();

            // Clear selected files
            this.selectedFiles = [];
            this.renderFilePreview();
            
            const uploadBtn = document.getElementById('uploadBtn');
            if (uploadBtn) {
                uploadBtn.style.display = 'none';
            }

            // Reload uploads and update stats
            await this.loadUploads();
            this.updateStats();
            this.renderContent();
            this.setupVideoPreview();

            // Show success message
            alert('Files uploaded successfully!');
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed. Please try again.');
        }
    }

    // Content Rendering
    async renderContent() {
        const contentGrid = document.getElementById('contentGrid');
        if (!contentGrid || !this.uploads) return;

        if (this.uploads.length === 0) {
            contentGrid.innerHTML = `
                <div class="empty-state">
                    <p>No uploads yet. Start creating!</p>
                </div>
            `;
            return;
        }

        const contentHTML = await Promise.all(this.uploads.map(async upload => {
            let mediaHTML = '';
            
            try {
                const { file } = await this.db.getUploadWithFile(upload.id);
                if (file && file.file_data) {
                    mediaHTML = this.renderContentMedia(upload, file.file_data);
                }
            } catch (error) {
                console.warn('Failed to load file data:', error);
            }

            return `
                <div class="content-item" data-id="${upload.id}">
                    <div class="content-media">
                        ${mediaHTML}
                    </div>
                    <div class="content-info">
                        <h4>${upload.caption || upload.file_name}</h4>
                        <p class="upload-date">${new Date(upload.upload_date).toLocaleDateString()}</p>
                        <div class="content-stats">
                            <span>❤️ ${upload.likes_count || 0}</span>
                            <span>💬 ${upload.comments_count || 0}</span>
                            <span>💎 ${upload.tips_count || 0}</span>
                        </div>
                    </div>
                </div>
            `;
        }));

        contentGrid.innerHTML = contentHTML.join('');
    }

    renderContentMedia(upload, fileData) {
        if (!fileData) {
            return '<div class="media-placeholder">📄</div>';
        }

        if (upload.file_type === 'image') {
            return `<img src="${fileData}" alt="${upload.caption}" class="content-image">`;
        } else if (upload.file_type === 'video') {
            return `<video src="${fileData}" class="content-video" controls></video>`;
        }

        return '<div class="media-placeholder">📄</div>';
    }

    setupVideoPreview() {
        const videos = document.querySelectorAll('.content-video');
        videos.forEach(video => {
            video.addEventListener('loadedmetadata', () => {
                video.currentTime = 1;
            });
        });
    }

    // AI Training Simulation
    nextVideo() {
        // Placeholder for video navigation
    }

    previousVideo() {
        // Placeholder for video navigation
    }

    startAIProgress() {
        this.aiProgress = 0;
        this.updateAIProgress();
    }

    updateAIProgress() {
        const progressInterval = setInterval(() => {
            this.aiProgress += Math.random() * 10;
            this.updateElement('aiProgress', Math.min(100, Math.floor(this.aiProgress)));
            
            if (this.aiProgress >= 100) {
                clearInterval(progressInterval);
            }
        }, 500);
    }

    submitToAI() {
        if (this.uploads.length === 0) {
            alert('Please upload some content first!');
            return;
        }
        
        this.startAIProgress();
        alert('Your content has been submitted for AI training!');
    }
}

// Initialize app with database support
let app;
document.addEventListener('DOMContentLoaded', async () => {
    app = new NocturnaAppDB();
});