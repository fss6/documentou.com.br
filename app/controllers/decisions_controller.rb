class DecisionsController < ApplicationController
  before_action :set_meeting
  before_action :set_decision, only: [:update, :destroy]
  
  def create
    Rails.logger.info "🎯 DecisionsController#create iniciado"
    Rails.logger.info "📋 Params recebidos: #{params.inspect}"
    Rails.logger.info "🏢 Meeting ID: #{params[:meeting_id]}"
    Rails.logger.info "👤 Current User: #{current_user&.id}"
    
    @decision = @meeting.decisions.build(decision_params)
    Rails.logger.info "📝 Decision criada: #{@decision.inspect}"
    
    if @decision.save
      Rails.logger.info "✅ Decisão salva com sucesso! ID: #{@decision.id}"
      
      result = {
        decision: {
          id: @decision.id,
          description: @decision.description,
          status: @decision.status,
          created_at: @decision.created_at
        }
      }
      
      Rails.logger.info "📤 Retornando JSON: #{result.inspect}"
      render json: result, status: :created
    else
      Rails.logger.error "❌ Erro ao salvar decisão: #{@decision.errors.full_messages}"
      render json: { message: @decision.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end

  def update
    Rails.logger.info "✏️ DecisionsController#update iniciado"
    Rails.logger.info "📋 Decision ID: #{params[:id]}"
    
    if @decision.update(decision_params)
      Rails.logger.info "✅ Decisão atualizada com sucesso!"
      
      result = {
        decision: {
          id: @decision.id,
          description: @decision.description,
          status: @decision.status,
          created_at: @decision.created_at
        }
      }
      
      render json: result
    else
      Rails.logger.error "❌ Erro ao atualizar decisão: #{@decision.errors.full_messages}"
      render json: { message: @decision.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end

  def destroy
    Rails.logger.info "🗑️ DecisionsController#destroy iniciado"
    Rails.logger.info "📋 Decision ID: #{params[:id]}"
    
    @decision.destroy
    Rails.logger.info "✅ Decisão excluída com sucesso!"
    render json: { message: 'Decisão excluída com sucesso!' }
  end
  
  private
  
  def set_meeting
    Rails.logger.info "🔍 Buscando meeting com ID: #{params[:meeting_id]}"
    @meeting = Meeting.find(params[:meeting_id])
    Rails.logger.info "✅ Meeting encontrado: #{@meeting.inspect}"
  rescue ActiveRecord::RecordNotFound => e
    Rails.logger.error "❌ Meeting não encontrado: #{e.message}"
    render json: { message: 'Meeting não encontrado' }, status: :not_found
  end

  def set_decision
    Rails.logger.info "🔍 Buscando decision com ID: #{params[:id]}"
    @decision = @meeting.decisions.find(params[:id])
    Rails.logger.info "✅ Decision encontrada: #{@decision.inspect}"
  rescue ActiveRecord::RecordNotFound => e
    Rails.logger.error "❌ Decision não encontrada: #{e.message}"
    render json: { message: 'Decisão não encontrada' }, status: :not_found
  end
  
  def decision_params
    Rails.logger.info "🔒 Decision params permitidos: #{params.require(:decision).permit(:description, :status)}"
    params.require(:decision).permit(:description, :status)
  end
end
