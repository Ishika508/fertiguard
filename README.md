# FertiGuard — Smart Fertigation Monitor

A production-ready IoT dashboard for real-time fertigation monitoring and clog mitigation.

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
cd fg-dashboard
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your values (see Configuration section below).

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Configuration

### Firebase Setup
1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. Go to Project Settings → Your Apps → Add Web App
4. Copy the config values into `.env.local`
5. Enable **Realtime Database** in Firebase console
6. Enable **Authentication → Email/Password**

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### Ollama Setup (Local AI Chatbot)
1. Install Ollama: [https://ollama.ai](https://ollama.ai)
2. Pull a model: `ollama pull llama3`
3. Start Ollama: `ollama serve`
4. Set in `.env.local`:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

> **Note:** The chatbot has a built-in fallback with rule-based responses if Ollama is not running.

### Demo Mode
Set `NEXT_PUBLIC_DEMO_MODE=true` to use mock data without Firebase.

---

## 📁 Project Structure

```
fertiguard/
├── app/
│   ├── api/
│   │   └── chat/route.ts         # Ollama API endpoint
│   ├── dashboard/page.tsx         # Main dashboard
│   ├── ml-analysis/page.tsx       # ML analysis & charts
│   ├── login/page.tsx             # Login page
│   ├── signup/page.tsx            # Signup page
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Root redirect
│   └── globals.css                # Global styles
├── components/
│   ├── dashboard/
│   │   ├── DeviceHeader.tsx        # Device status header
│   │   ├── SensorCards.tsx         # Animated sensor cards
│   │   ├── BranchVisualization.tsx # Pipe flow visualization
│   │   ├── SystemStatusPanel.tsx   # Clog/leak/fault status
│   │   └── ActuatorControl.tsx     # Control buttons
│   ├── chatbot/
│   │   └── Chatbot.tsx             # Floating AI chatbot
│   ├── auth-provider.tsx           # Auth context
│   ├── theme-provider.tsx          # Dark/light theme
│   └── navbar.tsx                  # Navigation
├── hooks/
│   └── useDeviceData.ts            # Real-time data hook
├── lib/
│   ├── firebase.ts                 # Firebase config
│   ├── i18n.ts                     # Translations (EN/HI/MR)
│   ├── mockData.ts                 # Mock data & ML logic
│   └── utils.ts                    # Utility functions
├── .env.example                    # Environment template
├── tailwind.config.js
├── next.config.js
└── package.json
```

---

## 🌐 Features

| Feature | Status |
|---|---|
| Real-time sensor dashboard | ✅ |
| Animated sensor cards | ✅ |
| Branch pipe visualization | ✅ |
| Clog & leak detection | ✅ |
| Actuator control panel | ✅ |
| ML analysis with charts | ✅ |
| AI chatbot (Ollama) | ✅ |
| Multilingual (EN/HI/MR) | ✅ |
| Dark / Light mode | ✅ |
| Firebase auth ready | ✅ |
| Mobile responsive | ✅ |

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI:** Radix UI primitives + custom components
- **Charts:** Recharts
- **AI:** Ollama (llama3) with fallback
- **Database:** Firebase Realtime Database
- **Auth:** Firebase Authentication
- **Icons:** Lucide React
- **Notifications:** Sonner

---

## 📱 Pages

| Route | Description |
|---|---|
| `/` | Redirects to login or dashboard |
| `/login` | Sign in page |
| `/signup` | Create account |
| `/dashboard` | Main monitoring dashboard |
| `/ml-analysis` | Predictive ML analytics |

---

## 🔧 Production Build

```bash
npm run build
npm start
```

---

## 🌱 Sensor Value Reference

| Sensor | Normal | Warning | Critical |
|---|---|---|---|
| pH | 6.0 – 7.5 | 5.5 – 6.0 or 7.5 – 8.0 | < 5.5 or > 8.0 |
| Turbidity | < 1.5 NTU | 1.5 – 3.0 NTU | > 3.0 NTU |
| Start Flow | > 40 L/h | 25 – 40 L/h | < 25 L/h |
| End Flow | > 35 L/h | 20 – 35 L/h | < 20 L/h |
| Flow Diff | < 15% | 15 – 30% | > 30% |
