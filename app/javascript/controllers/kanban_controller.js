import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["column", "taskCard"]
  static values = {
    updateStatusUrl: String
  }

  connect() {
    this.waitForSortable()
  }

  disconnect() {
    if (this.sortableInstances) {
      this.sortableInstances.forEach(instance => instance.destroy())
    }
  }

  waitForSortable() {
    if (typeof Sortable !== 'undefined') {
      this.initializeSortable()
    } else {
      setTimeout(() => this.waitForSortable(), 100)
    }
  }

  initializeSortable() {
    this.sortableInstances = []
    
    this.columnTargets.forEach(column => {
      try {
        const sortable = Sortable.create(column, {
          group: 'tasks',
          animation: 150,
          ghostClass: 'sortable-ghost',
          chosenClass: 'sortable-chosen',
          dragClass: 'sortable-drag',
          onEnd: (evt) => this.handleTaskMove(evt)
        })
        
        this.sortableInstances.push(sortable)
      } catch (error) {
        console.error('Erro ao inicializar Sortable para coluna:', error)
      }
    })
  }

  async handleTaskMove(evt) {
    const taskCard = evt.item
    const newStatus = evt.to.dataset.status
    const taskId = taskCard.dataset.taskId
    
    if (evt.from.dataset.status === newStatus) {
      return // Mesma coluna, apenas reordenação
    }

    try {
      const response = await fetch(`/tasks/${taskId}/update_status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        const data = await response.json()
        this.showSuccess(data.message)
        this.updateCounters()
      } else {
        const error = await response.json()
        this.showError('Erro ao atualizar status: ' + (error.message || 'Erro desconhecido'))
        this.revertMove(evt)
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      this.showError('Erro de conexão ao atualizar status')
      this.revertMove(evt)
    }
  }

  revertMove(evt) {
    // Reverter o movimento em caso de erro
    const originalColumn = evt.from
    const taskCard = evt.item
    
    originalColumn.appendChild(taskCard)
  }

  updateCounters() {
    console.log('Atualizando contadores...')
    this.columnTargets.forEach(column => {
      const status = column.dataset.status
      // Navegar para a div pai que contém o header com o contador
      const columnElement = column.closest('.kanban-column')
      
      // Procurar pelo contador correto baseado no status da coluna
      let counter
      if (status === 'pending') {
        counter = columnElement.querySelector('.bg-blue-500')
      } else if (status === 'in_progress') {
        counter = columnElement.querySelector('.bg-orange-400')
      } else if (status === 'completed') {
        counter = columnElement.querySelector('.bg-green-500')
      }
      
      if (counter) {
        const count = column.querySelectorAll('.task-card').length
        counter.textContent = count
        console.log(`Coluna ${status}: ${count} tarefas`)
      } else {
        console.warn(`Contador não encontrado para coluna ${status}`)
      }
    })
  }

  showSuccess(message) {
    this.showToast(message, 'success')
  }

  showError(message) {
    this.showToast(message, 'error')
  }

  showToast(message, type = 'info') {
    const toastController = this.application.getControllerForElementAndIdentifier(document.body, 'toast')
    if (toastController) {
      switch (type) {
        case 'success': toastController.success(message); break
        case 'error': toastController.error(message); break
        case 'warning': toastController.warning(message); break
        default: toastController.info(message)
      }
    } else {
      console.log(type === 'error' ? 'Erro:' : 'Sucesso:', message)
    }
  }
}
