import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["modal", "modalTitle", "submitButton", "taskId", "description", "deadline", "list"]
  static values = { 
    meetingId: String
  }

  connect() {
    console.log('🎯 Task controller conectado!')
    console.log('📋 Meeting ID:', this.meetingIdValue)
  }

  // Modal methods
  showModal() {
    this.resetForm()
    this.modalTitleTarget.textContent = "Nova Ação"
    this.submitButtonTarget.textContent = "Criar Ação"
    this.modalTarget.classList.remove('hidden')
    
    // Focar no primeiro campo
    if (this.hasDescriptionTarget) {
      this.descriptionTarget.focus()
    }
  }

  closeModal() {
    this.modalTarget.classList.add('hidden')
    this.resetForm()
  }

  stopPropagation(event) {
    event.stopPropagation()
  }

  // CRUD methods
  async saveTask(event) {
    event.preventDefault()
    
    const form = event.target
    const formData = new FormData(form)
    const taskId = this.taskIdTarget.value
    
    try {
      const url = taskId ? 
        `/tasks/${taskId}` : 
        `/tasks`
      
      const method = taskId ? "PATCH" : "POST"
      
      const response = await fetch(url, {
        method: method,
        body: formData,
        headers: {
          "X-CSRF-Token": document.querySelector("[name='csrf-token']").content
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        
        if (taskId) {
          // Update existing task
          this.updateTaskInList(result.task)
          this.showToast("Ação atualizada com sucesso!", "success")
        } else {
          // Create new task
          this.addTaskToList(result.task)
          this.showToast("Ação criada com sucesso!", "success")
        }
        
        this.closeModal()
      } else {
        const error = await response.json()
        this.showToast("Erro ao salvar ação: " + error.message, "error")
      }
    } catch (error) {
      console.error("❌ Erro:", error)
      this.showToast("Erro ao salvar ação", "error")
    }
  }

  editTask(event) {
    const taskId = event.currentTarget.dataset.taskId
    const description = event.currentTarget.dataset.taskDescription
    const deadline = event.currentTarget.dataset.taskDeadline
    
    // Preencher o formulário
    this.taskIdTarget.value = taskId
    this.descriptionTarget.value = description
    this.deadlineTarget.value = deadline
    
    // Atualizar modal
    this.modalTitleTarget.textContent = "Editar Ação"
    this.submitButtonTarget.textContent = "Atualizar Ação"
    
    // Mostrar modal
    this.modalTarget.classList.remove('hidden')
    
    // Focar no primeiro campo
    if (this.hasDescriptionTarget) {
      this.descriptionTarget.focus()
    }
  }

  async deleteTask(event) {
    const taskId = event.currentTarget.dataset.taskId
    
    if (!confirm("Tem certeza que deseja excluir esta ação?")) {
      return
    }
    
    try {
      const response = await fetch(`/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          "X-CSRF-Token": document.querySelector("[name='csrf-token']").content
        }
      })
      
      if (response.ok) {
        this.removeTaskFromList(taskId)
        this.showToast("Ação excluída com sucesso!", "success")
      } else {
        const error = await response.json()
        this.showToast("Erro ao excluir ação: " + error.message, "error")
      }
    } catch (error) {
      console.error("❌ Erro:", error)
      this.showToast("Erro ao excluir ação", "error")
    }
  }

  // List management methods
  addTaskToList(task) {
    const taskHtml = this.createTaskHtml(task)
    this.listTarget.insertAdjacentHTML("afterbegin", taskHtml)
    
    // Remover mensagem de "nenhuma ação"
    const emptyMessage = this.listTarget.querySelector(".italic")
    if (emptyMessage) {
      emptyMessage.remove()
    }
  }

  updateTaskInList(task) {
    const existingElement = this.listTarget.querySelector(`[data-task-id="${task.id}"]`)
    if (existingElement) {
      const newHtml = this.createTaskHtml(task)
      existingElement.outerHTML = newHtml
    }
  }

  removeTaskFromList(taskId) {
    const element = this.listTarget.querySelector(`[data-task-id="${taskId}"]`)
    if (element) {
      element.remove()
      
      // Mostrar mensagem se não houver mais ações
      if (this.listTarget.children.length === 0) {
        this.listTarget.innerHTML = '<p class="text-sm text-gray-500 italic text-center py-8">Nenhuma ação foi definida ainda.</p>'
      }
    }
  }

  createTaskHtml(task) {
    const statusClass = this.getStatusClass(task.status)
    const statusText = this.getStatusText(task.status)
    
    // Formatar a data corretamente
    let deadlineText = 'Não definido'
    if (task.deadline) {
      try {
        const date = new Date(task.deadline)
        if (!isNaN(date.getTime())) {
          deadlineText = date.toLocaleDateString('pt-BR')
        }
      } catch (e) {
        console.warn('Data inválida:', task.deadline)
      }
    }
    
    // Formatar o nome do responsável
    const ownerName = task.owner_name || 'Usuário'
    
    return `
      <div class="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg bg-gray-50" data-task-id="${task.id}">
        <div class="flex-1">
          <div class="flex items-center justify-between mb-2">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
              ${statusText}
            </span>
            <div class="flex items-center space-x-2">
              <div class="text-xs text-gray-500 text-right">
                <p>Responsável: ${ownerName}</p>
                <p>Prazo: ${deadlineText}</p>
              </div>
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
                            data-action="click->task#editTask"
                            data-task-id="${task.id}"
                            data-task-description="${task.description || ''}"
                            data-task-deadline="${task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : ''}">
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                      Editar
                    </button>
                    <button type="button" 
                            class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                            data-action="click->task#deleteTask"
                            data-task-id="${task.id}">
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
          <p class="text-sm text-gray-900">${task.description || 'Sem descrição'}</p>
        </div>
      </div>
    `
  }

  getStatusClass(status) {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  getStatusText(status) {
    switch (status) {
      case 'pending': return 'Pendente'
      case 'in_progress': return 'Em Andamento'
      case 'completed': return 'Concluída'
      default: return status
    }
  }

  resetForm() {
    this.taskIdTarget.value = ""
    if (this.hasDescriptionTarget) {
      this.descriptionTarget.value = ''
    }
    if (this.hasDeadlineTarget) {
      this.deadlineTarget.value = ''
    }
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
