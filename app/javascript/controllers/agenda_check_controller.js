import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["checkbox", "status"]
  static values = { 
    agendaId: String,
    meetingId: String
  }

  connect() {
    // Controller conectado
  }

  async toggleCheck() {
    const checkbox = this.checkboxTarget
    const isChecked = checkbox.checked
    
    try {
      this.showStatus('saving')
      
      const response = await fetch(`/meetings/${this.meetingIdValue}/agendas/${this.agendaIdValue}/toggle_check`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
        },
        body: JSON.stringify({
          agenda: { check: isChecked }
        })
      })

      if (response.ok) {
        this.showStatus('saved')
        this.updateVisualState(isChecked)
      } else {
        // Reverter checkbox se falhou
        checkbox.checked = !isChecked
        this.showStatus('error')
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('Erro ao atualizar checkbox:', error)
      this.showStatus('error')
      // Reverter checkbox em caso de erro
      checkbox.checked = !isChecked
    }
  }

  updateVisualState(isChecked) {
    const agendaItem = this.element.closest('.agenda-item')
    if (agendaItem) {
      if (isChecked) {
        agendaItem.classList.add('agenda-checked')
        agendaItem.classList.remove('agenda-unchecked')
      } else {
        agendaItem.classList.remove('agenda-checked')
        agendaItem.classList.add('agenda-unchecked')
      }
    }
  }

  showStatus(status) {
    if (!this.hasStatusTarget) return
    
    const statusMap = {
      saving: { text: 'Salvando...', class: 'text-yellow-600', icon: '💾' },
      saved: { text: 'Salvo', class: 'text-green-600', icon: '✅' },
      error: { text: 'Erro ao salvar', class: 'text-red-600', icon: '❌' }
    }
    
    const statusInfo = statusMap[status] || statusMap.saved
    this.statusTarget.innerHTML = `${statusInfo.icon} ${statusInfo.text}`
    this.statusTarget.className = `text-sm ${statusInfo.class}`
    
    // Limpar status após 3 segundos
    if (status === 'saved') {
      setTimeout(() => {
        this.statusTarget.innerHTML = ''
        this.statusTarget.className = ''
      }, 3000)
    }
  }
}
