# LIFE LINK

A React + Vite + Tailwind prototype for an emergency-care companion app: symptom
triage, a hospital directory with booking, a blood donor network, user
profiles, and an admin dashboard.

## Running it in VS Code

1. **Open the folder** `life-link-project` in VS Code.
2. **Install dependencies** (requires [Node.js](https://nodejs.org) 18+):
   ```bash
   npm install
   ```
3. **Start the dev server**:
   ```bash
   npm run dev
   ```
4. Open the URL Vite prints (usually `http://localhost:5173`) in your browser.

To build a production bundle:
```bash
npm run build
npm run preview   # serves the built files locally
```

## Demo accounts

**User login**
- Username: `asha.rao`
- Password: `password123`

Or use "Sign up" to create a new account (username, email, password, address).

**Admin login** (link at the bottom of the login screen)
- Username: `admin`
- Password: `admin@108`

## Project structure

```
life-link-project/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx              # React entry point
    ├── App.jsx               # top-level state + routing between screens
    ├── index.css             # Tailwind directives
    ├── data/
    │   └── constants.js      # mock data: hospitals, donors, users, translations
    ├── utils/
    │   └── helpers.js        # triage logic, style maps, small helpers
    └── components/
        ├── LanguageSelector.jsx
        ├── Sidebar.jsx
        ├── AuthScreen.jsx        # user login / sign up
        ├── AdminLoginScreen.jsx
        ├── TriageScreen.jsx      # symptom check
        ├── HospitalDirectory.jsx # find care + booking modal
        ├── BloodDonorScreen.jsx  # request blood / find donors / register / hospital requests
        ├── ProfileScreen.jsx
        ├── EmergencyModeScreen.jsx
        └── AdminDashboard.jsx
```

## Notes on this prototype

- **No real backend.** Users, donor status, and blood requests all live in
  React state (`src/App.jsx`) and reset on page refresh. Passwords are kept
  in plain memory — this is fine for demoing the UI/UX, but before any real
  use you'd want a real backend with hashed passwords and a database.
- **Mock data** for hospitals, donors, and hospital blood requests lives in
  `src/data/constants.js` — edit it directly to change what shows up.
- **Icons** come from [lucide-react](https://lucide.dev/), installed via npm.
- This app is a demonstration tool and does not dispatch emergency services.
  In a real emergency, always call your local emergency number.
