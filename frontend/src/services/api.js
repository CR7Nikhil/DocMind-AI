import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

// Response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/auth'
    }
    return Promise.reject(error)
  }
)

export const documentService = {
  upload: (formData, onProgress) =>
    api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: e => onProgress?.(Math.round((e.loaded * 100) / e.total))
    }),
  getAll: () => api.get('/documents'),
  getById: (id) => api.get(`/documents/${id}`),
  delete: (id) => api.delete(`/documents/${id}`)
}

export const chatService = {
  createSession: (documentId, title) => api.post('/chat/sessions', { documentId, title }),
  getSessions: () => api.get('/chat/sessions'),
  getMessages: (sessionId) => api.get(`/chat/sessions/${sessionId}/messages`),
  sendMessage: (sessionId, question) => api.post(`/chat/sessions/${sessionId}/messages`, { question }),
  deleteSession: (sessionId) => api.delete(`/chat/sessions/${sessionId}`)
}

export default api
