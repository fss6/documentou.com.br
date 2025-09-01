import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["editor", "input"]
  static values = { 
    placeholder: String,
    rows: Number // Apenas rows para altura
  }

  connect() {
    this.initializeQuill()
  }

  disconnect() {
    // Limpeza segura do Quill
    if (this.quill) {
      try {
        // Tentar usar o método destroy se existir
        if (typeof this.quill.destroy === 'function') {
          this.quill.destroy()
        } else {
          // Limpeza manual se destroy não existir
          this.quill.off('text-change')
          this.quill = null
        }
      } catch (error) {
        console.warn('Erro ao desconectar Quill:', error)
        // Limpeza de emergência
        this.quill = null
      }
    }
  }

  initializeQuill() {
    // Verificar se o Quill está disponível globalmente
    if (typeof Quill === 'undefined') {
      console.error('Quill não está carregado')
      this.fallbackToTextarea()
      return
    }

    try {
      // Configuração do Quill
      const options = {
        theme: 'snow',
        placeholder: this.placeholderValue || 'Digite aqui...',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['link', 'blockquote', 'code-block'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }]
          ]
        },
        formats: ['bold', 'italic', 'underline', 'strike', 'link', 'blockquote', 'code-block', 'list', 'bullet']
      }

      // Inicializar Quill
      this.quill = new Quill(this.editorTarget, options)

      // Definir altura baseada em rows
      if (this.rowsValue) {
        this.setHeightFromRows(this.rowsValue)
      }

      // Sincronizar com o input hidden
      this.quill.on('text-change', () => {
        this.updateInput()
        // Disparar evento input no input hidden para integrar com content-form
        const event = new Event('input', { bubbles: true })
        this.inputTarget.dispatchEvent(event)
      })

      // Carregar conteúdo inicial se existir
      if (this.inputTarget.value) {
        this.quill.root.innerHTML = this.inputTarget.value
      }
    } catch (error) {
      console.error('Erro ao inicializar Quill:', error)
      this.fallbackToTextarea()
    }
  }

  updateInput() {
    // Converter para HTML simples
    const html = this.quill.root.innerHTML
    this.inputTarget.value = html === '<p><br></p>' ? '' : html
  }

  // Método para definir altura baseada em linhas (similar ao textarea)
  setHeightFromRows(rows) {
    if (this.quill && this.quill.root) {
      // Cada linha = aproximadamente 20-24px (incluindo line-height)
      // Usando 22px por linha (padrão do textarea)
      const lineHeight = 22
      const heightInPx = rows * lineHeight
      this.quill.root.style.minHeight = `${heightInPx}px`
      this.quill.root.style.height = `${heightInPx}px`
    }
  }

  fallbackToTextarea() {
    // Criar um textarea simples como fallback
    const textarea = document.createElement('textarea')
    textarea.className = 'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
    
    // Aplicar rows se especificado
    if (this.rowsValue) {
      textarea.rows = this.rowsValue
    } else {
      textarea.rows = 6 // padrão
    }
    
    textarea.placeholder = this.placeholderValue || 'Digite aqui...'
    textarea.value = this.inputTarget.value || ''
    
    // Substituir o editor
    this.editorTarget.innerHTML = ''
    this.editorTarget.appendChild(textarea)
    
    // Sincronizar com o input hidden
    textarea.addEventListener('input', () => {
      this.inputTarget.value = textarea.value
    })
  }

  // Método para limpar o editor
  clear() {
    if (this.quill) {
      this.quill.setText('')
    }
  }

  // Método para definir conteúdo
  setContent(html) {
    if (this.quill) {
      this.quill.root.innerHTML = html
      this.updateInput()
    }
  }
}
