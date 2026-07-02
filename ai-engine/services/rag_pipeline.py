import os
import chromadb
from chromadb.config import Settings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import HumanMessage, SystemMessage
from typing import List, Dict, Any, Tuple
from dotenv import load_dotenv

load_dotenv()

# ─── ChromaDB Client ──────────────────────────────────────────────────────────
CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")

chroma_client = chromadb.PersistentClient(
    path=CHROMA_PERSIST_DIR,
    settings=Settings(anonymized_telemetry=False)
)

# ─── LLM & Embeddings ─────────────────────────────────────────────────────────
from langchain_community.embeddings import HuggingFaceEmbeddings
embeddings = HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2"
)
from langchain_google_genai import ChatGoogleGenerativeAI
import google.generativeai as genai

api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=api_key)

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=api_key,
    temperature=0.1
)

# ─── Text Splitter ────────────────────────────────────────────────────────────
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=int(os.getenv("CHUNK_SIZE", 1000)),
    chunk_overlap=int(os.getenv("CHUNK_OVERLAP", 200)),
    length_function=len,
    separators=["\n\n", "\n", ". ", " ", ""]
)


def get_or_create_collection(document_id: str):
    """Get or create a ChromaDB collection for a document."""
    # ChromaDB collection names must be alphanumeric with hyphens
    collection_name = f"doc_{document_id.replace('-', '_')}"
    return chroma_client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"}
    )


def ingest_document(document_id: str, text: str) -> List[str]:
    """
    Split text into chunks, embed them, and store in ChromaDB.
    
    Args:
        document_id: Unique ID for the document
        text: Full text content of the document
    
    Returns:
        List of vector IDs stored in ChromaDB
    """
    # Split into chunks
    chunks = text_splitter.split_text(text)
    print(f"📄 Split document into {len(chunks)} chunks")

    # Generate embeddings
    chunk_embeddings = embeddings.embed_documents(chunks)

    # Store in ChromaDB
    collection = get_or_create_collection(document_id)

    ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
    
    collection.add(
        ids=ids,
        embeddings=chunk_embeddings,
        documents=chunks,
        metadatas=[{"chunk_index": i, "document_id": document_id} for i in range(len(chunks))]
    )

    print(f"✅ Stored {len(ids)} chunks in ChromaDB for document {document_id}")
    return ids


def query_document(
    document_id: str,
    question: str,
    chat_history: List[Dict[str, str]],
    top_k: int = None
) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Retrieve relevant chunks and generate an answer using LLM.
    
    Args:
        document_id: ID of the document to query
        question: User's question
        chat_history: Previous messages for context
        top_k: Number of chunks to retrieve
    
    Returns:
        Tuple of (answer, sources)
    """
    top_k = top_k or int(os.getenv("TOP_K_RESULTS", 5))

    # Embed the question
    question_embedding = embeddings.embed_query(question)

    # Search ChromaDB for similar chunks
    collection = get_or_create_collection(document_id)
    results = collection.query(
        query_embeddings=[question_embedding],
        n_results=min(top_k, collection.count()),
        include=["documents", "distances", "metadatas"]
    )

    if not results["documents"] or not results["documents"][0]:
        return "I couldn't find relevant information in the document to answer your question.", []

    # Build context from retrieved chunks
    retrieved_chunks = results["documents"][0]
    distances = results["distances"][0]
    
    context = "\n\n---\n\n".join(
        [f"[Chunk {i+1}]:\n{chunk}" for i, chunk in enumerate(retrieved_chunks)]
    )

    # Build chat history string
    history_str = ""
    if chat_history:
        recent_history = chat_history[-6:]  # last 3 exchanges
        history_str = "\n".join([
            f"{'User' if m['role'] == 'user' else 'Assistant'}: {m['content']}"
            for m in recent_history
        ])

    # Craft the prompt
    system_prompt = """You are DocuMind, an AI assistant that answers questions based strictly on the provided document context.

Rules:
1. Answer ONLY based on the provided context chunks. Do NOT use prior knowledge.
2. If the answer is not in the context, say "I couldn't find this information in the document."
3. Be concise, accurate, and helpful.
4. Reference specific parts of the document when relevant.
5. Maintain conversation continuity using the chat history."""

    user_prompt = f"""Document Context:
{context}

{"Previous Conversation:" + chr(10) + history_str if history_str else ""}

Current Question: {question}

Please provide a helpful, accurate answer based on the document context above."""

    # Call LLM
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt)
    ]
    
    response = llm.invoke(messages)
    answer = response.content

    # Format sources
    sources = [
        {
            "chunk_index": results["metadatas"][0][i].get("chunk_index", i),
            "content": chunk[:200] + "..." if len(chunk) > 200 else chunk,
            "relevance_score": round(1 - distances[i], 3)  # cosine similarity
        }
        for i, chunk in enumerate(retrieved_chunks)
    ]

    return answer, sources


def delete_document_vectors(document_id: str) -> bool:
    """Delete all vectors for a document from ChromaDB."""
    try:
        collection_name = f"doc_{document_id.replace('-', '_')}"
        chroma_client.delete_collection(collection_name)
        print(f"🗑️ Deleted ChromaDB collection for document {document_id}")
        return True
    except Exception as e:
        print(f"Error deleting collection: {e}")
        return False
