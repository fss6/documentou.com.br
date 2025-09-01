import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["form"]

  connect() {
    this.form = this.element
    this.autoSaveTimeout = null
  }

  autoSave(event) {
    // Cancelar o timeout anterior
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout)
    }
    
    // Definir novo timeout para auto-save após 2 segundos de inatividade
    this.autoSaveTimeout = setTimeout(() => {
      this.saveContent()
    }, 2000)
  }

  async saveContent() {
    const formData = new FormData(this.form)
    
    try {
      const response = await fetch(`/meetings/${this.getMeetingId()}/update_content`, {
        method: "PATCH",
        body: formData,
        headers: {
          "X-CSRF-Token": document.querySelector("[name='csrf-token']").content
        }
      })
      
      if (response.ok) {
        // Mostrar indicador de salvamento
        this.showSaveIndicator(true)
        
        // Esconder o indicador após 3 segundos
        setTimeout(() => {
          this.showSaveIndicator(false)
        }, 3000)
      } else {
        console.error("Erro ao salvar conteúdo")
        this.showSaveIndicator(false)
      }
    } catch (error) {
      console.error("Erro:", error)
      this.showSaveIndicator(false)
    }
  }

  showSaveIndicator(saved) {
    const submitButton = this.form.querySelector('button[type="submit"]')
    
    if (saved) {
      submitButton.innerHTML = `
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Salvo!
      `
      submitButton.classList.remove('bg-blue-600', 'hover:bg-blue-700')
      submitButton.classList.add('bg-green-600', 'cursor-default')
    } else {
      submitButton.innerHTML = `
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Salvar Conteúdo
      `
      submitButton.classList.remove('bg-green-600', 'cursor-default')
      submitButton.classList.add('bg-blue-600', 'hover:bg-blue-700')
    }
  }

  getMeetingId() {
    // Extrair o ID da reunião da URL atual
    const urlParts = window.location.pathname.split('/')
    return urlParts[urlParts.indexOf('meetings') + 1]
  }

  disconnect() {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout)
    }
  }
}
