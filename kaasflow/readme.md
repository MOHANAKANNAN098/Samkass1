# KaasFlow – Loan & EMI Management

## What is KaasFlow?

KaasFlow is a mobile-first web application for small-scale financiers and money lenders to manage clients, loans, EMI collections, and payment reminders — all from a browser with no installations beyond Python. It runs fully offline for business data and uses a lightweight Python Flask backend only for user authentication.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES6+) |
| UI Framework | Bootstrap 5 (CDN) |
| Icons | Font Awesome 6 (CDN) |
| Fonts | Google Fonts — Baloo 2 (English), Noto Sans Tamil |
| Charts | Chart.js (CDN) |
| PDF Export | jsPDF (CDN) |
| Excel Export | SheetJS / xlsx (CDN) |
| Backend | Python 3 + Flask |
| Database | SQLite (auto-created, users only) |
| Business Data | Browser localStorage |

> **No Node.js required.** All frontend libraries load from CDN.

---

## Prerequisites

- **Python 3.8+** installed ([python.org](https://www.python.org/downloads/))
- **VS Code** (recommended) with the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) (optional)
- **No Node.js**, no npm, no build step needed

---

## Quick Start (3 Steps)

### Step 1 — Install Python dependencies

```bash
cd kaasflow/backend
pip install flask flask-cors pyjwt
```

> Or use the included requirements file:
> ```bash
> pip install -r requirements.txt
> ```

### Step 2 — Start the backend server

```bash
python app.py
```

Flask will start on **http://localhost:5000**

You should see:
```
 * Running on http://127.0.0.1:5000
 * Press CTRL+C to quit
```

### Step 3 — Open the frontend

**Option A — Direct browser open:**
Double-click `kaasflow/frontend/index.html` or open it in any browser.

**Option B — VS Code Live Server (recommended):**
1. Open the `kaasflow/` folder in VS Code
2. Right-click `frontend/index.html` in the Explorer
3. Click **"Open with Live Server"**
4. App opens at `http://127.0.0.1:5500`

---

## Folder Structure

```
kaasflow/
├── frontend/
│   ├── index.html          # Main app (single-page, all views)
│   └── style.css           # All custom styles (amber/gold dark theme)
│
├── backend/
│   ├── app.py              # Flask app entry point
│   ├── requirements.txt    # Python dependencies
│   ├── routes/
│   │   ├── __init__.py
│   │   └── auth.py         # Login, signup, JWT endpoints
│   └── models/             # Database models
│
└── README.md               # This file
```

---

## Features

### 📊 Dashboard
- Total clients, total loan amount, amount collected, pending amount
- Today's due payments at a glance
- Monthly collection bar chart (Chart.js)
- Recent payment activity feed

### 👥 Client Management
- Add, edit, and delete clients (name, phone, address, ID, occupation)
- Search clients by name or phone number
- Client profile with full loan history
- Export client list to Excel/CSV

### 💰 Loan Management
- Create loans with principal, interest rate, duration, and loan type
- Automatic EMI calculation (flat/reducing interest)
- Loan summary: total payable, total interest, next due date
- Progress bar showing repayment status
- Overdue badge for past-due loans
- Multiple active loans per client

### 📅 EMI & Payment Tracking
- Daily, weekly, and monthly EMI schedules
- Record payments and mark EMIs as paid or missed
- Full payment history with timestamps
- Automatic next-due-date calculation
- Overdue items highlighted in red

### 📋 Daily Collection Mode
- Dedicated tab listing all clients with EMIs due today
- One-tap Collect / Mark Missed buttons
- Filter by overdue, due today, upcoming

### 🔔 Reminders
- Auto-generated reminder messages in English and Tamil
  - Example: *"Dear Ravi, your EMI ₹2,500 is due today."*
- WhatsApp share button — opens pre-filled message in WhatsApp
- Daily browser notification at 12:00 AM listing all collections due
- Individual reminder notifications at each EMI's due time

### 📄 Digital Receipts (PDF)
- Generate a payment receipt PDF on every recorded payment
- WhatsApp share button on receipt

### 📈 Reports
- Monthly collection summary chart
- Client-wise loan summary
- Total interest earned
- Recovery rate and top defaulters
- Export reports to Excel/CSV

### ⚙️ Settings
- Business name and phone configuration
- Dark / Light mode toggle (amber-gold dark theme)
- English / Tamil language toggle (full translation coverage)
- Export all data as JSON backup
- Import data from JSON backup
- Clear all data option

### 🔐 Authentication
- Phone number + password signup/login
- JWT-based sessions
- Offline mode: app works without backend running (localStorage only)

### 💳 Subscription Plans
- **Free Plan:** Up to 20 clients, all core features
- **Monthly Plan:** ₹270/month — unlimited clients
- **Quarterly Plan:** ₹850/3 months — unlimited clients
- **Yearly Plan:** ₹1,999/year — best value, save ₹1,241

---

## Local Development

| Setting | Value |
|---------|-------|
| Backend URL | `http://localhost:5000` |
| API base path | `http://localhost:5000/api` |
| Frontend (Live Server) | `http://127.0.0.1:5500` |
| Business data storage | Browser `localStorage` |
| User accounts database | `backend/users.db` (auto-created on first run) |

**Note:** The frontend works independently even if Flask is not running — all business data (clients, loans, payments) lives in `localStorage`. Flask is only needed for login/signup.

---

## Default Sample Data

On first login, the app automatically generates realistic sample data:

- **5 Tamil Nadu financier clients** — Murugan, Selvam, Lakshmi, Ravi, Priya — with addresses in Chennai, Madurai, Coimbatore, Salem, and Trichy
- **Active loans** with varying principal amounts (₹10,000–₹1,00,000), interest rates, and repayment schedules
- **Payment history** spanning the last 3 months
- **Overdue EMIs** to demonstrate the collection and reminder workflows

This lets you explore every feature immediately without entering data manually.

---

## Deployment Notes

### Frontend (Static Hosting)

Upload the `kaasflow/frontend/` folder to any static host:

- **Netlify:** Drag and drop the `frontend/` folder at [app.netlify.com](https://app.netlify.com)
- **GitHub Pages:** Push to a repo, enable Pages from `main` branch
- **Any static host:** It's just HTML, CSS, and JS — no build needed

### Backend (Python Hosting)

Deploy to **Render**, **Railway**, or any Python-capable host:

```bash
# Set these environment variables on your host:
FLASK_ENV=production
JWT_SECRET=your-very-strong-random-secret-here
```

### Connect Frontend to Deployed Backend

In `kaasflow/frontend/index.html` (or `app.js`), update the API base URL:

```javascript
// Change this line:
const API_BASE = 'http://localhost:5000/api';

// To your deployed backend URL:
const API_BASE = 'https://your-app.onrender.com/api';
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend not connecting | Make sure `python app.py` is running inside the `backend/` folder |
| `ModuleNotFoundError: flask` | Run `pip install flask flask-cors pyjwt` in the `backend/` folder |
| Login fails / auth error | Check that Flask is running on port 5000 and CORS is allowed |
| Chart not showing | Allow JavaScript in browser; disable ad blockers for localhost |
| App works offline | ✅ Expected — the app uses offline mode when Flask isn't running; all business data still works |
| `users.db` not created | Run `python app.py` at least once from the `backend/` folder |
| Port 5000 already in use | Change `port=5000` to `port=5001` in `backend/app.py` and update `API_BASE` in the frontend |
| Tamil text not rendering | Ensure internet connection (Google Fonts loads Noto Sans Tamil from CDN) |

---

## Language Support

KaasFlow supports **English** and **Tamil** (தமிழ்). Toggle the language in Settings.

- **English:** Baloo 2 (Google Fonts)
- **Tamil (தமிழ்):** Noto Sans Tamil (Google Fonts)

All UI labels, button text, reminder messages, and notifications are fully translated in both languages.

---

## License

MIT License — free to use, modify, and deploy.

---

*Built for Tamil Nadu's small-scale financiers. Designed for mobile, works everywhere.*
