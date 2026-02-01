# WoW-CSG Stepathon Challenge Website

A modern, interactive website for CSG employee stepathon challenges with leaderboards, progress tracking, and activity logging. Powered by CSG International.

## Features

- 👤 Employee registration and login
- 📊 Real-time step tracking
- 📷 **NEW: Screenshot OCR** - Upload screenshots from fitness apps to automatically extract step counts
- 🏆 Dynamic leaderboard (Total, Today, Average)
- 🔥 Streak tracking
- 📈 Progress visualization
- 📝 Activity history
- 💾 Local storage persistence
- 📱 Responsive design

### Screenshot OCR Feature

The website now supports automatic step extraction from screenshots! Simply:
1. Take a screenshot of your fitness app (Fitbit, Apple Health, Google Fit, Samsung Health, etc.)
2. Upload the screenshot using the "From Screenshot" tab
3. The system will automatically detect and extract your step count
4. Review and confirm the detected steps, or edit if needed

## How to Use

### Option 1: Local File (Quick Start)

1. Download all files to a folder
2. Open `index.html` in a web browser
3. Start using the application!

### Option 2: Deploy to Web Hosting

#### Using GitHub Pages (Free)

1. Create a GitHub repository
2. Upload all files to the repository
3. Go to Settings → Pages
4. Select source branch (usually `main`)
5. Your site will be available at: `https://yourusername.github.io/repository-name/`

#### Using Netlify (Free)

1. Go to [netlify.com](https://www.netlify.com)
2. Drag and drop the folder containing all files
3. Get instant live URL

#### Using Vercel (Free)

1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to project folder
3. Run: `vercel`
4. Follow prompts to deploy

#### Using Any Web Server

1. Upload all files to your web server
2. Access via: `http://yourdomain.com/stepathon/`

## Firebase Setup (Cross-Device Login)

To allow users to register on one device and login on another, enable Firebase:

1. Create a Firebase project: https://console.firebase.google.com/
2. Enable **Authentication → Email/Password**
3. Create **Cloud Firestore** in production or test mode
4. Update `firebase-config.js` with your project values
5. Deploy the site on a single URL (same origin for all users)

### One-Click Migration (Local → Firebase)
1. Open `admin.html`
2. Login as admin
3. Go to **User Management** and click **Migrate Local Users**
4. Users will receive a password reset email to set a new password
5. Step entries and activity history are migrated to Firestore

### Suggested Firestore Rules (basic)
This app looks up users by username/employee ID before login, so it needs read access.
Start with this and tighten later as needed:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /participants/{userId} {
      allow read: if true;
      allow create: if true;
      allow update, delete: if request.auth != null && request.auth.uid == userId;
    }
    match /stepEntries/{entryId} {
      allow read: if true;
      allow create: if true;
      allow update, delete: if true;
    }
  }
}
```

## File Structure

```
stepathon/
├── index.html      # Main HTML structure
├── styles.css      # Styling and layout
├── script.js       # Application logic
├── firebase-config.js # Firebase settings (optional)
└── README.md       # This file
```

## Customization

### Change Challenge Duration
Edit the dates in `script.js` in the `updateDates()` function.

### Change Daily Goal
Update the `goal` variable in `script.js` (currently 10,000 steps).

### Change Colors
Modify the gradient colors in `styles.css`:
- CSG Primary gradient: `#0066CC` to `#003d7a` (CSG Blue theme)
- Search for `linear-gradient` to find all color references

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## Data Storage

All data is stored locally in the browser using LocalStorage. No server or database required!

## Notes

- Data persists in browser local storage
- Each user's data is stored separately
- Leaderboard updates in real-time
- No backend required - fully client-side

## Support

For issues or questions, contact your IT department or challenge organizer.

---

**Enjoy the challenge! 🏃‍♂️💪**

