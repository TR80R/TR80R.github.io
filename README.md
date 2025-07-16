# Nocturna Web Application

A comprehensive NSFW creator platform with three distinct portals: creator dashboard, admin management, and customer content discovery.

## Features

### Creator Portal
- User registration and authentication
- File upload system (images and videos)
- Content management with captions and tags
- AI training simulation
- Upload statistics and analytics

### Admin Portal
- Protected access with credentials
- Creator and upload management
- Search and filtering capabilities
- Data export functionality
- Platform analytics

### Customer Portal
- TikTok-style content discovery
- Interactive features (likes, comments, tips)
- Virtual currency system (gems)
- Keyboard and touch navigation
- Mobile-responsive design

## Quick Start

1. **Extract the zip file** to your desired location
2. **Open any HTML file** in a web browser to start using the application
3. **Start with `index.html`** for the main landing page

## Latest Updates (v2.0 - Database Edition)

✓ **IndexedDB Integration** - Complete local database system for better data management
✓ **File Storage** - Actual file data stored in database (not just metadata)
✓ **Relational Data** - Proper relationships between users, uploads, comments, likes, and tips
✓ **Real-time Interactions** - Live likes, comments, tips, and follows with database persistence
✓ **Data Migration** - Automatic migration from localStorage to IndexedDB
✓ **Enhanced Performance** - Better data querying and management capabilities

## Login Credentials

### Creator Accounts
- Create new accounts through the signup page
- Access dashboard after registration

### Admin Portal
- Username: `admin`
- Password: `nocturna2025`

### Customer Portal
- Username: `customer1` / Password: `pass123`
- Username: `premium_user` / Password: `nocturna123`
- Both accounts have 1000 gems for testing

## File Structure

```
nocturna-complete/
├── index.html          # Landing page
├── login.html          # Authentication page
├── signup.html         # Registration page
├── dashboard.html      # Creator portal
├── admin.html          # Admin management
├── customer.html       # Customer discovery
├── assets/
│   └── logo.svg        # Nocturna logo
├── scripts/
│   ├── app.js          # Main application logic
│   ├── admin.js        # Admin portal functionality
│   └── customer.js     # Customer portal features
└── styles/
    ├── style.css       # Compiled CSS styles
    └── style.scss      # Source SASS styles
```

## How It Works

### Data Storage
- **IndexedDB**: Advanced browser database for structured data storage
- **File Storage**: Complete file data stored in database (images/videos as base64)
- **Relational Structure**: Proper relationships between users, uploads, comments, likes, tips
- **No Backend Required**: Fully client-side with sophisticated data management
- **Migration Support**: Automatic migration from localStorage to IndexedDB

### Content Flow
1. Creators upload content through dashboard
2. Content and file data stored in IndexedDB
3. Customer portal loads all content for discovery
4. Interactions (likes, comments, tips) tracked and stored with full relationships

### Navigation
- Direct links between all portals
- Session-based authentication
- Responsive design for mobile and desktop

## Technical Details

### Built With
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Database**: IndexedDB with custom JavaScript ORM
- **Styling**: SASS with custom CSS properties
- **Storage**: IndexedDB for persistent data, sessionStorage for sessions
- **Design**: Dark theme with Nocturna brand colors

### Database Schema
- **users**: User accounts and profiles
- **uploads**: Content metadata and information
- **files**: Actual file data (base64 encoded)
- **comments**: User comments on uploads
- **likes**: Like relationships between users and content
- **tips**: Virtual currency transactions
- **follows**: User following relationships

### Browser Compatibility
- Modern browsers with localStorage support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers with touch support

### Responsive Design
- Mobile-first approach
- Touch gestures for customer portal
- Optimized layouts for all screen sizes

## Development

### SASS Compilation
If you need to modify styles:
1. Install SASS: `npm install -g sass`
2. Compile: `sass styles/style.scss styles/style.css`

### Local Testing
- Simply open HTML files in browser
- No build process required
- All dependencies included

## Deployment

### Static Hosting
- Upload all files to any static hosting service
- Works with GitHub Pages, Netlify, Vercel, etc.
- No server-side configuration needed

### Production Considerations
- Currently uses IndexedDB (client-side database)
- For production, consider migrating to server-side database
- Add server-side authentication for security
- Implement cloud storage for file uploads
- Current system supports full offline functionality

## Support

This is a standalone application designed for demonstration purposes. All features work locally using browser storage.

For the complete experience:
1. Create creator accounts and upload content
2. View content in customer portal
3. Use admin portal to manage platform data
4. Test all interactive features with provided test accounts

---

**Nocturna** - Sophisticated creator platform for immersive content experiences.