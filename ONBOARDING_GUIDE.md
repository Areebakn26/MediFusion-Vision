# 🚀 MediFusion Vision - Developer Onboarding Guide

Welcome to the **MediFusion Vision** project! This guide will help you set up the backend and frontend on your local machine exactly as it is configured in the main repository.

---

## 📋 Prerequisites
Ensure you have the following installed:
- **Node.js** (v16 or higher)
- **Git**
*(Note: Local PostgreSQL is no longer required as we are using Neon Cloud Database)*

---

## 🛠️ Setup Instructions

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd medifusionvision
```

### 2. Backend Setup (Server)

Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```

#### Configure Environment Variables
1. Create a `.env` file in the `server/` directory.
2. Ask the project lead (Faizan) for the `.env` file contents, particularly the `DATABASE_URL` and `JWT_SECRET`.
3. Your `.env` should look like this:

**File:** `server/.env`
```env
PORT=5000
NODE_ENV=development

# Database (Neon Cloud PostgreSQL)
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-red-water-a1abcde.ap-southeast-1.aws.neon.tech/medifusion?sslmode=require

# Security & API Keys
JWT_SECRET=your_super_secret_key_123
STRIPE_SECRET_KEY=sk_test_... (Ask team lead for test keys)
CLIENT_URL=http://localhost:5173
```

#### Database Setup
Because we are using Neon Cloud Database, **you do not need to create a local database**. 
When you start the server, Sequelize will automatically connect to the cloud and sync the tables!

#### Seeding Initial Data (Optional)
To populate your local database with test users (Admin, Doctor, Patient), run:
```bash
cd server
node seed.js
```
*Warning: This will clear any existing data in your local database and reset it to defaults.*

---

### 3. Frontend Setup (Client)

Open a new terminal, navigate to the client directory and install dependencies:
```bash
cd client
npm install
```

---

## 🚀 Running the Project

You can run both backend and frontend with a single command from the **root** directory (if configured) or separate terminals.

**Method 1: Separate Terminals (Recommended)**
```bash
# Terminal 1 (Server)
cd server
npm run dev

# Terminal 2 (Client)
cd client
npm run dev
```

**Method 2: Root Directory**
```bash
# From project root
npm run dev
```

---

## 🔍 Verification
- **Backend Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Frontend App:** [http://localhost:5173](http://localhost:5173)

---

## 🛑 Troubleshooting

- **"Cannot GET /" on localhost:5000?**
  - This is normal! The backend is an API. Check `/api/health` instead.

- **Database Connection Error?**
  - Ensure Postgres is running.
  - Verify `DB_USER` and `DB_PASSWORD` in `server/.env` match your local Postgres credentials.

- **"Module not found"?**
  - Run `npm install` again in both `server/` and `client/` directories.
