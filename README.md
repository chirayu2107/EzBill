# EzBill – Invoice Management System

**EzBill** is a modern, responsive invoice management platform built using React, TypeScript, and TailwindCSS. It helps creators and freelancers manage clients, services, and invoices—all in one intuitive interface.

---

## 🚀 Features

- 🔐 Firebase Authentication
- 📊 Dashboard with Charts
- 👥 Brand / Customer Management
- 🎥 Inventory Management
- 🧾 Invoice Generation
- 📄 PDF Export (via `jspdf` and `html2canvas`)
- 📧 Email-ready Invoice PDFs
- 🎨 Smooth Animations (via Framer Motion)

---

## 🛠 Tech Stack

- **React + TypeScript**
- **TailwindCSS**
- **Vite** (for blazing-fast builds)
- **Firebase** (Auth & Realtime DB)
- **Recharts** (for analytics)
- **jsPDF & html2canvas** (for PDF export)

---

## ⚙️ Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd EzBill
```

### 2. Install Dependencies
```bash
npm install
```


### 3. Configure Firebase 

Create a .env file in the root and add your Firebase config:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

⚠️ Replace the placeholder values with your actual Firebase config from your Firebase console.

### 4. Run the development server
```bash
npm run dev
```

### 5. Build for production
```bash
npm run build
```

### Project Structure

EzBill/
├── public/
├── src/
│   ├── components/      # Reusable components (forms, UI blocks)
│   ├── context/         # App-wide state management
│   ├── pages/           # Page views like Dashboard, Customers, Invoices
│   ├── services/        # Firebase logic and utilities
│   ├── styles/          # Tailwind and theme customizations
│   ├── App.tsx          # Main App component
│   └── main.tsx         # Entry point
├── index.html
├── tailwind.config.js
├── vite.config.ts
└── package.json


### Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start development server |
| `npm run build`   | Build for production     |
| `npm run lint`    | Run ESLint checks        |
| `npm run preview` | Preview production build |


### License
This project is licensed under the MIT License — feel free to use, modify, and distribute.

### Credits
Made with ❤️ using Firebase, Tailwind, React, and lots of ☕