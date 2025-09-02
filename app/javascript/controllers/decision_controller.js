import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["description", "status"]
  static values = { 
    meetingId: String
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
        this.showToast("Decisão atualizada com sucesso!", "success")
        this.closeEditModal()
        window.location.reload()
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
        this.showToast("Decisão excluída com sucesso!", "success")
        this.closeDeleteModal()
        window.location.reload()
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
    window.location.reload()
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
