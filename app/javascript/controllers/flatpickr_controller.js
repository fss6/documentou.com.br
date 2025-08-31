import { Controller } from "@hotwired/stimulus"
import flatpickr from "flatpickr"

export default class extends Controller {
  connect() {
    // Configurações para português brasileiro
    const config = {
      enableTime: true,
      dateFormat: "d/m/Y H:i", // Formato brasileiro para exibição
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
      minuteIncrement: 1,
      placeholder: "Selecione data e hora",
      // Não usar onChange para não interferir na exibição
      // O Rails vai parsear o formato brasileiro automaticamente
    }

    this.flatpickr = flatpickr(this.element, config)
  }

  disconnect() {
    if (this.flatpickr) {
      this.flatpickr.destroy()
    }
  }
}
