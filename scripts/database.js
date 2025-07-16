// Nocturna Local Database - IndexedDB Implementation
class NocturnaDB {
    constructor() {
        this.dbName = 'NocturnaDB';
        this.dbVersion = 1;
        this.db = null;
        this.isReady = false;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                reject(new Error('Failed to open database'));
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                this.isReady = true;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Users store
                if (!db.objectStoreNames.contains('users')) {
                    const userStore = db.createObjectStore('users', { keyPath: 'id' });
                    userStore.createIndex('username', 'username', { unique: true });
                    userStore.createIndex('email', 'email', { unique: true });
                }

                // Uploads store
                if (!db.objectStoreNames.contains('uploads')) {
                    const uploadStore = db.createObjectStore('uploads', { keyPath: 'id' });
                    uploadStore.createIndex('user_id', 'user_id', { unique: false });
                    uploadStore.createIndex('upload_date', 'upload_date', { unique: false });
                }

                // Files store (for actual file data)
                if (!db.objectStoreNames.contains('files')) {
                    const fileStore = db.createObjectStore('files', { keyPath: 'id' });
                    fileStore.createIndex('upload_id', 'upload_id', { unique: false });
                }

                // Comments store
                if (!db.objectStoreNames.contains('comments')) {
                    const commentStore = db.createObjectStore('comments', { keyPath: 'id' });
                    commentStore.createIndex('upload_id', 'upload_id', { unique: false });
                    commentStore.createIndex('user_id', 'user_id', { unique: false });
                }

                // Likes store
                if (!db.objectStoreNames.contains('likes')) {
                    const likeStore = db.createObjectStore('likes', { keyPath: 'id' });
                    likeStore.createIndex('upload_id', 'upload_id', { unique: false });
                    likeStore.createIndex('user_id', 'user_id', { unique: false });
                }

                // Tips store
                if (!db.objectStoreNames.contains('tips')) {
                    const tipStore = db.createObjectStore('tips', { keyPath: 'id' });
                    tipStore.createIndex('upload_id', 'upload_id', { unique: false });
                    tipStore.createIndex('from_user', 'from_user', { unique: false });
                    tipStore.createIndex('to_user', 'to_user', { unique: false });
                }

                // Follows store
                if (!db.objectStoreNames.contains('follows')) {
                    const followStore = db.createObjectStore('follows', { keyPath: 'id' });
                    followStore.createIndex('follower_id', 'follower_id', { unique: false });
                    followStore.createIndex('following_id', 'following_id', { unique: false });
                }

                // Sessions store
                if (!db.objectStoreNames.contains('sessions')) {
                    const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
                    sessionStore.createIndex('user_id', 'user_id', { unique: false });
                }
            };
        });
    }

    // Generic database operations
    async add(storeName, data) {
        if (!this.isReady) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async put(storeName, data) {
        if (!this.isReady) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, key) {
        if (!this.isReady) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        if (!this.isReady) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, key) {
        if (!this.isReady) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getByIndex(storeName, indexName, value) {
        if (!this.isReady) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // User operations
    async createUser(userData) {
        const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const user = {
            id: userId,
            username: userData.username,
            email: userData.email,
            phone: userData.phone,
            password: userData.password, // In production, this should be hashed
            date_joined: new Date().toISOString(),
            last_active: new Date().toISOString(),
            status: 'active',
            uploads_count: 0,
            followers_count: 0,
            following_count: 0,
            total_tips_received: 0,
            total_tips_sent: 0
        };

        try {
            await this.add('users', user);
            return user;
        } catch (error) {
            if (error.name === 'ConstraintError') {
                throw new Error('Username or email already exists');
            }
            throw error;
        }
    }

    async authenticateUser(identifier, password) {
        const users = await this.getAll('users');
        const user = users.find(u => 
            (u.email === identifier || u.username === identifier) && 
            u.password === password
        );

        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Update last active
        user.last_active = new Date().toISOString();
        await this.put('users', user);

        return user;
    }

    async getUserById(userId) {
        return await this.get('users', userId);
    }

    async getAllUsers() {
        return await this.getAll('users');
    }

    // Upload operations
    async createUpload(uploadData, fileData) {
        const uploadId = 'upload_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const fileId = 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        // Create upload record
        const upload = {
            id: uploadId,
            user_id: uploadData.user_id,
            username: uploadData.username,
            file_name: uploadData.file_name,
            file_type: uploadData.file_type,
            file_size: uploadData.file_size,
            caption: uploadData.caption || '',
            tags: uploadData.tags || [],
            upload_date: new Date().toISOString(),
            status: 'completed',
            likes_count: 0,
            comments_count: 0,
            tips_count: 0,
            views_count: 0,
            file_id: fileId
        };

        // Create file record (store actual file data)
        const file = {
            id: fileId,
            upload_id: uploadId,
            file_name: uploadData.file_name,
            file_type: uploadData.file_type,
            file_size: uploadData.file_size,
            file_data: fileData, // Base64 or Blob data
            created_date: new Date().toISOString()
        };

        try {
            await this.add('uploads', upload);
            await this.add('files', file);
            
            // Update user upload count
            const user = await this.getUserById(uploadData.user_id);
            if (user) {
                user.uploads_count += 1;
                await this.put('users', user);
            }

            return { upload, file };
        } catch (error) {
            throw new Error('Failed to create upload: ' + error.message);
        }
    }

    async getAllUploads() {
        return await this.getAll('uploads');
    }

    async getUploadsByUser(userId) {
        return await this.getByIndex('uploads', 'user_id', userId);
    }

    async getUploadWithFile(uploadId) {
        const upload = await this.get('uploads', uploadId);
        if (upload && upload.file_id) {
            const file = await this.get('files', upload.file_id);
            return { upload, file };
        }
        return { upload, file: null };
    }

    // Comment operations
    async addComment(uploadId, userId, username, text) {
        const commentId = 'comment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const comment = {
            id: commentId,
            upload_id: uploadId,
            user_id: userId,
            username: username,
            text: text,
            created_date: new Date().toISOString()
        };

        await this.add('comments', comment);

        // Update upload comment count
        const upload = await this.get('uploads', uploadId);
        if (upload) {
            upload.comments_count += 1;
            await this.put('uploads', upload);
        }

        return comment;
    }

    async getCommentsByUpload(uploadId) {
        return await this.getByIndex('comments', 'upload_id', uploadId);
    }

    // Like operations
    async toggleLike(uploadId, userId, username) {
        const likes = await this.getByIndex('likes', 'upload_id', uploadId);
        const existingLike = likes.find(like => like.user_id === userId);

        if (existingLike) {
            // Remove like
            await this.delete('likes', existingLike.id);
            
            // Update upload like count
            const upload = await this.get('uploads', uploadId);
            if (upload && upload.likes_count > 0) {
                upload.likes_count -= 1;
                await this.put('uploads', upload);
            }
            
            return { liked: false, count: upload ? upload.likes_count : 0 };
        } else {
            // Add like
            const likeId = 'like_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const like = {
                id: likeId,
                upload_id: uploadId,
                user_id: userId,
                username: username,
                created_date: new Date().toISOString()
            };

            await this.add('likes', like);

            // Update upload like count
            const upload = await this.get('uploads', uploadId);
            if (upload) {
                upload.likes_count += 1;
                await this.put('uploads', upload);
            }

            return { liked: true, count: upload ? upload.likes_count : 0 };
        }
    }

    async isLikedByUser(uploadId, userId) {
        const likes = await this.getByIndex('likes', 'upload_id', uploadId);
        return likes.some(like => like.user_id === userId);
    }

    // Tip operations
    async sendTip(uploadId, fromUserId, toUserId, amount, message = '') {
        const tipId = 'tip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const tip = {
            id: tipId,
            upload_id: uploadId,
            from_user: fromUserId,
            to_user: toUserId,
            amount: amount,
            message: message,
            created_date: new Date().toISOString()
        };

        await this.add('tips', tip);

        // Update upload tip count
        const upload = await this.get('uploads', uploadId);
        if (upload) {
            upload.tips_count += 1;
            await this.put('uploads', upload);
        }

        // Update user tip totals
        const fromUser = await this.getUserById(fromUserId);
        const toUser = await this.getUserById(toUserId);

        if (fromUser) {
            fromUser.total_tips_sent = (fromUser.total_tips_sent || 0) + amount;
            await this.put('users', fromUser);
        }

        if (toUser) {
            toUser.total_tips_received = (toUser.total_tips_received || 0) + amount;
            await this.put('users', toUser);
        }

        return tip;
    }

    async getTipsByUpload(uploadId) {
        return await this.getByIndex('tips', 'upload_id', uploadId);
    }

    // Follow operations
    async toggleFollow(followerId, followingId) {
        const follows = await this.getByIndex('follows', 'follower_id', followerId);
        const existingFollow = follows.find(follow => follow.following_id === followingId);

        if (existingFollow) {
            // Unfollow
            await this.delete('follows', existingFollow.id);

            // Update counts
            const follower = await this.getUserById(followerId);
            const following = await this.getUserById(followingId);

            if (follower) {
                follower.following_count = Math.max(0, (follower.following_count || 0) - 1);
                await this.put('users', follower);
            }

            if (following) {
                following.followers_count = Math.max(0, (following.followers_count || 0) - 1);
                await this.put('users', following);
            }

            return { following: false };
        } else {
            // Follow
            const followId = 'follow_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const follow = {
                id: followId,
                follower_id: followerId,
                following_id: followingId,
                created_date: new Date().toISOString()
            };

            await this.add('follows', follow);

            // Update counts
            const follower = await this.getUserById(followerId);
            const following = await this.getUserById(followingId);

            if (follower) {
                follower.following_count = (follower.following_count || 0) + 1;
                await this.put('users', follower);
            }

            if (following) {
                following.followers_count = (following.followers_count || 0) + 1;
                await this.put('users', following);
            }

            return { following: true };
        }
    }

    async isFollowing(followerId, followingId) {
        const follows = await this.getByIndex('follows', 'follower_id', followerId);
        return follows.some(follow => follow.following_id === followingId);
    }

    async getFollowing(userId) {
        return await this.getByIndex('follows', 'follower_id', userId);
    }

    async getFollowers(userId) {
        return await this.getByIndex('follows', 'following_id', userId);
    }

    // Migration from localStorage
    async migrateFromLocalStorage() {
        try {
            // Migrate users
            const existingUsers = JSON.parse(localStorage.getItem('nocturna_users') || '[]');
            for (const user of existingUsers) {
                try {
                    await this.add('users', user);
                } catch (error) {
                    // Skip if user already exists
                    if (error.name !== 'ConstraintError') {
                        console.warn('Failed to migrate user:', error);
                    }
                }
            }

            // Migrate uploads (convert localStorage format to new format)
            const existingUploads = JSON.parse(localStorage.getItem('nocturna_uploads') || '[]');
            for (const upload of existingUploads) {
                if (upload.id && !upload.id.toString().startsWith('sample_')) {
                    try {
                        // Create file record with preview data
                        const fileId = 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                        const file = {
                            id: fileId,
                            upload_id: upload.id,
                            file_name: upload.file_name,
                            file_type: upload.file_type,
                            file_size: upload.file_size || 0,
                            file_data: upload.preview || null,
                            created_date: upload.upload_date || new Date().toISOString()
                        };

                        upload.file_id = fileId;
                        
                        await this.add('uploads', upload);
                        await this.add('files', file);
                    } catch (error) {
                        console.warn('Failed to migrate upload:', error);
                    }
                }
            }

            console.log('Migration from localStorage completed');
        } catch (error) {
            console.warn('Migration failed:', error);
        }
    }

    // Export data for backup
    async exportAllData() {
        const data = {
            users: await this.getAll('users'),
            uploads: await this.getAll('uploads'),
            files: await this.getAll('files'),
            comments: await this.getAll('comments'),
            likes: await this.getAll('likes'),
            tips: await this.getAll('tips'),
            follows: await this.getAll('follows'),
            exported_date: new Date().toISOString()
        };

        return data;
    }

    // Clear all data
    async clearAllData() {
        const stores = ['users', 'uploads', 'files', 'comments', 'likes', 'tips', 'follows', 'sessions'];
        
        for (const storeName of stores) {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            await new Promise((resolve, reject) => {
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
    }
}

// Global database instance
const nocturnaDB = new NocturnaDB();

// Initialize database on load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await nocturnaDB.init();
        
        // Migrate existing localStorage data if needed
        const hasExistingData = localStorage.getItem('nocturna_users') || localStorage.getItem('nocturna_uploads');
        if (hasExistingData) {
            await nocturnaDB.migrateFromLocalStorage();
        }
        
        console.log('Nocturna Database initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database:', error);
    }
});