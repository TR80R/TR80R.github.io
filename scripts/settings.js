// Nocturna Settings Manager
class NocturnaSettings {
    constructor() {
        this.currentUser = null;
        this.db = null;
        this.settings = {
            profile: {},
            privacy: {},
            notifications: {},
            content: {},
            ai: {}
        };
        
        this.init();
    }

    async init() {
        await this.waitForDatabase();
        this.loadUserData();
        this.setupEventListeners();
        this.checkAuth();
        this.loadSettings();
        this.updateDisplays();
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
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.logout.bind(this));
        }

        // Profile picture upload
        const profileInput = document.getElementById('profileInput');
        if (profileInput) {
            profileInput.addEventListener('change', this.handleProfilePictureChange.bind(this));
        }

        // Bio character counter
        const bioInput = document.getElementById('bio');
        const bioCount = document.getElementById('bioCount');
        if (bioInput && bioCount) {
            bioInput.addEventListener('input', () => {
                bioCount.textContent = bioInput.value.length;
            });
        }

        // Category tags
        const newCategoryInput = document.getElementById('newCategory');
        if (newCategoryInput) {
            newCategoryInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addCategory(e.target.value);
                    e.target.value = '';
                }
            });
        }

        // Toggle switches
        this.setupToggleSwitches();

        // Active sessions simulation
        this.loadActiveSessions();
    }

    setupToggleSwitches() {
        const toggles = [
            'publicProfile', 'onlineStatus', 'allowPublicTips', 'contentWatermark',
            'notifySubscribers', 'notifyTips', 'notifyComments', 'notifyMessages', 'emailNotifications',
            'aiSuggestions', 'aiCaptions', 'smartScheduling'
        ];

        toggles.forEach(toggleId => {
            const toggle = document.getElementById(toggleId);
            if (toggle) {
                toggle.addEventListener('change', () => {
                    this.updateSetting(toggleId, toggle.checked);
                });
            }
        });
    }

    logout() {
        localStorage.removeItem('nocturna_current_user');
        window.location.href = 'index.html';
    }

    loadSettings() {
        // Load saved settings from localStorage
        const savedSettings = localStorage.getItem(`nocturna_settings_${this.currentUser?.id}`);
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        } else {
            // Default settings
            this.settings = {
                profile: {
                    displayName: this.currentUser?.username || '',
                    bio: '',
                    website: '',
                    location: ''
                },
                privacy: {
                    publicProfile: true,
                    onlineStatus: true,
                    allowPublicTips: true,
                    contentWatermark: false
                },
                notifications: {
                    notifySubscribers: true,
                    notifyTips: true,
                    notifyComments: true,
                    notifyMessages: true,
                    emailNotifications: false
                },
                content: {
                    defaultPrivacy: 'subscribers',
                    autoSchedule: 'disabled',
                    contentLanguage: 'en',
                    categories: ['Lifestyle', 'Fashion', 'Art', 'Photography']
                },
                ai: {
                    aiSuggestions: true,
                    aiCaptions: false,
                    smartScheduling: false,
                    aiPersonality: 'friendly'
                }
            };
        }
    }

    updateDisplays() {
        // Update profile information
        const profileFields = {
            displayName: this.settings.profile.displayName,
            username: this.currentUser?.username || '',
            email: this.currentUser?.email || '',
            bio: this.settings.profile.bio,
            website: this.settings.profile.website,
            location: this.settings.profile.location
        };

        Object.entries(profileFields).forEach(([fieldId, value]) => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = value;
            }
        });

        // Update toggle switches
        Object.entries(this.settings.privacy).forEach(([settingId, value]) => {
            const toggle = document.getElementById(settingId);
            if (toggle) {
                toggle.checked = value;
            }
        });

        Object.entries(this.settings.notifications).forEach(([settingId, value]) => {
            const toggle = document.getElementById(settingId);
            if (toggle) {
                toggle.checked = value;
            }
        });

        Object.entries(this.settings.ai).forEach(([settingId, value]) => {
            if (settingId === 'aiPersonality') {
                const select = document.getElementById(settingId);
                if (select) {
                    select.value = value;
                }
            } else {
                const toggle = document.getElementById(settingId);
                if (toggle) {
                    toggle.checked = value;
                }
            }
        });

        // Update content settings
        const defaultPrivacy = document.getElementById('defaultPrivacy');
        if (defaultPrivacy) {
            defaultPrivacy.value = this.settings.content.defaultPrivacy;
        }

        const autoSchedule = document.getElementById('autoSchedule');
        if (autoSchedule) {
            autoSchedule.value = this.settings.content.autoSchedule;
        }

        const contentLanguage = document.getElementById('contentLanguage');
        if (contentLanguage) {
            contentLanguage.value = this.settings.content.contentLanguage;
        }

        // Update category tags
        this.updateCategoryTags();

        // Update bio character count
        const bioCount = document.getElementById('bioCount');
        if (bioCount) {
            bioCount.textContent = this.settings.profile.bio.length;
        }
    }

    updateCategoryTags() {
        const categoryTags = document.getElementById('categoryTags');
        if (!categoryTags) return;

        categoryTags.innerHTML = this.settings.content.categories.map(category => `
            <span class="tag" onclick="removeCategory('${category}')">
                ${category} ×
            </span>
        `).join('');
    }

    handleProfilePictureChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const profileImg = document.getElementById('profileImg');
            if (profileImg) {
                profileImg.src = event.target.result;
            }
            
            // Save to settings
            this.settings.profile.profilePicture = event.target.result;
            this.saveSettings();
        };
        reader.readAsDataURL(file);
    }

    addCategory(category) {
        if (!category || this.settings.content.categories.includes(category)) return;
        
        this.settings.content.categories.push(category);
        this.updateCategoryTags();
        this.saveSettings();
    }

    removeCategory(category) {
        this.settings.content.categories = this.settings.content.categories.filter(c => c !== category);
        this.updateCategoryTags();
        this.saveSettings();
    }

    updateSetting(settingId, value) {
        // Determine which settings category this belongs to
        if (['publicProfile', 'onlineStatus', 'allowPublicTips', 'contentWatermark'].includes(settingId)) {
            this.settings.privacy[settingId] = value;
        } else if (['notifySubscribers', 'notifyTips', 'notifyComments', 'notifyMessages', 'emailNotifications'].includes(settingId)) {
            this.settings.notifications[settingId] = value;
        } else if (['aiSuggestions', 'aiCaptions', 'smartScheduling'].includes(settingId)) {
            this.settings.ai[settingId] = value;
        }

        this.saveSettings();
    }

    saveProfile() {
        // Collect profile data
        const profileData = {
            displayName: document.getElementById('displayName')?.value || '',
            bio: document.getElementById('bio')?.value || '',
            website: document.getElementById('website')?.value || '',
            location: document.getElementById('location')?.value || ''
        };

        // Update email if changed
        const emailField = document.getElementById('email');
        if (emailField && emailField.value !== this.currentUser.email) {
            this.currentUser.email = emailField.value;
            localStorage.setItem('nocturna_current_user', JSON.stringify(this.currentUser));
        }

        this.settings.profile = { ...this.settings.profile, ...profileData };
        this.saveSettings();

        alert('Profile updated successfully!');
    }

    changePassword() {
        const currentPassword = document.getElementById('currentPassword')?.value;
        const newPassword = document.getElementById('newPassword')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            alert('Please fill in all password fields');
            return;
        }

        if (currentPassword !== this.currentUser.password) {
            alert('Current password is incorrect');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            alert('New password must be at least 6 characters');
            return;
        }

        // Update password
        this.currentUser.password = newPassword;
        localStorage.setItem('nocturna_current_user', JSON.stringify(this.currentUser));

        // Clear password fields
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';

        alert('Password updated successfully!');
    }

    loadActiveSessions() {
        const sessionsList = document.getElementById('activeSessions');
        if (!sessionsList) return;

        // Simulate additional sessions
        const sessions = [
            {
                device: 'Chrome on Windows',
                location: 'New York, US',
                time: 'Now',
                current: true
            },
            {
                device: 'Safari on iPhone',
                location: 'Los Angeles, US',
                time: '2 hours ago',
                current: false
            },
            {
                device: 'Firefox on MacOS',
                location: 'Chicago, US',
                time: '1 day ago',
                current: false
            }
        ];

        sessionsList.innerHTML = sessions.map(session => `
            <div class="session-item">
                <div class="session-info">
                    <strong>${session.device}</strong>
                    <span>${session.location} • ${session.time}</span>
                </div>
                ${session.current ? 
                    '<span class="session-current">Current</span>' : 
                    '<button class="btn btn-danger btn-small" onclick="terminateSession()">Terminate</button>'
                }
            </div>
        `).join('');
    }

    terminateSession() {
        alert('Session terminated successfully');
        this.loadActiveSessions();
    }

    downloadData() {
        // Simulate data export
        alert('Data export request submitted. You will receive an email with download link within 24 hours.');
    }

    confirmDeleteAccount() {
        const modal = document.getElementById('deleteAccountModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    closeDeleteModal() {
        const modal = document.getElementById('deleteAccountModal');
        if (modal) {
            modal.style.display = 'none';
        }
        document.getElementById('deleteConfirmation').value = '';
    }

    deleteAccount() {
        const confirmation = document.getElementById('deleteConfirmation')?.value;
        
        if (confirmation !== 'DELETE') {
            alert('Please type "DELETE" to confirm account deletion');
            return;
        }

        // Simulate account deletion
        alert('Account deletion initiated. Your account will be permanently deleted within 24 hours.');
        this.logout();
    }

    saveSettings() {
        localStorage.setItem(`nocturna_settings_${this.currentUser.id}`, JSON.stringify(this.settings));
    }
}

// Global functions for HTML onclick handlers
function saveProfile() {
    if (window.settingsApp) {
        window.settingsApp.saveProfile();
    }
}

function changePassword() {
    if (window.settingsApp) {
        window.settingsApp.changePassword();
    }
}

function downloadData() {
    if (window.settingsApp) {
        window.settingsApp.downloadData();
    }
}

function confirmDeleteAccount() {
    if (window.settingsApp) {
        window.settingsApp.confirmDeleteAccount();
    }
}

function closeDeleteModal() {
    if (window.settingsApp) {
        window.settingsApp.closeDeleteModal();
    }
}

function deleteAccount() {
    if (window.settingsApp) {
        window.settingsApp.deleteAccount();
    }
}

function removeCategory(category) {
    if (window.settingsApp) {
        window.settingsApp.removeCategory(category);
    }
}

function terminateSession() {
    if (window.settingsApp) {
        window.settingsApp.terminateSession();
    }
}

// Initialize settings when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.settingsApp = new NocturnaSettings();
});