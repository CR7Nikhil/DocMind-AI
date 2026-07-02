import fitz  # PyMuPDF
import docx
import os
from typing import List


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF using PyMuPDF."""
    doc = fitz.open(file_path)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text.strip()


def extract_text_from_docx(file_path: str) -> str:
    """Extract text from DOCX file."""
    doc = docx.Document(file_path)
    text = "\n".join([para.text for para in doc.paragraphs if para.text.strip()])
    return text.strip()


def extract_text_from_txt(file_path: str) -> str:
    """Extract text from plain text file."""
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        return f.read().strip()


def extract_text(file_path: str, mime_type: str) -> str:
    """
    Route to appropriate text extractor based on file type.
    
    Args:
        file_path: Path to the uploaded file
        mime_type: MIME type of the file
    
    Returns:
        Extracted text content
    """
    ext = os.path.splitext(file_path)[1].lower()

    if mime_type == "application/pdf" or ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif mime_type in [
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ] or ext in [".doc", ".docx"]:
        return extract_text_from_docx(file_path)
    elif mime_type == "text/plain" or ext == ".txt":
        return extract_text_from_txt(file_path)
    else:
        raise ValueError(f"Unsupported file type: {mime_type}")
