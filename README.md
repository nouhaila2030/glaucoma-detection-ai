<div align="center">

<img src="https://img.shields.io/badge/Python-3.9-3776AB?style=for-the-badge&logo=python&logoColor=white" />
<img src="https://img.shields.io/badge/FastAPI-0.128-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
<img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
<img src="https://img.shields.io/badge/PyTorch-MobileNetV3-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white" />
<img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" />

# GlaucomaAI

**AI-powered glaucoma screening platform for ophthalmology professionals.**

Analyze fundus images in seconds · Grad-CAM explainability · Clinical PDF reports · Multilingual

[Getting Started](#-quick-start-docker) · [Architecture](#-architecture) · [API Reference](#-api-reference) · [Configuration](#-configuration)

</div>

---

## Overview

GlaucomaAI is a clinical decision-support platform that detects glaucoma from retinal fundus images using a fine-tuned **MobileNetV3** model augmented with a custom **Spatial Soft-Attention** module.  
It is built for ophthalmologists and medical teams who need fast, explainable AI-assisted screening integrated into their daily workflow.

> ⚠️ **Medical disclaimer** — GlaucomaAI is a decision-support tool only. Results must be interpreted by a qualified ophthalmologist and do not constitute a clinical diagnosis.

---

## Features

| Feature | Details |
|---|---|
| 🔬 **AI Analysis** | MobileNetV3 + Spatial Soft-Attention, binary classification (glaucoma / healthy) |
| 🗺️ **Explainability** | GradCAM & GradCAM++ heatmaps generated per inference |
| 👁️ **3D Visualization** | Simulated retinal topography rendered with Three.js |
| 📄 **PDF Reports** | Customizable clinical reports generated client-side (jsPDF) |
| 🧑‍⚕️ **Patient Management** | Create patient records, attach multiple analyses per patient |
| 📂 **DICOM Support** | Native `.dcm` file upload — automatically converted to PNG |
| 🤖 **AI Chatbot** | GPT-4o clinical assistant for report drafting and differential diagnosis |
| 🌍 **Multilingual** | Full UI in French 🇫🇷, English 🇬🇧, Spanish 🇪🇸, Arabic 🇸🇦 (RTL) |
| 🔐 **Auth** | JWT-based authentication, bcrypt password hashing |
| 🐳 **Docker** | One-command deployment with Docker Compose |

---

## Architecture

The platform is a **microservices** system composed of three independent services:

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                          │
│                    React + Vite  (port 3000)                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP
┌──────────────────────────▼──────────────────────────────────────┐
│              ORCHESTRATOR  —  FastAPI  (port 8000)              │
│   Auth · Patient CRUD · File Upload · History · GPT-4o Chat     │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP (internal Docker network)
┌──────────────────────────▼──────────────────────────────────────┐
│              DL SERVICE  —  FastAPI  (port 8001)                │
│       MobileNetV3 · Spatial Attention · GradCAM / GradCAM++     │
└─────────────────────────────────────────────────────────────────┘
```

### Model Architecture

```
Input (224×224 RGB)
  └─► MobileNetV3-Large (pretrained ImageNet, last 5 blocks unfrozen)
        └─► SpatialSoftAttention (MaxPool + AvgPool + Conv1×1 + Sigmoid)
              └─► AdaptiveAvgPool2d(1,1)
                    └─► Flatten → Linear(960,1024) → ReLU → Dropout(0.6)
                          └─► Linear(1024,512) → ReLU → Dropout(0.4)
                                └─► Linear(512,2) → Softmax
                                      └─► {0: Healthy, 1: Glaucoma}
```

---

## Project Structure

```
glaucoma_detection/
├── docker-compose.yml
│
├── backend/
│   ├── DL_API/                  # Deep Learning service (port 8001)
│   │   ├── main.py              # /analyze/  /heatmap/  endpoints
│   │   ├── model_utils.py       # MobileNetV3 + Attention + GradCAM classes
│   │   ├── image_utils.py       # CLAHE preprocessing, tensor pipeline, heatmap export
│   │   ├── best_model.pth       # ⚠️  Model weights (not committed — see below)
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   └── uploads/                 # Orchestrator service (port 8000)
│       ├── main.py              # Auth, patients, upload, history, chat routes
│       ├── cleanup.py           # TTL-based image cleanup loop
│       ├── .env                 # ⚠️  Secrets (not committed)
│       ├── .env.example         # Template — copy to .env and fill in
│       ├── Dockerfile
│       └── requirements.txt
│
└── frontend/                    # React SPA (port 3000 / 5173 dev)
    ├── src/
    │   ├── components/
    │   │   ├── Home.jsx         # Landing page
    │   │   ├── Dashboard.jsx    # KPIs + patient list
    │   │   ├── ImageUploader.jsx# Analysis workflow + results
    │   │   ├── History.jsx      # Medical records
    │   │   ├── ReportEditor.jsx # PDF report editor
    │   │   ├── DoctorChat.jsx   # Per-analysis AI assistant
    │   │   └── ChatBot.jsx      # App-wide guide chatbot
    │   ├── locales/             # i18n: fr / en / es / ar
    │   └── utils/
    │       ├── api.js           # Axios instance
    │       └── pdfGenerator.jsx # jsPDF report builder
    ├── Dockerfile
    └── nginx.conf
```

---

## Quick Start (Docker)

> **Prerequisites:** Docker ≥ 24, Docker Compose ≥ 2.20

### 1. Clone the repository

```bash
git clone https://github.com/sayouba2/glaucoma_detection.git
cd glaucoma_detection
```

### 2. Add the model weights

Place your `best_model.pth` file in `backend/DL_API/`:

```bash
cp /path/to/your/best_model.pth backend/DL_API/best_model.pth
```

### 3. Configure environment variables

```bash
cp backend/uploads/.env.example backend/uploads/.env
```

Then edit `backend/uploads/.env`:

```env
JWT_SECRET=your_strong_random_secret_here
OPENAI_API_KEY=sk-...your_openai_key_here...
```

### 4. Start all services

```bash
docker compose up --build -d
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Orchestrator API | http://localhost:8000 |
| DL API | http://localhost:8001 |

### 5. Stop

```bash
docker compose down
```

---

## Manual Setup (Development)

Open **3 terminals** and run each service independently.

### Terminal 1 — DL Service

```bash
cd backend/DL_API
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

Wait for: `Application startup complete.`

### Terminal 2 — Orchestrator

```bash
cd backend/uploads
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Terminal 3 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

## Configuration

All runtime secrets for the orchestrator service are loaded from `backend/uploads/.env`.

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | ✅ | — | OpenAI API key for the clinical chatbot (GPT-4o) |
| `JWT_SECRET` | ✅ | — | Secret key used to sign JWT tokens |
| `DL_SERVICE_URL` | ❌ | `http://localhost:8001/analyze/` | DL service endpoint (overridden by Docker Compose to use service name) |
| `CORS_ORIGINS` | ❌ | `http://localhost:5173,http://localhost:3000` | Comma-separated list of allowed frontend origins |

> In Docker, `DL_SERVICE_URL` and `CORS_ORIGINS` are automatically overridden by `docker-compose.yml` — do not change them in `.env` for containerized deployments.

---

## API Reference

### DL Service — port 8001

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/analyze/` | Analyze a fundus image. Returns prediction class, probability and GradCAM image (base64). |
| `POST` | `/heatmap/` | Generate a GradCAM / GradCAM++ overlay and return it as a PNG file. |

**`POST /analyze/` — Request**
```
Content-Type: multipart/form-data
Body: file=<image file>
```

**`POST /analyze/` — Response**
```json
{
  "prediction_class": 1,
  "prediction_label": "Glaucoma Detected",
  "probability": 0.9423,
  "gradcam_image": "data:image/png;base64,..."
}
```

---

### Orchestrator — port 8000

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/signup` | ❌ | Create a new user account |
| `POST` | `/token` | ❌ | Login — returns JWT access token |
| `GET`  | `/patients` | ✅ | List the current doctor's patients |
| `POST` | `/patients` | ✅ | Create a new patient record |
| `GET`  | `/patients/{id}` | ✅ | Patient detail with full analysis history |
| `POST` | `/uploadfile/` | ✅ | Upload a fundus image, trigger AI analysis, persist results |
| `GET`  | `/history` | ✅ | All analyses for the authenticated user |
| `GET`  | `/dashboard/stats` | ✅ | KPI stats (total patients, analyses, glaucoma count) |
| `POST` | `/chat` | ❌ | Clinical AI assistant (streaming, GPT-4o) |
| `POST` | `/chat/guide` | ❌ | App guide chatbot (streaming, GPT-4o) |

**Authentication** — Bearer token in header:
```
Authorization: Bearer <access_token>
```

**Language** — Pass `Accept-Language` header to get localized messages:
```
Accept-Language: fr   # or en, es, ar
```

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Web framework | FastAPI |
| Deep learning | PyTorch, TorchVision |
| Model | MobileNetV3-Large (fine-tuned) + custom SpatialSoftAttention |
| Explainability | GradCAM, GradCAM++ (implemented from scratch) |
| Image preprocessing | OpenCV (CLAHE), Pillow |
| Authentication | JWT (`python-jose`), bcrypt (`passlib`) |
| Database | SQLite via SQLAlchemy |
| AI Chatbot | OpenAI GPT-4o (streaming) |
| Medical imaging | pydicom (DICOM → PNG) |
| Async HTTP | httpx |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 19 + Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router v6 |
| Internationalization | i18next (FR / EN / ES / AR + RTL) |
| 3D rendering | Three.js, @react-three/fiber |
| Charts | Recharts |
| PDF generation | jsPDF (client-side) |
| HTTP client | Axios |

---

## Troubleshooting

### `uploads-1` container crashes on startup

**Symptom:** `RuntimeError: OPENAI_API_KEY is missing`  
**Fix:** Ensure `backend/uploads/.env` exists and contains a valid `OPENAI_API_KEY`. The `.env.example` file shows the required format.

### `unable to open database file`

**Symptom:** SQLAlchemy `OperationalError` at startup  
**Fix:** Docker may have created a directory instead of a file for `auth.db`. Remove it and restart:
```bash
rm -rf backend/uploads/auth.db
docker compose up -d uploads
```

### DL service returns 503

**Symptom:** `{"detail": "Le modèle n'est pas chargé."}`  
**Fix:** Verify `best_model.pth` is present in `backend/DL_API/` and readable. Check the DL service logs:
```bash
docker compose logs dl_api
```

### CORS errors in the browser

**Fix:** Add your frontend origin to `CORS_ORIGINS` in `backend/uploads/.env`:
```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://your-domain.com
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "feat: add my feature"`
4. Push and open a pull request

Please ensure new backend code is covered by tests and new API endpoints are documented.

---

## License

This project is released for academic and research purposes. For commercial deployment in a clinical environment, please ensure compliance with applicable medical device regulations (MDR, FDA 510k, etc.) and validate model performance on your target population.

---

<div align="center">
  Built with ❤️ for ophthalmology professionals — <a href="https://github.com/sayouba2/glaucoma_detection">github.com/sayouba2/glaucoma_detection</a>
</div>
