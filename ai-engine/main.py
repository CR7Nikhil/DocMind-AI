from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uvicorn

from routers import ingest, query

load_dotenv()

app = FastAPI(
    title="DocuMind AI Engine",
    description="RAG-powered document intelligence API",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(ingest.router, tags=["Ingestion"])
app.include_router(query.router, tags=["Query"])


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "documind-ai-engine",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
