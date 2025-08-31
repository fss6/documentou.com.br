import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["item", "title", "description", "saveButton", "deleteButton", "modal"]
  static values = { 
    meetingId: Number
  }

  connect() {
    this.itemCount = this.itemTargets.length
    this.itemToDelete = null
  }

  addItem() {
    this.itemCount++
    const newItem = this.createItemElement()
    this.element.querySelector('#agenda-items').appendChild(newItem)
  }

  confirmDelete(event) {
    const button = event.currentTarget
    const item = button.closest('.agenda-item')
    const agendaId = item.dataset.agendaAgendaIdValue
    
    // Se não tem ID, deletar diretamente sem modal
    if (!agendaId) {
      item.remove()
      this.renumberItems()
      return
    }
    
    const agendaTitle = button.dataset.agendaAgendaTitleValue || 'este tópico'
    
    // Armazenar o item para deletar
    this.itemToDelete = item
    
    // Mostrar o título no modal
    document.getElementById('agenda-title').textContent = agendaTitle
    
    // Mostrar o modal
    this.modalTarget.classList.remove('hidden')
  }

  cancelDelete() {
    this.modalTarget.classList.add('hidden')
    this.itemToDelete = null
  }

  deleteItem() {
    if (!this.itemToDelete) return
    
    const agendaId = this.itemToDelete.dataset.agendaAgendaIdValue
    const itemToRemove = this.itemToDelete // Guardar referência antes de limpar
    
    // Esconder o modal primeiro
    this.modalTarget.classList.add('hidden')
    this.itemToDelete = null
    
    if (agendaId) {
      // Se tem ID, deletar via AJAX
      this.deleteAgendaItem(agendaId, itemToRemove)
    } else {
      // Se não tem ID, apenas remover do DOM
      itemToRemove.remove()
      this.renumberItems()
    }
  }

  deleteAgendaItem(agendaId, itemToRemove) {
    const data = {
      meeting: {
        agendas_attributes: [{
          id: agendaId,
          _destroy: '1'
        }]
      },
      step: 'agenda',
      ajax: true
    }
    
    fetch(`/meetings/${this.meetingIdValue}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(data)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    })
    .then(data => {
      if (data.success) {
        // Remover o item do DOM
        itemToRemove.remove()
        this.renumberItems()
        this.showToast('Item excluído com sucesso!', 'success')
      } else {
        this.showToast('Erro ao excluir: ' + (data.error || 'Erro desconhecido'), 'error')
      }
    })
    .catch(error => {
      console.error('Erro:', error)
      this.showToast('Erro ao excluir o item da agenda', 'error')
    })
  }

  saveItem(event) {
    const button = event.currentTarget
    const item = button.closest('.agenda-item')
    const titleInput = item.querySelector('input[name="title"]')
    const descInput = item.querySelector('textarea[name="description"]')
    
    const title = titleInput.value.trim()
    const description = descInput.value.trim()
    
    if (!title) {
      this.showToast('Por favor, preencha o título do tópico', 'error')
      titleInput.focus()
      return
    }
    
    // Pegar o ID do item específico
    const agendaId = item.dataset.agendaAgendaIdValue || null
    
    // Preparar dados para enviar
    const data = {
      meeting: {
        agendas_attributes: [{
          id: agendaId,
          title: title,
          description: description,
          position: 1
        }]
      },
      step: 'agenda',
      ajax: true
    }
    
    // Enviar requisição AJAX para a rota de update
    fetch(`/meetings/${this.meetingIdValue}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(data)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    })
    .then(data => {
      if (data.success) {
        // Mostrar feedback visual
        button.classList.add('text-green-700')
        setTimeout(() => {
          button.classList.remove('text-green-700')
        }, 1000)
        
        // Se for novo item, atualizar o ID
        if (!agendaId && data.agenda_id) {
          item.dataset.agendaAgendaIdValue = data.agenda_id
        }
        
        // Mostrar toast de sucesso
        this.showToast('Item salvo com sucesso!', 'success')
      } else {
        this.showToast('Erro ao salvar: ' + (data.error || 'Erro desconhecido'), 'error')
      }
    })
    .catch(error => {
      console.error('Erro:', error)
      this.showToast('Erro ao salvar o item da agenda', 'error')
    })
  }

  createItemElement() {
    const div = document.createElement('div')
    div.className = 'agenda-item border border-gray-200 rounded-md p-4'
    div.setAttribute('data-agenda-target', 'item')
    div.innerHTML = `
      <div class="space-y-3">
        <!-- Header with drag handle, number, title and action buttons -->
        <div class="flex items-start justify-between">
          <!-- Left side: Drag handle and number -->
          <div class="flex items-center space-x-3">
            <!-- Drag Handle -->
            <div class="flex-shrink-0 drag-handle cursor-pointer" title="Arrastar para reordenar">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path>
              </svg>
            </div>
            
            <!-- Number Badge -->
            <div class="flex-shrink-0">
              <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span class="text-xs font-medium text-blue-600 item-number">${this.itemCount}</span>
              </div>
            </div>
          </div>
          
          <!-- Right side: Action buttons -->
          <div class="flex space-x-2">
            <button type="button" class="text-green-600 hover:text-green-700 p-1 cursor-pointer" data-action="click->agenda#saveItem" title="Salvar item">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12" />
              </svg>
            </button>
            <button type="button" class="text-red-500 hover:text-red-700 p-1 cursor-pointer" data-action="click->agenda#confirmDelete" title="Remover item">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Title Input -->
        <div>
          <input type="text" name="title" placeholder="Título do tópico" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
        </div>
        
        <!-- Description -->
        <div>
          <textarea name="description" placeholder="Descrição do tópico (opcional)" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
          <input type="hidden" name="position" value="${this.itemCount}">
        </div>
        
        <input type="hidden" name="_destroy" value="0">
      </div>
    `
    return div
  }

  renumberItems() {
    const visibleItems = this.element.querySelectorAll('.agenda-item:not([style*="display: none"])')
    visibleItems.forEach((item, index) => {
      const number = item.querySelector('.text-blue-600')
      if (number) {
        number.textContent = index + 1
      }
    })
    this.itemCount = visibleItems.length
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
      // Fallback para alert se o toast não estiver disponível
      alert(message)
    }
  }
}
