// Nocturna Admin Portal - Admin JavaScript
class NocturnaAdmin {
    constructor() {
        this.isLoggedIn = false;
        this.users = [];
        this.uploads = [];
        this.filteredUsers = [];
        this.filteredUploads = [];
        this.currentTab = 'creators';
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.checkAdminAuth();
    }

    loadData() {
        this.users = JSON.parse(localStorage.getItem('nocturna_users')) || [];
        this.uploads = JSON.parse(localStorage.getItem('nocturna_uploads')) || [];
        this.filteredUsers = [...this.users];
        this.filteredUploads = [...this.uploads];
    }

    checkAdminAuth() {
        const adminSession = sessionStorage.getItem('nocturna_admin_session');
        if (adminSession === 'active') {
            this.isLoggedIn = true;
            this.showDashboard();
        } else {
            this.showLoginModal();
        }
    }

    setupEventListeners() {
        // Admin login form
        const adminLoginForm = document.getElementById('adminLoginForm');
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', this.handleAdminLogin.bind(this));
        }

        // Admin logout
        const adminLogoutBtn = document.getElementById('adminLogoutBtn');
        if (adminLogoutBtn) {
            adminLogoutBtn.addEventListener('click', this.logout.bind(this));
        }

        // Tab navigation
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });

        // Search and filter controls
        this.setupSearchAndFilters();

        // Export data button
        const exportBtn = document.getElementById('exportDataBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', this.exportData.bind(this));
        }
    }

    setupSearchAndFilters() {
        // Creator search
        const creatorSearch = document.getElementById('creatorSearch');
        if (creatorSearch) {
            creatorSearch.addEventListener('input', this.filterCreators.bind(this));
        }

        // Creator sort
        const creatorSort = document.getElementById('creatorSort');
        if (creatorSort) {
            creatorSort.addEventListener('change', this.sortCreators.bind(this));
        }

        // Upload search
        const uploadSearch = document.getElementById('uploadSearch');
        if (uploadSearch) {
            uploadSearch.addEventListener('input', this.filterUploads.bind(this));
        }

        // Upload filters
        const fileTypeFilter = document.getElementById('fileTypeFilter');
        const timeFilter = document.getElementById('timeFilter');
        const uploaderFilter = document.getElementById('uploaderFilter');

        if (fileTypeFilter) {
            fileTypeFilter.addEventListener('change', this.filterUploads.bind(this));
        }
        if (timeFilter) {
            timeFilter.addEventListener('change', this.filterUploads.bind(this));
        }
        if (uploaderFilter) {
            uploaderFilter.addEventListener('change', this.filterUploads.bind(this));
        }
    }

    // Authentication
    handleAdminLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;

        // Simple hardcoded admin credentials
        if (username === 'admin' && password === 'nocturna2025') {
            this.isLoggedIn = true;
            sessionStorage.setItem('nocturna_admin_session', 'active');
            this.showDashboard();
        } else {
            this.showError('adminLoginError', 'Invalid admin credentials');
        }
    }

    logout() {
        this.isLoggedIn = false;
        sessionStorage.removeItem('nocturna_admin_session');
        window.location.reload();
    }

    showLoginModal() {
        const modal = document.getElementById('adminLoginModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    showDashboard() {
        const modal = document.getElementById('adminLoginModal');
        const dashboard = document.getElementById('adminDashboard');
        
        if (modal) {
            modal.style.display = 'none';
        }
        if (dashboard) {
            dashboard.style.display = 'block';
        }

        this.updateStats();
        this.renderCreators();
        this.renderUploads();
        this.populateUploaderFilter();
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    // Tab Management
    switchTab(tabName) {
        this.currentTab = tabName;

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');
    }

    // Statistics
    updateStats() {
        const today = new Date().toDateString();
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const activeToday = this.users.filter(user => 
            new Date(user.last_active).toDateString() === today
        ).length;

        const recentUploads = this.uploads.filter(upload => 
            new Date(upload.upload_date) >= last24h
        ).length;

        this.updateElement('totalUsers', this.users.length);
        this.updateElement('totalUploadsAdmin', this.uploads.length);
        this.updateElement('activeToday', activeToday);
        this.updateElement('recentUploads', recentUploads);
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    // Creator Management
    filterCreators() {
        const searchTerm = document.getElementById('creatorSearch').value.toLowerCase();
        
        this.filteredUsers = this.users.filter(user => 
            user.username.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm)
        );

        this.sortCreators();
    }

    sortCreators() {
        const sortBy = document.getElementById('creatorSort').value;
        
        this.filteredUsers.sort((a, b) => {
            switch (sortBy) {
                case 'username':
                    return a.username.localeCompare(b.username);
                case 'email':
                    return a.email.localeCompare(b.email);
                case 'uploads':
                    return (b.uploads_count || 0) - (a.uploads_count || 0);
                case 'date_joined':
                default:
                    return new Date(b.date_joined) - new Date(a.date_joined);
            }
        });

        this.renderCreators();
    }

    renderCreators() {
        const tableBody = document.getElementById('creatorsTableBody');
        if (!tableBody) return;

        if (this.filteredUsers.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; opacity: 0.6;">No creators found</td></tr>';
            return;
        }

        tableBody.innerHTML = this.filteredUsers.map(user => {
            const userUploads = this.uploads.filter(upload => upload.user_id === user.id);
            
            return `
                <tr>
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td>${user.phone}</td>
                    <td>${new Date(user.date_joined).toLocaleDateString()}</td>
                    <td>${userUploads.length}</td>
                    <td>${new Date(user.last_active).toLocaleDateString()}</td>
                    <td>
                        <span class="status-badge ${user.status}">
                            ${user.status}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-outline" onclick="admin.toggleUserStatus('${user.id}')">
                                ${user.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button class="btn btn-outline" onclick="admin.viewUserDetails('${user.id}')">
                                View
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    toggleUserStatus(userId) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            user.status = user.status === 'active' ? 'inactive' : 'active';
            localStorage.setItem('nocturna_users', JSON.stringify(this.users));
            this.loadData();
            this.renderCreators();
        }
    }

    viewUserDetails(userId) {
        const user = this.users.find(u => u.id === userId);
        const userUploads = this.uploads.filter(upload => upload.user_id === userId);
        
        if (user) {
            alert(`User Details:
Username: ${user.username}
Email: ${user.email}
Phone: ${user.phone}
Joined: ${new Date(user.date_joined).toLocaleDateString()}
Status: ${user.status}
Total Uploads: ${userUploads.length}
Last Active: ${new Date(user.last_active).toLocaleDateString()}`);
        }
    }

    // Upload Management
    populateUploaderFilter() {
        const uploaderFilter = document.getElementById('uploaderFilter');
        if (!uploaderFilter) return;

        const uploaders = [...new Set(this.uploads.map(upload => upload.username))];
        
        uploaderFilter.innerHTML = '<option value="">All Uploaders</option>' +
            uploaders.map(uploader => `<option value="${uploader}">${uploader}</option>`).join('');
    }

    filterUploads() {
        const searchTerm = document.getElementById('uploadSearch').value.toLowerCase();
        const fileTypeFilter = document.getElementById('fileTypeFilter').value;
        const timeFilter = document.getElementById('timeFilter').value;
        const uploaderFilter = document.getElementById('uploaderFilter').value;

        this.filteredUploads = this.uploads.filter(upload => {
            // Search filter
            const matchesSearch = 
                upload.caption.toLowerCase().includes(searchTerm) ||
                upload.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
                upload.username.toLowerCase().includes(searchTerm);

            // File type filter
            const matchesFileType = !fileTypeFilter || upload.file_type === fileTypeFilter;

            // Time filter
            let matchesTime = true;
            if (timeFilter) {
                const uploadDate = new Date(upload.upload_date);
                const now = new Date();
                
                switch (timeFilter) {
                    case '24h':
                        matchesTime = (now - uploadDate) <= 24 * 60 * 60 * 1000;
                        break;
                    case '7d':
                        matchesTime = (now - uploadDate) <= 7 * 24 * 60 * 60 * 1000;
                        break;
                    case '30d':
                        matchesTime = (now - uploadDate) <= 30 * 24 * 60 * 60 * 1000;
                        break;
                }
            }

            // Uploader filter
            const matchesUploader = !uploaderFilter || upload.username === uploaderFilter;

            return matchesSearch && matchesFileType && matchesTime && matchesUploader;
        });

        this.renderUploads();
    }

    renderUploads() {
        const uploadsGrid = document.getElementById('uploadsGrid');
        if (!uploadsGrid) return;

        if (this.filteredUploads.length === 0) {
            uploadsGrid.innerHTML = '<p style="text-align: center; opacity: 0.6; grid-column: 1/-1;">No uploads found</p>';
            return;
        }

        uploadsGrid.innerHTML = this.filteredUploads.map(upload => `
            <div class="upload-item">
                ${this.renderUploadMedia(upload)}
                <div class="upload-info">
                    <div class="upload-caption">${upload.caption || 'No caption'}</div>
                    <div class="upload-tags">
                        ${upload.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <div class="upload-meta">
                        ${upload.file_type} • ${this.formatFileSize(upload.file_size)} • 
                        ${new Date(upload.upload_date).toLocaleDateString()} •
                        by ${upload.username}
                    </div>
                    <div class="upload-actions">
                        <button class="btn btn-outline" onclick="admin.viewUpload('${upload.id}')">
                            View Full
                        </button>
                        <button class="btn btn-outline" onclick="admin.flagUpload('${upload.id}')">
                            Flag
                        </button>
                        <button class="btn btn-outline" onclick="admin.deleteUpload('${upload.id}')">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `).reverse().join('');
    }

    renderUploadMedia(upload) {
        if (upload.preview) {
            if (upload.file_type === 'image') {
                return `<img src="${upload.preview}" alt="Upload" class="upload-media">`;
            } else if (upload.file_type === 'video') {
                return `<video src="${upload.preview}" class="upload-media" controls></video>`;
            }
        }
        
        const icon = upload.file_type === 'image' ? '🖼️' : '🎥';
        return `<div class="upload-placeholder">${icon}</div>`;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    viewUpload(uploadId) {
        const upload = this.uploads.find(u => u.id === uploadId);
        if (upload) {
            // Create a modal to show full upload details
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 600px;">
                    <h2>Upload Details</h2>
                    ${this.renderUploadMedia(upload)}
                    <div style="margin-top: 1rem;">
                        <p><strong>Caption:</strong> ${upload.caption || 'No caption'}</p>
                        <p><strong>Tags:</strong> ${upload.tags.join(', ') || 'No tags'}</p>
                        <p><strong>File:</strong> ${upload.file_name}</p>
                        <p><strong>Type:</strong> ${upload.file_type}</p>
                        <p><strong>Size:</strong> ${this.formatFileSize(upload.file_size)}</p>
                        <p><strong>Uploaded by:</strong> ${upload.username}</p>
                        <p><strong>Date:</strong> ${new Date(upload.upload_date).toLocaleString()}</p>
                    </div>
                    <button class="btn btn-primary" onclick="this.parentElement.parentElement.remove()">
                        Close
                    </button>
                </div>
            `;
            document.body.appendChild(modal);
        }
    }

    flagUpload(uploadId) {
        const upload = this.uploads.find(u => u.id === uploadId);
        if (upload) {
            upload.flagged = !upload.flagged;
            localStorage.setItem('nocturna_uploads', JSON.stringify(this.uploads));
            this.loadData();
            this.renderUploads();
            
            const action = upload.flagged ? 'flagged' : 'unflagged';
            alert(`Upload ${action} successfully`);
        }
    }

    deleteUpload(uploadId) {
        if (confirm('Are you sure you want to delete this upload?')) {
            this.uploads = this.uploads.filter(u => u.id !== uploadId);
            localStorage.setItem('nocturna_uploads', JSON.stringify(this.uploads));
            this.loadData();
            this.renderUploads();
            this.updateStats();
            
            alert('Upload deleted successfully');
        }
    }

    // Data Export
    exportData() {
        const exportData = {
            users: this.users,
            uploads: this.uploads,
            exportDate: new Date().toISOString(),
            stats: {
                totalUsers: this.users.length,
                totalUploads: this.uploads.length,
                activeUsers: this.users.filter(u => u.status === 'active').length
            }
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `nocturna-export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }
}

// Initialize admin app
const admin = new NocturnaAdmin();

// Make admin object globally available
window.admin = admin;
