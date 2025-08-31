import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["container", "item"]
  static values = { 
    meetingId: Number,
    url: String
  }

  connect() {
    this.initializeSortable()
  }

  disconnect() {
    if (this.sortable) {
      this.sortable.destroy()
    }
  }

  initializeSortable() {
    if (typeof Sortable === 'undefined') {
      console.error('Sortable.js não está carregado')
      return
    }

    this.sortable = Sortable.create(this.containerTarget, {
      animation: 150,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      handle: '.drag-handle',
      onEnd: (evt) => {
        this.handleReorder(evt)
      }
    })
  }

  handleReorder(evt) {
    const oldIndex = evt.oldIndex
    const newIndex = evt.newIndex
    
    if (oldIndex === newIndex) return

    // Coletar as novas posições
    const items = Array.from(this.containerTarget.children)
    const positions = items.map((item, index) => {
      const agendaId = item.dataset.agendaId
      return { id: agendaId, position: index + 1 }
    })

    // Enviar para o servidor
    this.updatePositions(positions)
  }

  async updatePositions(positions) {
    try {
      const response = await fetch(this.urlValue || `/meetings/${this.meetingIdValue}/reorder_agendas`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
        },
        body: JSON.stringify({ positions })
      })

      if (response.ok) {
        const data = await response.json()
        this.showSuccess('Ordem atualizada com sucesso!')
        
        // Atualizar números dos itens
        this.updateItemNumbers()
      } else {
        const error = await response.json()
        this.showError('Erro ao reordenar: ' + (error.message || 'Erro desconhecido'))
        
        // Reverter a ordem em caso de erro
        this.revertOrder()
      }
    } catch (error) {
      console.error('Erro ao reordenar:', error)
      this.showError('Erro de conexão ao reordenar')
      this.revertOrder()
    }
  }

  updateItemNumbers() {
    const items = this.containerTarget.children
    Array.from(items).forEach((item, index) => {
      const numberElement = item.querySelector('.item-number')
      if (numberElement) {
        numberElement.textContent = index + 1
      }
    })
  }

  revertOrder() {
    // Recarregar a página para reverter a ordem
    window.location.reload()
  }

  showSuccess(message) {
    // Implementar notificação de sucesso
    this.showToast(message, 'success')
  }

  showError(message) {
    // Implementar notificação de erro
    this.showToast(message, 'error')
  }

  showToast(message, type = 'info') {
    // Buscar o controller toast global
    const toastController = this.application.getControllerForElementAndIdentifier(document.body, 'toast')
    if (toastController) {
      switch (type) {
        case 'success':
          toastController.success(message)
          break
        case 'error':
          toastController.error(message)
          break
        case 'warning':
          toastController.warning(message)
          break
        default:
          toastController.info(message)
      }
    } else {
      // Fallback para console se o toast não estiver disponível
      console.log(type === 'error' ? 'Erro:' : 'Sucesso:', message)
    }
  }
}
