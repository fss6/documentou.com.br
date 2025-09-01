import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["editor", "input"]
  static values = { 
    placeholder: String
  }

  connect() {
    this.initializeEditor()
  }

  initializeEditor() {
    // Configurar placeholder
    if (!this.editorTarget.textContent.trim()) {
      this.editorTarget.textContent = this.placeholderValue || 'Digite aqui...'
      this.editorTarget.classList.add('placeholder')
    }

    // Event listeners
    this.editorTarget.addEventListener('focus', this.handleFocus.bind(this))
    this.editorTarget.addEventListener('blur', this.handleBlur.bind(this))
    this.editorTarget.addEventListener('input', this.handleInput.bind(this))
    this.editorTarget.addEventListener('paste', this.handlePaste.bind(this))

    // Carregar conteúdo inicial
    if (this.inputTarget.value) {
      this.editorTarget.innerHTML = this.inputTarget.value
      this.editorTarget.classList.remove('placeholder')
    }
  }

  handleFocus() {
    if (this.editorTarget.classList.contains('placeholder')) {
      this.editorTarget.textContent = ''
      this.editorTarget.classList.remove('placeholder')
    }
  }

  handleBlur() {
    if (!this.editorTarget.textContent.trim()) {
      this.editorTarget.textContent = this.placeholderValue || 'Digite aqui...'
      this.editorTarget.classList.add('placeholder')
    }
    this.updateInput()
  }

  handleInput() {
    this.updateInput()
  }

  handlePaste(event) {
    event.preventDefault()
    const text = event.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }

  updateInput() {
    const content = this.editorTarget.innerHTML
    this.inputTarget.value = content === `<p>${this.placeholderValue || 'Digite aqui...'}</p>` ? '' : content
  }

  // Métodos da toolbar
  formatText(command, value = null) {
    document.execCommand(command, false, value)
    this.editorTarget.focus()
    this.updateInput()
  }

  // Botões da toolbar
  bold() {
    this.formatText('bold')
  }

  italic() {
    this.formatText('italic')
  }

  underline() {
    this.formatText('underline')
  }

  strike() {
    this.formatText('strikeThrough')
  }

  link() {
    const url = prompt('Digite a URL:')
    if (url) {
      this.formatText('createLink', url)
    }
  }

  blockquote() {
    this.formatText('formatBlock', '<blockquote>')
  }

  code() {
    this.formatText('formatBlock', '<pre>')
  }

  list() {
    this.formatText('insertUnorderedList')
  }

  numberList() {
    this.formatText('insertOrderedList')
  }

  clear() {
    this.editorTarget.innerHTML = ''
    this.updateInput()
  }
}
