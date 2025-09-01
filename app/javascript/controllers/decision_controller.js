import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["form", "list"]

  showForm() {
    this.formTarget.classList.remove("hidden")
  }

  hideForm() {
    this.formTarget.classList.add("hidden")
    // Limpar o formulário
    this.formTarget.querySelector("form").reset()
  }

  async create(event) {
    event.preventDefault()
    
    const form = event.target
    const formData = new FormData(form)
    
    try {
      const response = await fetch(`/meetings/${this.getMeetingId()}/decisions`, {
        method: "POST",
        body: formData,
        headers: {
          "X-CSRF-Token": document.querySelector("[name='csrf-token']").content
        }
      })
      
      if (response.ok) {
        const decision = await response.json()
        this.addDecisionToList(decision)
        this.hideForm()
        
        // Mostrar mensagem de sucesso
        this.showToast("Decisão criada com sucesso!", "success")
      } else {
        const error = await response.json()
        this.showToast("Erro ao criar decisão: " + error.message, "error")
      }
    } catch (error) {
      console.error("Erro:", error)
      this.showToast("Erro ao criar decisão", "error")
    }
  }

  addDecisionToList(decision) {
    const decisionHtml = this.createDecisionHtml(decision)
    this.listTarget.insertAdjacentHTML("afterbegin", decisionHtml)
    
    // Remover mensagem de "nenhuma decisão"
    const emptyMessage = this.listTarget.querySelector(".italic")
    if (emptyMessage) {
      emptyMessage.remove()
    }
  }

  createDecisionHtml(decision) {
    const statusClass = this.getStatusClass(decision.status)
    const statusText = this.getStatusText(decision.status)
    
    return `
      <div class="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div class="flex-shrink-0">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
            ${statusText}
          </span>
        </div>
        <div class="flex-1">
          <p class="text-sm text-gray-900">${decision.description}</p>
          <p class="text-xs text-gray-500 mt-1">
            Criada em ${new Date(decision.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
    `
  }

  getStatusClass(status) {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  getStatusText(status) {
    switch (status) {
      case 'pending': return 'Pendente'
      case 'approved': return 'Aprovada'
      case 'rejected': return 'Rejeitada'
      default: return status
    }
  }

  getMeetingId() {
    // Extrair o ID da reunião da URL atual
    const urlParts = window.location.pathname.split('/')
    return urlParts[urlParts.indexOf('meetings') + 1]
  }

  showToast(message, type) {
    // Usar o controller toast se disponível
    if (this.application.controllers.find(controller => controller.identifier === "toast")) {
      const toastController = this.application.controllers.find(controller => controller.identifier === "toast")
      if (type === "success") {
        toastController.success(message)
      } else {
        toastController.error(message)
      }
    } else {
      // Fallback para alert
      alert(message)
    }
  }
}
