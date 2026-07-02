# 🧠 DocuMind — AI Document Intelligence Platform

> Upload documents. Ask questions. Get instant AI-powered answers.

[![CI/CD](https://github.com/yourusername/documind/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/yourusername/documind/actions)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js + Vite + TailwindCSS |
| Backend | Node.js + Express + Prisma |
| AI Engine | Python + FastAPI + LangChain |
| Vector DB | ChromaDB |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| DevOps | Docker + GitHub Actions |

---

## 📦 Project Structure

```
documind/
├── frontend/         # React.js SPA
├── backend/          # Node.js REST API
├── ai-engine/        # Python RAG Engine
├── docker-compose.yml
└── .github/workflows/ci-cd.yml
```

---

## 🛠️ Quick Start (Docker)

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/documind.git
cd documind

# 2. Set up environment variables
cp backend/.env.example backend/.env
cp ai-engine/.env.example ai-engine/.env

# 3. Run everything
docker-compose up --build
```

**Services will be available at:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- AI Engine: http://localhost:8000
- API Docs (FastAPI): http://localhost:8000/docs

---

## 🔧 Manual Setup (Without Docker)

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL

### Backend
```bash
cd backend
npm install
npx prisma migrate dev
npm run dev
```

### AI Engine
```bash
cd ai-engine
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🌊 RAG Pipeline

```
Document Upload → Text Extraction → Chunking → Embedding → ChromaDB
User Question  → Embedding → Similarity Search → Context Retrieval → LLM → Answer
```

---

## 📄 License

MIT © 2025 — Built with ❤️ for learning
