import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["step"]
  static values = {
    currentStep: String,
    meetingId: Number
  }

  connect() {}

  navigateToStep(event) {
    const step = event.currentTarget.dataset.step
    const meetingId = this.meetingIdValue
    
    if (step === this.currentStepValue) {
      return // Já estamos neste passo
    }

    // Navegar para o passo selecionado
    const url = `/meetings/${meetingId}/edit?step=${step}`
    window.location.href = url
  }

  // Método para verificar se um passo pode ser acessado
  canNavigateToStep(step) {
    const stepOrder = ['meeting', 'content', 'agenda']
    const currentIndex = stepOrder.indexOf(this.currentStepValue)
    const targetIndex = stepOrder.indexOf(step)
    
    // Pode navegar para passos anteriores ou o atual
    return targetIndex <= currentIndex
  }
}
