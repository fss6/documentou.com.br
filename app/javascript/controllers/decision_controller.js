import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["description", "status", "list"]
  static values = { 
    meetingId: String
  }

  connect() {
    // Controller conectado
  }

  // Modal methods
  showAddModal() {
    const modal = document.getElementById('add-decision-modal')
    if (modal) {
      modal.classList.remove('hidden')
      
      // Focar no primeiro campo
      if (this.hasDescriptionTarget) {
        this.descriptionTarget.focus()
      }
    }
  }

  closeAddModal() {
    const modal = document.getElementById('add-decision-modal')
    if (modal) {
      modal.classList.add('hidden')
      this.resetForm()
    }
  }

  showEditModal(event) {
    const decisionId = event.currentTarget.dataset.decisionId
    
    // Abrir o modal específico desta decisão
    const modal = document.getElementById(`edit-decision-${decisionId}`)
    if (modal) {
      modal.classList.remove('hidden')
      
      // Focar no primeiro campo
      const descriptionField = modal.querySelector('textarea[name="decision[description]"]')
      if (descriptionField) {
        descriptionField.focus()
      }
    }
  }

  closeEditModal() {
    // Fechar todos os modais de edição
    document.querySelectorAll('[id^="edit-decision-"]').forEach(modal => {
      modal.classList.add('hidden')
    })
  }

  showDeleteModal(event) {
    const decisionId = event.currentTarget.dataset.decisionId
    
    // Abrir o modal específico desta decisão
    const modal = document.getElementById(`delete-decision-${decisionId}`)
    if (modal) {
      modal.classList.remove('hidden')
    }
  }

  closeDeleteModal() {
    // Fechar todos os modais de exclusão
    document.querySelectorAll('[id^="delete-decision-"]').forEach(modal => {
      modal.classList.add('hidden')
    })
  }

  stopPropagation(event) {
    event.stopPropagation()
  }

  // CRUD methods
  async createDecision(event) {
    event.preventDefault()
    
    const form = event.target
    const formData = new FormData(form)
    
    try {
      const response = await fetch(`/meetings/${this.meetingIdValue}/decisions`, {
        method: "POST",
        body: formData,
        headers: {
          "X-CSRF-Token": document.querySelector("[name='csrf-token']").content
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        
        // Adicionar à lista
        this.addDecisionToList(result.decision)
        
        // Mostrar mensagem de sucesso
        this.showToast("Decisão criada com sucesso!", "success")
        
        // Fechar modal
        this.closeAddModal()
      } else {
        const error = await response.json()
        this.showToast("Erro ao criar decisão: " + error.message, "error")
      }
    } catch (error) {
      this.showToast("Erro ao criar decisão", "error")
    }
  }

  async updateDecision(event) {
    event.preventDefault()
    
    const form = event.target
    const formData = new FormData(form)
    
    // O ID da decisão está na URL do formulário
    const decisionId = form.action.split('/').pop()
    
    try {
      const response = await fetch(`/meetings/${this.meetingIdValue}/decisions/${decisionId}`, {
        method: "PATCH",
        body: formData,
        headers: {
          "X-CSRF-Token": document.querySelector("[name='csrf-token']").content
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        this.updateDecisionInList(result.decision)
        this.showToast("Decisão atualizada com sucesso!", "success")
        this.closeEditModal()
      } else {
        const error = await response.json()
        this.showToast("Erro ao atualizar decisão: " + error.message, "error")
      }
    } catch (error) {
      this.showToast("Erro ao atualizar decisão", "error")
    }
  }

  async confirmDelete(event) {
    const decisionId = event.currentTarget.dataset.decisionId
    
    try {
      const response = await fetch(`/meetings/${this.meetingIdValue}/decisions/${decisionId}`, {
        method: "DELETE",
        headers: {
          "X-CSRF-Token": document.querySelector("[name='csrf-token']").content
        }
      })
      
      if (response.ok) {
        this.removeDecisionFromList(decisionId)
        this.showToast("Decisão excluída com sucesso!", "success")
        this.closeDeleteModal()
      } else {
        const error = await response.json()
        this.showToast("Erro ao excluir decisão: " + error.message, "error")
      }
    } catch (error) {
      this.showToast("Erro ao excluir decisão", "error")
    }
  }

  // List management methods
  addDecisionToList(decision) {
    const decisionHtml = this.createDecisionHtml(decision)
    
    if (this.hasListTarget) {
      this.listTarget.insertAdjacentHTML("afterbegin", decisionHtml)
      
      // Remover mensagem de "nenhuma decisão"
      const emptyMessage = this.listTarget.querySelector(".italic")
      if (emptyMessage) {
        emptyMessage.remove()
      }
    }
  }

  updateDecisionInList(decision) {
    const existingElement = this.listTarget.querySelector(`[data-decision-id="${decision.id}"]`)
    if (existingElement) {
      const newHtml = this.createDecisionHtml(decision)
      existingElement.outerHTML = newHtml
    }
  }

  removeDecisionFromList(decisionId) {
    const element = this.listTarget.querySelector(`[data-decision-id="${decisionId}"]`)
    if (element) {
      element.remove()
      
      // Mostrar mensagem se não houver mais decisões
      if (this.listTarget.children.length === 0) {
        this.listTarget.innerHTML = '<p class="text-sm text-gray-500 italic text-center py-8">Nenhuma decisão foi registrada ainda.</p>'
      }
    }
  }

  createDecisionHtml(decision) {
    const statusClass = this.getStatusClass(decision.status)
    const statusText = this.getStatusText(decision.status)
    
    // Formatar a data de criação corretamente
    let createdAtText = 'Data não disponível'
    if (decision.created_at) {
      try {
        const date = new Date(decision.created_at)
        if (!isNaN(date.getTime())) {
          createdAtText = date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        }
      } catch (e) {
        // Data inválida, usar texto padrão
      }
    }
    
    return `
      <div class="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg bg-gray-50" data-decision-id="${decision.id}">
        <div class="flex-1">
          <div class="flex items-center justify-between mb-2">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
              ${statusText}
            </span>
            <div class="flex items-center space-x-2">
              <p class="text-xs text-gray-500">
                Criada em ${createdAtText}
              </p>
              <!-- Menu de contexto -->
              <div class="relative" data-controller="dropdown">
                <button type="button" 
                        class="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors duration-200"
                        data-action="click->dropdown#toggle">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                  </svg>
                </button>
                <div class="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10" data-dropdown-target="menu">
                  <div class="py-1">
                    <button type="button" 
                            class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            data-action="click->decision#showEditModal"
                            data-decision-id="${decision.id}">
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                      Editar
                    </button>
                    <button type="button" 
                            class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                            data-action="click->decision#showDeleteModal"
                            data-decision-id="${decision.id}">
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p class="text-sm text-gray-900">${decision.description || 'Sem descrição'}</p>
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

  resetForm() {
    if (this.hasDescriptionTarget) {
      this.descriptionTarget.value = ''
    }
    
    if (this.hasStatusTarget) {
      this.statusTarget.value = 'pending'
    }
  }

  showToast(message, type) {
    // Usar o controller toast se disponível
    const toastController = this.application.controllers.find(controller => controller.identifier === "toast")
    if (toastController) {
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
