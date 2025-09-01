import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["editor", "input", "status", "retryButton"]
  static values = { 
    url: String,
    field: String,
    meetingId: String,
    debounceMs: { type: Number, default: 2000 }
  }

  connect() {
    this.setupQuill()
    this.setupBroadcastChannel()
    this.setupOfflineDetection()
    this.loadSavedContent()
    
    // Debounced auto-save
    this.debouncedSave = this.debounce(this.saveContent.bind(this), this.debounceMsValue)
  }

  disconnect() {
    if (this.quill) {
      this.quill.off('text-change', this.textChangeHandler)
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close()
    }
  }

  setupQuill() {
    // Aguardar o Quill estar pronto
    this.waitForQuill().then(() => {
      this.quill = this.editorTarget.quill
      
      // Handler para mudanças de texto
      this.textChangeHandler = () => {
        this.updateInput()
        this.showStatus('typing')
        this.debouncedSave()
      }
      
      this.quill.on('text-change', this.textChangeHandler)
    })
  }

  async waitForQuill() {
    let attempts = 0
    while (!this.editorTarget.quill && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
    }
    if (!this.editorTarget.quill) {
      throw new Error('Quill not found')
    }
  }

  setupBroadcastChannel() {
    this.broadcastChannel = new BroadcastChannel(`meeting_content_${this.meetingIdValue}`)
    
    this.broadcastChannel.onmessage = (event) => {
      if (event.data.type === 'content_updated' && 
          event.data.field === this.fieldValue &&
          event.data.source !== this.sessionId) {
        this.mergeContent(event.data.content)
      }
    }
  }

  setupOfflineDetection() {
    this.isOnline = navigator.onLine
    
    window.addEventListener('online', () => {
      this.isOnline = true
      this.showStatus('online')
      this.retryPendingSaves()
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
      this.showStatus('offline')
    })
  }

  updateInput() {
    if (this.hasInputTarget) {
      if (this.quill && this.quill.root) {
        // Se temos Quill, usar o conteúdo HTML
        this.inputTarget.value = this.quill.root.innerHTML
      } else if (this.editorTarget.innerHTML) {
        // Fallback: usar o conteúdo do editor
        this.inputTarget.value = this.editorTarget.innerHTML
      }
    }
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

  mergeContent(content) {
    // Só merge se o conteúdo local for mais antigo
    const localContent = this.quill.root.innerHTML
    if (localContent !== content) {
      // Mostrar notificação de conflito
      this.showMergeNotification()
      
      // Opcional: fazer merge automático ou perguntar ao usuário
      // Por enquanto, vamos apenas notificar
    }
  }

  showMergeNotification() {
    // Criar notificação de conflito
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded z-50'
    notification.innerHTML = `
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
        </svg>
        <span>Conteúdo atualizado em outra aba. Recarregue para sincronizar.</span>
        <button class="ml-4 text-yellow-700 hover:text-yellow-900" onclick="this.parentElement.parentElement.remove()">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
    `
    document.body.appendChild(notification)
    
    // Auto-remover após 10 segundos
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove()
      }
    }, 10000)
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
          // Remover após 3 tentativas
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

  // Getters
  get sessionId() {
    if (!this._sessionId) {
      this._sessionId = Math.random().toString(36).substr(2, 9)
    }
    return this._sessionId
  }
}
