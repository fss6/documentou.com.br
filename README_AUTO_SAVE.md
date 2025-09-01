# Sistema de Auto-Save com Stimulus

## 🎯 **Funcionalidades Implementadas**

### **1. Auto-Save Automático**
- **Debounce de 2 segundos**: Salva automaticamente após o usuário parar de digitar
- **Indicador visual**: Mostra status em tempo real (Digitando, Salvando, Salvo, Erro)
- **Salvamento inteligente**: Só salva quando há mudanças reais

### **2. Sincronização Entre Abas**
- **BroadcastChannel API**: Comunicação em tempo real entre abas abertas
- **Detecção de conflitos**: Notifica quando conteúdo é atualizado em outra aba
- **Sessão única**: Cada aba tem um ID único para evitar loops

### **3. Tratamento de Offline**
- **Detecção de conectividade**: Monitora status online/offline
- **Salvamento local**: Armazena conteúdo no localStorage quando offline
- **Retry automático**: Tenta salvar automaticamente quando volta online
- **Fila de retry**: Mantém histórico de tentativas de salvamento

## 🔧 **Como Funciona**

### **Controller Stimulus: `auto_save_controller.js`**

```javascript
// Configuração básica
data-controller="auto-save quill"
data-auto-save-url-value="/meetings/1/update_content"
data-auto-save-field-value="summary"
data-auto-save-meeting-id-value="1"
data-auto-save-debounce-ms-value="2000"
```

### **Fluxo de Funcionamento**

1. **Usuário digita** → Status: "✏️ Digitando..."
2. **Para de digitar** → Aguarda 2 segundos
3. **Tenta salvar** → Status: "💾 Salvando..."
4. **Sucesso** → Status: "✅ Salvo" + Broadcast para outras abas
5. **Erro/Offline** → Status: "❌ Erro" ou "📱 Offline" + Salva localmente

## 📱 **Tratamento de Offline**

### **Quando Offline:**
- Conteúdo é salvo no localStorage
- Status mostra "📱 Offline - Salvando localmente"
- Fila de retry é criada

### **Quando Volta Online:**
- Detecta reconexão automaticamente
- Status muda para "🔄 Tentando salvar..."
- Processa fila de retry
- Tenta salvar até 3 vezes por item

## 🔄 **Sincronização Entre Abas**

### **BroadcastChannel API**
```javascript
// Canal único por reunião
new BroadcastChannel(`meeting_content_${meetingId}`)

// Mensagem enviada
{
  type: 'content_updated',
  field: 'summary',
  content: '<p>Conteúdo...</p>',
  source: 'abc123',
  timestamp: 1234567890
}
```

### **Detecção de Conflitos**
- Cada aba tem um ID único de sessão
- Ignora mensagens da própria aba
- Notifica usuário sobre conflitos
- Sugere recarregar para sincronizar

## 🎨 **Indicadores Visuais**

### **Status de Salvamento**
- **✏️ Digitando...** - Usuário está editando
- **💾 Salvando...** - Salvando no servidor
- **✅ Salvo** - Conteúdo salvo com sucesso
- **❌ Erro ao salvar** - Falha no salvamento
- **📱 Offline - Salvando localmente** - Conectividade perdida
- **🔄 Tentando salvar...** - Retry automático

### **Notificações de Conflito**
- **Posição**: Canto superior direito
- **Estilo**: Amarelo com ícone de aviso
- **Ação**: Botão para fechar
- **Auto-remoção**: Após 10 segundos

## 🚀 **Configuração**

### **1. Adicionar Controller**
```erb
<div data-controller="auto-save quill" 
     data-auto-save-url-value="<%= update_content_meeting_path(@meeting) %>"
     data-auto-save-field-value="summary"
     data-auto-save-meeting-id-value="<%= @meeting.id %>">
```

### **2. Configurar Targets**
```erb
<input type="hidden" data-auto-save-target="input">
<div data-auto-save-target="editor"></div>
<div data-auto-save-target="status">✅ Salvo</div>
```

### **3. Configurar Rota**
```ruby
# config/routes.rb
resources :meetings do
  member do
    patch :update_content
  end
end
```

### **4. Configurar Controller**
```ruby
# app/controllers/meetings_controller.rb
def update_content
  if @meeting.content.update(content_params)
    render json: { success: true, message: 'Conteúdo atualizado com sucesso!' }
  else
    render json: { success: false, message: @meeting.content.errors.full_messages.join(', ') }, status: :unprocessable_entity
  end
end

private

def content_params
  params.require(:content).permit(:introduction, :summary, :closing)
end
```

## 🔒 **Segurança**

### **CSRF Protection**
- Token CSRF incluído em todas as requisições
- Validação automática pelo Rails

### **Validação de Parâmetros**
- Apenas campos permitidos são aceitos
- Sanitização automática de HTML

## 📊 **Monitoramento**

### **Logs de Debug**
- Console mostra erros de salvamento
- Timestamps para debugging
- Contagem de tentativas de retry

### **Métricas**
- Tempo de resposta do servidor
- Taxa de sucesso de salvamento
- Frequência de conflitos entre abas

## 🚨 **Limitações e Considerações**

### **Browser Support**
- **BroadcastChannel**: Chrome 54+, Firefox 38+, Safari 15.4+
- **localStorage**: Todos os browsers modernos
- **Online/Offline Events**: Todos os browsers modernos

### **Performance**
- Debounce evita salvamentos excessivos
- localStorage tem limite de ~5-10MB
- BroadcastChannel é eficiente para comunicação local

### **Conflitos**
- Não resolve conflitos automaticamente
- Apenas notifica usuário
- Requer intervenção manual (recarregar)

## 🔮 **Melhorias Futuras**

### **Resolução de Conflitos**
- Merge automático de conteúdo
- Histórico de versões
- Comparação visual de diferenças

### **Sincronização em Tempo Real**
- WebSockets para atualizações instantâneas
- Indicador de usuários ativos
- Cursor compartilhado (opcional)

### **Backup e Recuperação**
- Backup automático na nuvem
- Histórico de mudanças
- Restauração de versões anteriores
