import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["modal", "submitButton", "description", "deadline", "list", "editDescription", "editDeadline", "editStatus"]
  static values = { 
    meetingId: String
  }

  connect() {
    // Controller conectado
  }

  // Modal methods
  showModal() {
    this.modalTarget.classList.remove('hidden')
    this.resetForm()
    
    // Focar no primeiro campo
    if (this.hasDescriptionTarget) {
      this.descriptionTarget.focus()
    }
  }

  closeModal() {
    this.modalTarget.classList.add('hidden')
    this.resetForm()
  }

  showEditModal(event) {
    const taskId = event.currentTarget.dataset.taskId
    const description = event.currentTarget.dataset.taskDescription
    const deadline = event.currentTarget.dataset.taskDeadline
    const status = event.currentTarget.dataset.taskStatus
    
    // Preencher o formulário de edição
    if (this.hasEditDescriptionTarget) {
      this.editDescriptionTarget.value = description
    }
    if (this.hasEditDeadlineTarget) {
      this.editDeadlineTarget.value = deadline
    }
    if (this.hasEditStatusTarget) {
      this.editStatusTarget.value = status
    }
    
    // Abrir o modal específico desta ação
    const modal = document.getElementById(`edit-task-${taskId}`)
    if (modal) {
      modal.classList.remove('hidden')
      
      // Focar no primeiro campo
      if (this.hasEditDescriptionTarget) {
        this.editDescriptionTarget.focus()
      }
    }
  }

  closeEditModal() {
    // Fechar todos os modais de edição
    document.querySelectorAll('[id^="edit-task-"]').forEach(modal => {
      modal.classList.add('hidden')
    })
  }

  showDeleteModal(event) {
    const taskId = event.currentTarget.dataset.taskId
    
    // Abrir o modal específico desta ação
    const modal = document.getElementById(`delete-task-${taskId}`)
    if (modal) {
      modal.classList.remove('hidden')
    }
  }

  closeDeleteModal() {
    // Fechar todos os modais de exclusão
    document.querySelectorAll('[id^="delete-task-"]').forEach(modal => {
      modal.classList.add('hidden')
    })
  }

  stopPropagation(event) {
    event.stopPropagation()
  }

  // CRUD methods
  async saveTask(event) {
    event.preventDefault()
    
    const form = event.target
    const formData = new FormData(form)
    
    try {
      const response = await fetch('/tasks.json', {
        method: "POST",
        body: formData,
        headers: {
          "X-CSRF-Token": document.querySelector("[name='csrf-token']").content
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        
        // Create new task
        this.addTaskToList(result.task)
        this.showToast("Ação criada com sucesso!", "success")
        this.closeModal()
      } else {
        const error = await response.json()
        this.showToast("Erro ao salvar ação: " + error.message, "error")
      }
    } catch (error) {
      this.showToast("Erro ao salvar ação", "error")
    }
  }

  async updateTask(event) {
    event.preventDefault()
    
    const form = event.target
    const formData = new FormData(form)
    
    // O ID da ação está na URL do formulário
    const taskId = form.action.split('/').pop()
    
    try {
      const response = await fetch(`/tasks/${taskId}.json`, {
        method: "PATCH",
        body: formData,
        headers: {
          "X-CSRF-Token": document.querySelector("[name='csrf-token']").content
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        this.showToast("Ação atualizada com sucesso!", "success")
        this.closeEditModal()
        // Recarregar a página para garantir que todos os modais funcionem
        window.location.reload()
      } else {
        const error = await response.json()
        this.showToast("Erro ao atualizar ação: " + error.message, "error")
      }
    } catch (error) {
      this.showToast("Erro ao atualizar ação", "error")
    }
  }

  async confirmDelete(event) {
    event.preventDefault()
    
    const taskId = event.currentTarget.dataset.taskId
    
    try {
      const response = await fetch(`/tasks/${taskId}.json`, {
        method: "DELETE",
        headers: {
          "X-CSRF-Token": document.querySelector("[name='csrf-token']").content
        }
      })
      
      if (response.ok) {
        this.showToast("Ação excluída com sucesso!", "success")
        this.closeDeleteModal()
        // Recarregar a página para garantir que todos os modais funcionem
        window.location.reload()
      } else {
        const error = await response.json()
        this.showToast("Erro ao excluir ação: " + error.message, "error")
      }
    } catch (error) {
      this.showToast("Erro ao excluir ação", "error")
    }
  }

  // List management methods
  addTaskToList(task) {
    // Recarregar a página para garantir que todos os modais sejam criados corretamente
    window.location.reload()
  }

  resetForm() {
    if (this.hasDescriptionTarget) {
      this.descriptionTarget.value = ''
    }
    if (this.hasDeadlineTarget) {
      this.deadlineTarget.value = ''
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
