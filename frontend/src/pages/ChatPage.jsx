import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { chatService } from '../services/api'

const SUGGESTIONS = [
  'Summarize the key findings',
  'What are the main conclusions?',
  'List all recommendations',
  'What data was analyzed?'
]

function SourcesSection({ sources }) {
  const [open, setOpen] = useState(false)
  if (!sources || sources.length === 0) return null

  return (
    <div className="sources-section">
      <button className="sources-toggle" onClick={() => setOpen(v => !v)}>
        📖 {sources.length} source{sources.length !== 1 ? 's' : ''} {open ? '▲' : '▼'}
      </button>
      {open && (
        <div className="source-preview-list">
          {sources.map((src, i) => (
            <div key={i} className="source-preview-item">
              <div className="src-header">
                <span>Chunk {src.chunk_index + 1}</span>
                <span>{Math.round(src.relevance_score * 100)}% match</span>
              </div>
              {src.content}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ChatPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [session, setSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await chatService.getMessages(sessionId)
        setSession(res.data.session)
        setMessages(res.data.session.messages)
      } catch {
        toast.error('Could not load chat')
        navigate('/dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sessionId, navigate])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const sendMessage = async (question) => {
    const q = (question || input).trim()
    if (!q || sending) return
    setInput('')
    setSending(true)

    const userMsg = { id: Date.now(), role: 'user', content: q, createdAt: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])

    try {
      const res = await chatService.sendMessage(sessionId, q)
      setMessages(prev => [
        ...prev.filter(m => m.id !== userMsg.id),
        res.data.userMessage,
        res.data.assistantMessage
      ])
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== userMsg.id))
      toast.error(err.response?.data?.error || 'Failed to get response')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  return (
    <div className="chat-layout">
      {/* Header */}
      <div className="chat-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>
          ← Back
        </button>

        <div className="chat-header-doc">
          <div className="chat-doc-icon">📄</div>
          <div className="chat-doc-info">
            <h2>{session?.document?.name}</h2>
            <span>{session?.title}</span>
          </div>
        </div>

        <span className="docmind-label">✦ DOCMIND AI ✦</span>

        <div className="ready-badge">
          <div className="ready-dot" />
          Ready
        </div>
      </div>

      {/* Messages */}
      <div className="chat-body" id="chat-body">
        {messages.length === 0 && !sending ? (
          <div className="chat-welcome">
            <div className="welcome-icon">🤖</div>
            <h3>Ask me anything</h3>
            <p>I've analyzed your document. Start with a suggestion or type your own question.</p>
            <div className="suggestion-chips">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} id={`suggestion-${i}`} className="suggestion-chip" onClick={() => sendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.role}`}>
                <div className="msg-avatar">
                  {msg.role === 'user' ? (user?.name?.[0]?.toUpperCase() || 'U') : '🤖'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div className="msg-bubble">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                    {msg.role === 'assistant' && (
                      <SourcesSection sources={msg.sources} />
                    )}
                  </div>
                  {msg.createdAt && (
                    <p className="msg-time">{formatTime(msg.createdAt)}</p>
                  )}
                </div>
              </div>
            ))}

            {sending && (
              <div className="message assistant">
                <div className="msg-avatar">🤖</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div className="msg-bubble">
                    <div className="typing-indicator">
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <div className="chat-input-form">
          <textarea
            ref={textareaRef}
            id="chat-input"
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your document..."
            rows={1}
            disabled={sending}
          />
          <button
            id="send-btn"
            className="send-btn"
            onClick={() => sendMessage()}
            disabled={!input.trim() || sending}
          >
            {sending ? '⏳' : '➤'}
          </button>
        </div>
        <p className="chat-hint">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}