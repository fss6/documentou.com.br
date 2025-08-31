import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["container"]
  static values = { 
    position: { type: String, default: "top-right" },
    duration: { type: Number, default: 5000 }
  }

  connect() {
    this.createToastContainer()
  }

  createToastContainer() {
    if (!this.hasContainerTarget) {
      const container = document.createElement('div')
      container.setAttribute('data-toast-target', 'container')
      container.className = `fixed z-50 ${this.getPositionClasses()} p-4 space-y-2`
      document.body.appendChild(container)
    }
  }

  getPositionClasses() {
    switch (this.positionValue) {
      case 'top-left':
        return 'top-4 left-4'
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2'
      case 'top-right':
        return 'top-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2'
      case 'bottom-right':
        return 'bottom-4 right-4'
      default:
        return 'top-4 right-4'
    }
  }

  show(message, type = 'info', duration = null) {
    const toast = this.createToastElement(message, type)
    this.containerTarget.appendChild(toast)

    // Animar entrada
    setTimeout(() => {
      toast.classList.remove('opacity-0', 'translate-x-full')
    }, 10)

    // Auto remover
    const autoRemoveDuration = duration || this.durationValue
    if (autoRemoveDuration > 0) {
      setTimeout(() => {
        this.hide(toast)
      }, autoRemoveDuration)
    }

    return toast
  }

  success(message, duration = null) {
    return this.show(message, 'success', duration)
  }

  error(message, duration = null) {
    return this.show(message, 'error', duration)
  }

  warning(message, duration = null) {
    return this.show(message, 'warning', duration)
  }

  info(message, duration = null) {
    return this.show(message, 'info', duration)
  }

  createToastElement(message, type) {
    const toast = document.createElement('div')
    toast.className = `toast-item opacity-0 translate-x-full transition-all duration-300 ease-in-out max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 p-4 ${this.getTypeClasses(type)}`
    
    const icon = this.getIcon(type)
    const title = this.getTitle(type)
    
    toast.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0">
          ${icon}
        </div>
        <div class="ml-3 flex-1">
          <p class="text-sm font-medium ${this.getTextColor(type)}">${title}</p>
          <p class="mt-1 text-sm text-gray-600">${message}</p>
        </div>
        <div class="ml-4 flex-shrink-0 flex">
          <button type="button" class="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600" data-action="click->toast#hide">
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
      </div>
    `

    // Adicionar referência ao toast para poder removê-lo
    toast.dataset.toastId = Date.now()
    
    return toast
  }

  getTypeClasses(type) {
    switch (type) {
      case 'success':
        return 'border-green-500'
      case 'error':
        return 'border-red-500'
      case 'warning':
        return 'border-yellow-500'
      case 'info':
        return 'border-blue-500'
      default:
        return 'border-gray-500'
    }
  }

  getTextColor(type) {
    switch (type) {
      case 'success':
        return 'text-green-800'
      case 'error':
        return 'text-red-800'
      case 'warning':
        return 'text-yellow-800'
      case 'info':
        return 'text-blue-800'
      default:
        return 'text-gray-800'
    }
  }

  getIcon(type) {
    switch (type) {
      case 'success':
        return `<svg class="h-6 w-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        </svg>`
      case 'error':
        return `<svg class="h-6 w-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
        </svg>`
      case 'warning':
        return `<svg class="h-6 w-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
        </svg>`
      case 'info':
        return `<svg class="h-6 w-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
        </svg>`
      default:
        return `<svg class="h-6 w-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
        </svg>`
    }
  }

  getTitle(type) {
    switch (type) {
      case 'success':
        return 'Sucesso!'
      case 'error':
        return 'Erro!'
      case 'warning':
        return 'Atenção!'
      case 'info':
        return 'Informação'
      default:
        return 'Notificação'
    }
  }

  hide(event) {
    let toast
    if (event && event.currentTarget) {
      // Se foi chamado por um evento (clique no botão X)
      toast = event.currentTarget.closest('.toast-item')
    } else {
      // Se foi chamado diretamente (remoção automática)
      toast = event
    }
    
    if (toast) {
      toast.classList.add('opacity-0', 'translate-x-full')
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast)
        }
      }, 300)
    }
  }

  clear() {
    const toasts = this.containerTarget.querySelectorAll('.toast-item')
    toasts.forEach(toast => this.hide(toast))
  }
}
