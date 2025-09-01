class AgendasController < ApplicationController
  before_action :set_meeting
  before_action :set_agenda, only: [:update, :destroy, :toggle_check]

  def update
    if @agenda.update(agenda_params)
      render json: { success: true, message: 'Agenda atualizada com sucesso!' }
    else
      render json: { success: false, message: 'Erro ao atualizar agenda' }, status: :unprocessable_entity
    end
  end

  def destroy
    @agenda.destroy
    render json: { success: true, message: 'Agenda removida com sucesso!' }
  end

  def toggle_check
    if @agenda.update(check: params[:agenda][:check])
      render json: { 
        success: true, 
        message: 'Status atualizado com sucesso!',
        check: @agenda.check
      }
    else
      render json: { success: false, message: 'Erro ao atualizar status' }, status: :unprocessable_entity
    end
  end

  private

  def set_meeting
    @meeting = Meeting.find(params[:meeting_id])
  end

  def set_agenda
    @agenda = @meeting.agendas.find(params[:id])
  end

  def agenda_params
    params.require(:agenda).permit(:title, :description, :position, :check)
  end
end
