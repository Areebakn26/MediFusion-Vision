# MediFusion Vision

> 🚀 **Live Demo:** [medifusion-vision-demo.vercel.app](https://medifusion-vision-demo.vercel.app/)

AI-powered medical diagnostic platform for retinal eye disease detection and brain MRI analysis (tumor & Alzheimer's). Features a web frontend for patients/doctors/admins, a mobile app, and real-time AI inference via Flask microservices.

## Architecture

```
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  React Web   │    │  Flutter Mobile  │    │  Postman / API   │
│  localhost:5173 │   │  Android/iOS     │    │  Consumers       │
└──────┬───────┘    └────────┬─────────┘    └────────┬─────────┘
       │                     │                       │
       └──────────┬──────────┴───────────┬───────────┘
                  │                      │
         ┌────────▼────────┐   ┌─────────▼──────────┐
         │  Node.js API    │   │  Socket.IO (Chat    │
         │  Express 5      │   │  & Notifications)   │
         │  Port 5000      │   │  Port 5000          │
         └────┬───────┬────┘   └─────────────────────┘
              │       │
     ┌────────▼─┐  ┌──▼──────────┐
     │ Retinal  │  │  Brain MRI │
     │ FlaskAPI │  │  Flask API │
     │ :5002    │  │  :5003     │
     └──────────┘  └────────────┘
```

## Tech Stack

| Layer | Technology | Port |
|---|---|---|
| Retinal AI | EfficientNetB3 + TensorFlow + GradCAM | 5002 |
| Brain AI | ResNet18 / DenseNet121 + PyTorch + GradCAM | 5003 |
| Backend | Node.js + Express 5 + Sequelize | 5000 |
| Database | PostgreSQL (Neon Cloud) | — |
| Web Frontend | React 19 + Vite 7 + TailwindCSS 4 + Framer Motion | 5173 |
| Mobile | Flutter 3+ (Bloc, GoRouter, Dio) | — |
| PDF | Puppeteer + PDFKit | — |
| Payments | Stripe | — |
| Realtime | Socket.IO | — |
| Auth | JWT + bcryptjs | — |
| AI Notes | Groq SDK (Whisper + Llama) | — |

## AI Models

| Model | Task | Detects |
|---|---|---|
| EfficientNetB3 (TensorFlow) | Retinal Analysis | Cataract, Diabetic Retinopathy, Glaucoma, Normal |
| ResNet18 (PyTorch) | Brain Tumor | Glioma, Meningioma, Pituitary, No Tumor |
| DenseNet121 (PyTorch) | Alzheimer's | Mild/Moderate/Very Mild Demented, Non-Demented |

All models include GradCAM heatmap visualization and confidence scores.

## Features

**Patient**
- Register / login with email verification & password reset
- Book & manage appointments with doctors
- Upload medical scans for AI analysis
- View scan results with GradCAM overlays
- Video consultation (Jitsi integration)
- Payment & billing (Stripe)
- Medical records & history

**Doctor**
- Patient management & appointment scheduling
- AI Diagnostics (retinal & brain scan analysis)
- Review AI results, flag incorrect predictions (feedback loop)
- Generate & download PDF reports
- Video consultation room
- Analytics dashboard

**Admin**
- User & doctor management with verification queue
- Scan repository with deduplication
- Feedback dashboard with retraining controls
- AI model management & deployment
- System content management
- Financial support management

**Mobile (Flutter)**
- Patient dashboard & appointment booking
- View medical records & scan results
- Real-time notifications
- Video consultations
- Stripe payments

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- PostgreSQL (or Neon cloud connection)

### 1. Clone

```bash
git clone https://github.com/Areebakn26/MediFusion-Vision.git
cd MediFusion-Vision
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=5000
NODE_ENV=development

DB_NAME=medifusionvision
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

JWT_SECRET=your_jwt_secret

STRIPE_SECRET_KEY=sk_test_your_key

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

GROQ_API_KEY=gsk_your_groq_key

CLIENT_URL=http://localhost:5173
```

```bash
npm run dev
# → http://localhost:5000
```

### 3. Frontend Setup

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
```

```bash
npm run dev
# → http://localhost:5173
```

### 4. Retinal Model API

```bash
cd Retinal_Model
pip install flask tensorflow pillow numpy opencv-python matplotlib flask-cors
python app.py
# → http://localhost:5002
```

### 5. Brain MRI Model API

```bash
cd Brain_Model
pip install flask torch torchvision pillow numpy grad-cam
python app.py
# → http://localhost:5003
```

### 6. Mobile App (Flutter)

```bash
cd mobile_app
flutter pub get
flutter run
```

### Running All Services

```bash
# Terminal 1 — Retinal API
cd Retinal_Model && python app.py

# Terminal 2 — Brain API
cd Brain_Model && python app.py

# Terminal 3 — Backend
cd server && npm run dev

# Terminal 4 — Frontend
cd client && npm run dev
```

Open **http://localhost:5173**

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password` | Reset password |
| GET | `/api/doctors` | List doctors |
| POST | `/api/appointments` | Book appointment |
| POST | `/api/scans/upload` | Upload medical scan |
| POST | `/api/scans/:id/analyze` | Run retinal AI analysis |
| POST | `/api/scans/:id/analyze-brain` | Run brain MRI AI analysis |
| POST | `/api/scans/:id/report/pdf` | Download PDF report |
| POST | `/api/feedback` | Submit AI feedback |
| POST | `/api/payments/create-payment-intent` | Create Stripe payment |

## Project Structure

```
MediFusion-Vision/
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── components/        # UI components (brand, ui)
│   │   ├── layouts/           # Admin, Main layouts
│   │   ├── pages/             # admin/, doctor/, patient/ pages
│   │   ├── context/           # React context providers
│   │   ├── services/          # API service layer
│   │   └── utils/             # Helpers & i18n
│   └── public/images/         # Static assets
├── server/                    # Node.js + Express backend
│   ├── controllers/           # 12 route controllers
│   ├── routes/                # 10 route files
│   ├── models/                # 18 Sequelize models
│   ├── middleware/             # Auth middleware
│   ├── services/              # AI quality, consensus, deploy
│   ├── jobs/                  # Cron jobs (retraining)
│   ├── utils/                 # AI notes, helpers
│   └── migrations/            # Sequelize migrations
├── mobile_app/                # Flutter mobile app
│   └── lib/                   # Dart source
├── Brain_Model/               # PyTorch Flask API
│   └── app.py                 # Tumor + Alzheimer inference
├── Retinal_Model/             # TensorFlow Flask API
│   └── app.py                 # Eye disease inference
├── docs/                      # SRS, SDS, implementation docs
└── mockups/                   # UI mockups
```

## Database Models

18 Sequelize models: User, DoctorProfile, PatientProfile, Scan, Appointment, Report, Payment, Prescription, MedicalHistory, AIFeedback, ModelVersion, RetrainingJob, ChatLog, ConsultationNote, Notification, Feedback, PaymentTransaction, and associations.

## Feedback Loop

The platform includes a built-in feedback loop for continuous AI improvement:

1. **Flag Incorrect** — Doctors flag incorrect AI predictions
2. **Quality Checker** — Scores feedback by confidence delta & consensus
3. **Consensus Engine** — Requires N doctors to agree before validating
4. **Auto-Retrain** — Triggers retraining on 4 conditions (100+ validated, <90% accuracy, 30+ days, 50+ corrections)
5. **Model Versioning** — Track & rollback deployed model versions

## License

MIT
