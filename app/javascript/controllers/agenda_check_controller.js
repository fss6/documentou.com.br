import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  toggleItem(event) {
    const checkbox = event.target
    const agendaId = checkbox.dataset.agendaId
    const isChecked = checkbox.checked
    
    // Aqui você pode implementar a lógica para salvar o status
    // Por exemplo, enviar uma requisição AJAX para marcar como discutido
    console.log(`Agenda ${agendaId} ${isChecked ? 'marcada' : 'desmarcada'}`)
    
    // Opcional: Adicionar classe visual para itens marcados
    const agendaItem = checkbox.closest('.border')
    if (isChecked) {
      agendaItem.classList.add('bg-blue-50', 'border-blue-300')
    } else {
      agendaItem.classList.remove('bg-blue-50', 'border-blue-300')
    }
  }
}
