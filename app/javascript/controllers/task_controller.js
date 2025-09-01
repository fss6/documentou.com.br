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
      const response = await fetch("/tasks", {
        method: "POST",
        body: formData,
        headers: {
          "X-CSRF-Token": document.querySelector("[name='csrf-token']").content
        }
      })
      
      if (response.ok) {
        const task = await response.json()
        this.addTaskToList(task)
        this.hideForm()
        
        // Mostrar mensagem de sucesso
        this.showToast("Ação criada com sucesso!", "success")
      } else {
        const error = await response.json()
        this.showToast("Erro ao criar ação: " + error.message, "error")
      }
    } catch (error) {
      console.error("Erro:", error)
      this.showToast("Erro ao criar ação", "error")
    }
  }

  addTaskToList(task) {
    const taskHtml = this.createTaskHtml(task)
    this.listTarget.insertAdjacentHTML("afterbegin", taskHtml)
    
    // Remover mensagem de "nenhuma ação"
    const emptyMessage = this.listTarget.querySelector(".italic")
    if (emptyMessage) {
      emptyMessage.remove()
    }
  }

  createTaskHtml(task) {
    const statusClass = this.getStatusClass(task.status)
    const statusText = this.getStatusText(task.status)
    
    return `
      <div class="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div class="flex-shrink-0">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
            ${statusText}
          </span>
        </div>
        <div class="flex-1">
          <p class="text-sm text-gray-900">${task.description}</p>
          <div class="flex items-center justify-between mt-2">
            <p class="text-xs text-gray-500">
              Responsável: ${task.owner_name || 'Usuário'}
            </p>
            <p class="text-xs text-gray-500">
              Prazo: ${new Date(task.deadline).toLocaleDateString('pt-BR')}
            </p>
          </div>
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
      case 'pending': return 'TODO'
      case 'in_progress': return 'DOING'
      case 'completed': return 'DONE'
      default: return status
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
