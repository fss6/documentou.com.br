import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    // Verificar se Flatpickr está disponível globalmente
    if (typeof flatpickr !== 'undefined') {
      this.initializeFlatpickr()
    } else {
      // Aguardar um pouco e tentar novamente
      setTimeout(() => this.initializeFlatpickr(), 100)
    }
  }

  initializeFlatpickr() {
    if (typeof flatpickr === 'undefined') {
      console.error("Flatpickr não está disponível")
      return
    }

    // Configurações para português brasileiro
    const config = {
      enableTime: true,
      dateFormat: "Y-m-d H:i", // Formato que o Rails pode parsear
      time_24hr: true,
      locale: {
        firstDayOfWeek: 1,
        weekdays: {
          shorthand: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
          longhand: ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]
        },
        months: {
          shorthand: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
          longhand: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
        },
        rangeSeparator: " até ",
        weekAbbreviation: "Sem",
        amPM: ["AM", "PM"],
        yearAriaLabel: "Ano",
        monthAriaLabel: "Mês",
        hourAriaLabel: "Hora",
        minuteAriaLabel: "Minuto"
      },
      allowInput: true,
      clickOpens: true,
      minuteIncrement: 15,
      placeholder: "Selecione data e hora"
    }

    this.flatpickr = flatpickr(this.element, config)
  }

  disconnect() {
    if (this.flatpickr) {
      this.flatpickr.destroy()
    }
  }
}
