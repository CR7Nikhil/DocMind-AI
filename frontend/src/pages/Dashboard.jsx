import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { documentService, chatService } from '../services/api'
import { formatDistanceToNow } from 'date-fns'

const getFileType = (mimeType) => {
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType === 'text/plain') return 'txt'
  return 'docx'
}

const getFileLabel = (mimeType) => {
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType === 'text/plain') return 'TXT'
  return 'DOCX'
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const fetchDocs = useCallback(async () => {
    try {
      const res = await documentService.getAll()
      setDocuments(res.data.documents)
    } catch {
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  useEffect(() => {
    const hasProcessing = documents.some(d => d.status === 'processing')
    if (!hasProcessing) return
    const interval = setInterval(fetchDocs, 3000)
    return () => clearInterval(interval)
  }, [documents, fetchDocs])

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return
    setUploading(true)
    setProgress(0)
    const formData = new FormData()
    formData.append('file', file)
    try {
      await documentService.upload(formData, setProgress)
      toast.success(`"${file.name}" uploaded!`)
      fetchDocs()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [fetchDocs])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': [],
      'application/msword': [],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
      'text/plain': []
    },
    multiple: false,
    disabled: uploading
  })

  const handleStartChat = async (doc) => {
    if (doc.status !== 'ready') {
      toast.error('Document is still processing. Please wait.')
      return
    }
    try {
      const res = await chatService.createSession(doc.id)
      navigate(`/chat/${res.data.session.id}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not start chat')
    }
  }

  const handleDelete = async (e, docId) => {
    e.stopPropagation()
    if (!confirm('Delete this document and all its chats?')) return
    try {
      await documentService.delete(docId)
      setDocuments(d => d.filter(doc => doc.id !== docId))
      toast.success('Document deleted')
    } catch {
      toast.error('Failed to delete document')
    }
  }

  return (
    <div className="dashboard">
      {/* Navbar */}
      <nav className="navbar">
        <span className="navbar-brand">
          <div className="logo-icon">🧠</div>
          DocuMind
        </span>
        <div className="navbar-actions">
          <div className="user-pill">
            <div className="avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <span style={{ fontSize: '14px', color: 'var(--text-soft)' }}>{user?.name}</span>
          </div>
          <button
            id="logout-btn"
            className="btn btn-ghost btn-sm"
            onClick={() => { logout(); navigate('/') }}
          >
            → Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <p className="doc-count">{documents.length} document{documents.length !== 1 ? 's' : ''} in your workspace</p>

        {/* Upload Zone */}
        <div
          {...getRootProps()}
          className={`upload-zone ${isDragActive ? 'drag-active' : ''}`}
          id="upload-zone"
        >
          <input {...getInputProps()} id="file-input" />
          <div className="upload-icon-wrap">
            {uploading ? '⏳' : isDragActive ? '📂' : '📤'}
          </div>
          <div className="upload-text">
            <h3>{uploading ? `Uploading... ${progress}%` : 'Upload a new document'}</h3>
            <p>
              {uploading
                ? 'Please wait while your document is being uploaded'
                : 'Drag & drop or click · PDF, DOC, DOCX, TXT up to 500 MB'}
            </p>
            {uploading && (
              <div className="upload-progress-bar-wrap" style={{ marginTop: 10 }}>
                <div className="upload-progress-bar" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
          {!uploading && (
            <button className="btn btn-primary btn-sm" onClick={e => e.stopPropagation()}>
              Browse Files
            </button>
          )}
        </div>

        {/* Documents */}
        <div className="section-header">
          <h2>Your Documents</h2>
          <span>{documents.length} file{documents.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : documents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3>No documents yet</h3>
            <p>Upload your first document above to get started</p>
          </div>
        ) : (
          <div className="documents-grid">
            {documents.map(doc => {
              const ftype = getFileType(doc.fileType)
              const flabel = getFileLabel(doc.fileType)
              return (
                <div
                  key={doc.id}
                  className="doc-card"
                  onClick={() => handleStartChat(doc)}
                  id={`doc-${doc.id}`}
                >
                  <div className="doc-card-top">
                    <div className="doc-file-icon">📄</div>
                    <div className="doc-info">
                      <h3>{doc.name}</h3>
                      <p className="doc-meta">
                        {(doc.fileSize / 1024).toFixed(1)} KB · {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <span className={`doc-type-badge ${ftype}`}>{flabel}</span>
                  </div>

                  <div style={{ padding: '0 20px 12px' }}>
                    <span className={`status-badge ${doc.status}`}>
                      {doc.status === 'processing' && <span className="dot" />}
                      {doc.status === 'ready' ? '✓ Ready' : doc.status === 'processing' ? 'Processing...' : '✗ Failed'}
                    </span>
                  </div>

                  <div className="doc-card-actions">
                    <button
                      id={`chat-btn-${doc.id}`}
                      className="doc-chat-btn"
                      disabled={doc.status !== 'ready'}
                      onClick={e => { e.stopPropagation(); handleStartChat(doc) }}
                    >
                      💬 Chat
                    </button>
                    <button
                      id={`delete-btn-${doc.id}`}
                      className="doc-delete-btn"
                      onClick={e => handleDelete(e, doc.id)}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}