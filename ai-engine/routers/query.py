from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional

from services.rag_pipeline import query_document

router = APIRouter()


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class QueryRequest(BaseModel):
    question: str
    document_id: str
    chat_history: Optional[List[ChatMessage]] = []
    top_k: Optional[int] = 5


class QueryResponse(BaseModel):
    answer: str
    sources: List[Dict]
    document_id: str
    question: str


@router.post("/query", response_model=QueryResponse)
async def query_document_endpoint(request: QueryRequest):
    """
    Query a document using RAG pipeline.
    Retrieves relevant chunks and generates an answer using LLM.
    """
    try:
        if not request.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")

        print(f"🔍 Query for document {request.document_id}: {request.question[:100]}...")

        # Convert Pydantic models to dicts for the pipeline
        history = [{"role": m.role, "content": m.content} for m in request.chat_history]

        answer, sources = query_document(
            document_id=request.document_id,
            question=request.question,
            chat_history=history,
            top_k=request.top_k
        )

        print(f"✅ Generated answer ({len(answer)} chars) with {len(sources)} sources")

        return QueryResponse(
            answer=answer,
            sources=sources,
            document_id=request.document_id,
            question=request.question
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Query error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")
