import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["editor", "input", "status"]
  static values = { 
    placeholder: String,
    rows: Number,
    url: String,
    field: String,
    meetingId: String,
    debounceMs: { type: Number, default: 2000 }
  }

  connect() {
    this.initializeQuill()
    this.setupBroadcastChannel()
    this.setupOfflineDetection()
    this.loadSavedContent()
    
    // Debounced auto-save
    this.debouncedSave = this.debounce(this.saveContent.bind(this), this.debounceMsValue)
  }

  disconnect() {
    if (this.quill) {
      try {
        if (typeof this.quill.destroy === 'function') {
          this.quill.destroy()
        } else {
          this.quill.off('text-change')
          this.quill = null
        }
      } catch (error) {
        console.warn('Erro ao desconectar Quill:', error)
        this.quill = null
      }
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close()
    }
  }

  initializeQuill() {
    if (typeof Quill === 'undefined') {
      console.error('Quill não está carregado')
      return
    }

    try {
      const options = {
        theme: 'snow',
        placeholder: this.placeholderValue || 'Digite aqui...',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['link', 'blockquote', 'code-block'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }]
          ]
        },
        formats: ['bold', 'italic', 'underline', 'strike', 'link', 'blockquote', 'code-block', 'list', 'bullet']
      }

      this.quill = new Quill(this.editorTarget, options)

      if (this.rowsValue) {
        this.setHeightFromRows(this.rowsValue)
      }

      // Handler para mudanças de texto
      this.quill.on('text-change', () => {
        this.updateInput()
        this.showStatus('typing')
        this.debouncedSave()
      })

      // Carregar conteúdo inicial se existir
      this.loadInitialContent()

      this.showStatus('saved')
    } catch (error) {
      console.error('Erro ao inicializar Quill:', error)
    }
  }

  loadInitialContent() {
    if (this.hasInputTarget && this.inputTarget.value) {
      // Carregando conteúdo inicial
      const decodedContent = this.decodeHtmlEntities(this.inputTarget.value)
      this.quill.root.innerHTML = decodedContent
    }
  }

  decodeHtmlEntities(str) {
    const textarea = document.createElement('textarea')
    textarea.innerHTML = str
    return textarea.value
  }

  setHeightFromRows(rows) {
    if (this.quill && this.quill.root) {
      const lineHeight = 22
      const heightInPx = rows * lineHeight
      this.quill.root.style.minHeight = `${heightInPx}px`
      this.quill.root.style.height = `${heightInPx}px`
    }
  }

  updateInput() {
    if (this.hasInputTarget && this.quill) {
      const html = this.quill.root.innerHTML
      this.inputTarget.value = html === '<p><br></p>' ? '' : html
    }
  }

  setupBroadcastChannel() {
    // Canal único por campo para sincronização entre abas
    this.broadcastChannel = new BroadcastChannel(`meeting_content_${this.meetingIdValue}_${this.fieldValue}`)
    
    // Listener para mensagens de conteúdo atualizado
    this.broadcastChannel.onmessage = (event) => {
      if (event.data.type === 'content_updated' && 
          event.data.field === this.fieldValue &&
          event.data.source !== this.sessionId) {
        this.updateContentFromBroadcast(event.data.content)
      }
    }
  }

  setupOfflineDetection() {
    this.isOnline = navigator.onLine
    
    window.addEventListener('online', () => {
      this.isOnline = true
      this.retryPendingSaves()
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
      this.showStatus('offline')
    })
  }

  async saveContent() {
    if (!this.isOnline) {
      this.queueForRetry()
      return
    }

    try {
      this.showStatus('saving')
      
      const response = await fetch(this.urlValue, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
        },
        body: JSON.stringify({
          content: {
            [this.fieldValue]: this.quill.root.innerHTML
          }
        })
      })

      if (response.ok) {
        this.showStatus('saved')
        this.broadcastUpdate()
        this.clearRetryQueue()
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('Auto-save failed:', error)
      this.showStatus('error')
      this.queueForRetry()
    }
  }

  broadcastUpdate() {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'content_updated',
        field: this.fieldValue,
        content: this.quill.root.innerHTML,
        source: this.sessionId,
        timestamp: Date.now()
      })
    }
  }

  updateContentFromBroadcast(content) {
    if (this.quill) {
      this.quill.root.innerHTML = content
      this.updateInput()
      this.showStatus('saved')
    }
  }

  queueForRetry() {
    if (!this.retryQueue) {
      this.retryQueue = []
    }
    
    const content = this.quill.root.innerHTML
    if (!this.retryQueue.find(item => item.content === content)) {
      this.retryQueue.push({
        content,
        timestamp: Date.now(),
        attempts: 0
      })
    }
    
    this.saveToLocalStorage()
  }

  async retryPendingSaves() {
    if (!this.retryQueue || this.retryQueue.length === 0) return
    
    this.showStatus('retrying')
    
    for (const item of this.retryQueue) {
      try {
        item.attempts++
        
        const response = await fetch(this.urlValue, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
          },
          body: JSON.stringify({
            content: {
              [this.fieldValue]: item.content
            }
          })
        })

        if (response.ok) {
          this.retryQueue = this.retryQueue.filter(q => q !== item)
        } else if (item.attempts >= 3) {
          this.retryQueue = this.retryQueue.filter(q => q !== item)
        }
      } catch (error) {
        console.error('Retry failed:', error)
        if (item.attempts >= 3) {
          this.retryQueue = this.retryQueue.filter(q => q !== item)
        }
      }
    }
    
    this.saveToLocalStorage()
    this.showStatus(this.retryQueue.length > 0 ? 'error' : 'saved')
  }

  clearRetryQueue() {
    this.retryQueue = []
    this.saveToLocalStorage()
  }

  saveToLocalStorage() {
    const key = `meeting_content_${this.meetingIdValue}_${this.fieldValue}`
    localStorage.setItem(key, JSON.stringify({
      retryQueue: this.retryQueue || [],
      lastSaved: Date.now()
    }))
  }

  loadSavedContent() {
    const key = `meeting_content_${this.meetingIdValue}_${this.fieldValue}`
    const saved = localStorage.getItem(key)
    
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.retryQueue && data.retryQueue.length > 0) {
          this.retryQueue = data.retryQueue
          this.showStatus('offline')
        }
      } catch (error) {
        console.error('Failed to load saved content:', error)
      }
    }
  }

  showStatus(status) {
    if (!this.hasStatusTarget) return
    
    const statusMap = {
      typing: { text: 'Digitando...', class: 'text-blue-600', icon: '✏️' },
      saving: { text: 'Salvando...', class: 'text-yellow-600', icon: '💾' },
      saved: { text: 'Salvo', class: 'text-green-600', icon: '✅' },
      error: { text: 'Erro ao salvar', class: 'text-red-600', icon: '❌' },
      offline: { text: 'Offline - Salvando localmente', class: 'text-gray-600', icon: '📱' },
      retrying: { text: 'Tentando salvar...', class: 'text-orange-600', icon: '🔄' }
    }
    
    const statusInfo = statusMap[status] || statusMap.saved
    this.statusTarget.innerHTML = `${statusInfo.icon} ${statusInfo.text}`
    this.statusTarget.className = `text-sm ${statusInfo.class}`
  }

  debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  get sessionId() {
    if (!this._sessionId) {
      this._sessionId = Math.random().toString(36).substr(2, 9)
    }
    return this._sessionId
  }
}

