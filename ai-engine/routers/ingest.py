import os
import tempfile
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse

from services.document_processor import extract_text
from services.rag_pipeline import ingest_document, delete_document_vectors

router = APIRouter()


@router.post("/ingest")
async def ingest_document_endpoint(
    file: UploadFile = File(...),
    document_id: str = Form(...)
):
    """
    Ingest a document: extract text, chunk, embed, and store in ChromaDB.
    """
    try:
        # Save uploaded file temporarily
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        print(f"📥 Ingesting document: {file.filename} (ID: {document_id})")

        # Extract text
        text = extract_text(tmp_path, file.content_type)
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the document. The file may be empty or image-based.")

        print(f"📝 Extracted {len(text)} characters from {file.filename}")

        # Ingest into ChromaDB
        vector_ids = ingest_document(document_id, text)

        # Clean up temp file
        os.unlink(tmp_path)

        return JSONResponse({
            "message": "Document ingested successfully",
            "document_id": document_id,
            "vector_ids": vector_ids,
            "chunks_count": len(vector_ids),
            "text_length": len(text)
        })

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Ingestion error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


@router.delete("/documents/{document_id}")
async def delete_document_endpoint(document_id: str):
    """Delete all vectors for a document from ChromaDB."""
    success = delete_document_vectors(document_id)
    if success:
        return {"message": f"Document {document_id} deleted from vector store"}
    raise HTTPException(status_code=500, detail="Failed to delete document vectors")
