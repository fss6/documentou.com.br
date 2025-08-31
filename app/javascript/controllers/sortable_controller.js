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
    console.log('Sucesso:', message)
  }

  showError(message) {
    // Implementar notificação de erro
    console.error('Erro:', message)
  }
}
