# Cyber Vault — Universal Multi-Format Malware Intelligence & Zero-Trust Defense Ecosystem

An enterprise-grade cyber defense and forensic intelligence system featuring dual-client access (Web Application + Chrome/Edge Browser Extension), unified under a single FastAPI backend and multi-format machine learning pipeline.

---

## Project Structure

```
df/
├── index.html                  # Cyber Vault Cinematic Research Portal (Vite)
├── app.js                      # Main frontend controller & 3D threat visualizer
├── style.css                   # Enterprise cyber-aesthetic styling
├── vite.config.js              # Vite bundler & reverse proxy configuration
├── package.json                # Frontend dependencies and scripts
│
├── backend/                    # FastAPI Native Enclave Backend
│   ├── main.py                 # Core API gateway (/api/malware/analyze, /api/extension/scan-url)
│   ├── auth_routes.py          # Zero-trust auth with PBKDF2 & session tokens
│   ├── services/               # Feature extractors & background services
│   ├── models/                 # SQLite storage & database schemas
│   └── requirements.txt        # Python backend dependencies
│
├── malware_ml/                 # Universal Multi-Format Machine Learning Pipeline
│   ├── models/                 # Trained deep learning & ensemble models
│   ├── feature_extractors/     # Memory, PCAP, PE, and Universal format parsers
│   ├── prediction_router.py    # Dynamic model routing engine
│   └── model_registry.py       # Modal registry and metadata tracking
│
├── browser-extension/          # Cyber Vault AI Threat Defense & URL Sentinel
│   ├── manifest.json           # Manifest V3 configuration (Chrome, Edge, Brave)
│   ├── popup.html & popup.css  # Futuristic Sentinel popup interface
│   ├── popup.js                # Extension controller & REST client
│   ├── background.js           # Background service worker (badge & notifications)
│   ├── content.js & content.css# Malicious site warning HUD overlay
│   ├── options.html            # Extension options & gateway manager
│   └── icons/                  # High-resolution Cyber Vault shield icons
│
├── .env                        # Active environment configuration
├── .env.example                # Environment template
├── .gitignore                  # Git ignore rules
└── README.md                   # Project documentation
```

---

## System Architecture

```
                       ┌───────────────────────────────────────────────┐
                       │               Cyber Vault Ecosystem          │
                       └───────────────────────────────────────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
         ┌───────────────────────────┐                 ┌───────────────────────────┐
         │  Cyber Vault Web Portal   │                 │   Cyber Vault Browser     │
         │  (Vite + 3D Globe + Lab)  │                 │   Extension (MV3)         │
         │  http://localhost:5173    │                 │   df/browser-extension    │
         └─────────────┬─────────────┘                 └─────────────┬─────────────┘
                       │                                             │
                       │   HTTP REST API                             │   HTTP REST API
                       └───────────────────────┬─────────────────────┘
                                               ▼
                              ┌─────────────────────────────────┐
                              │   Existing FastAPI Backend      │
                              │   http://127.0.0.1:8000         │
                              │   - /api/extension/scan-url     │
                              │   - /api/malware/analyze        │
                              │   - /api/health                 │
                              └────────────────┬────────────────┘
                                               ▼
                              ┌─────────────────────────────────┐
                              │   Existing ML & Routing Engine  │
                              │   (CIC-MalMem-2022 / Universal) │
                              └─────────────────────────────────┘
```

---

## Getting Started

### 1. Start the FastAPI Backend & ML Engine

```bash
# From the df/ project root:
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

- API Documentation (Swagger): `http://127.0.0.1:8000/docs`
- Health Endpoint: `http://127.0.0.1:8000/api/health`

### 2. Start the Cyber Vault Web Portal (Vite)

```bash
# In a new terminal from df/:
npm run dev
```

- Access the main cinematic web application at `http://localhost:5173`.

### 3. Load the Cyber Vault Browser Extension

1. Open your Chromium browser (**Chrome**, **Edge**, or **Brave**).
2. Navigate to `chrome://extensions/` or `edge://extensions/`.
3. Enable **Developer Mode** (toggle in upper-right corner).
4. Click **Load unpacked**.
5. Select the folder: `C:\Users\mohan\OneDrive\Desktop\df\browser-extension`.
6. Pin the Cyber Vault extension to your toolbar and begin live threat inspection!

---

## Key Backend Endpoints

| Endpoint | Method | Client | Description |
|---|---|---|---|
| `/api/health` | GET | Both | Checks Enclave health, auth status, and model registry |
| `/api/extension/scan-url` | POST | Extension | Evaluates URL risk score (0-100), Shannon entropy, DGA, & MITRE ATT&CK |
| `/api/malware/analyze` | POST | Both | Uploads any digital artifact and routes to trained ML models |
| `/api/auth/login` | POST | Web | Zero-trust authentication with PBKDF2 & session tokens |
