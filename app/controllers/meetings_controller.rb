class MeetingsController < ApplicationController
  before_action :set_meeting, only: %i[ show edit update destroy reorder_agendas meeting_session start complete]

  # TODO add paginação com Pagy
  # GET /meetings or /meetings.json
  def index
    # TODO: apenas do usuário logado
    @meetings = current_user.meetings
    
    # Busca por título, descrição ou localização
    if params[:search].present?
      search_term = "%#{params[:search].downcase}%"
      @meetings = @meetings.where(
        "LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(location) LIKE ?",
        search_term, search_term, search_term
      )
    end
    
    # Ordenação
    @meetings = @meetings.order(created_at: :desc)
  end

  # GET /meetings/1 or /meetings/1.json
  def show
  end

  # GET /meetings/new
  def new
    @meeting = Meeting.new
    @step = 'meeting'
  end

  # GET /meetings/1/edit
  def edit
    @step = params[:step] || 'meeting'
    
    if @step == 'content'
      @content = @meeting.content || @meeting.build_content
    elsif @step == 'agenda'
      @agendas = @meeting.agendas
    end
  end

  # POST /meetings or /meetings.json
  def create
    @meeting = current_user.meetings.new(meeting_params)
    @step = params[:step] || 'meeting'
    
    respond_to do |format|
      if @meeting.save
        # Criar content e agenda vazios automaticamente
        @meeting.create_content
        @meeting.agendas.create(title: "Tópico 1", position: 1)
        
        format.html { redirect_to edit_meeting_path(@meeting, step: 'content'), notice: "Reunião criada! Agora vamos definir o conteúdo." }
        format.json { render :show, status: :created, location: @meeting }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @meeting.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /meetings/1 or /meetings/1.json
  def update
    # TODO: Precisamos setar um step default ou retornar no_content?
    @step = params[:step] || 'meeting'
    
    case @step
    when 'meeting'
      update_meeting_step
    when 'content'
      update_content_step
    when 'agenda'
      update_agenda_step
    else
      update_meeting_step
    end
  end

  # DELETE /meetings/1 or /meetings/1.json
  def destroy
    @meeting.destroy!

    respond_to do |format|
      format.html { redirect_to meetings_path, notice: "Meeting was successfully destroyed.", status: :see_other }
      format.json { head :no_content }
    end
  end

  # PATCH /meetings/1/start
  def start
    if @meeting.can_start?
      @meeting.start_meeting!
      redirect_to meeting_session_path(@meeting), notice: 'Reunião iniciada com sucesso!'
    else
      redirect_to @meeting, alert: 'Não é possível iniciar esta reunião.'
    end
  end

  # GET /meetings/1/meeting_session
  def meeting_session
    # unless @meeting.in_progress?
    #   redirect_to @meeting, alert: 'Esta reunião não está em andamento.'
    #   return
    # end
    
    @content = @meeting.content || @meeting.build_content
    @agendas = @meeting.agendas.order(:position)
    @decisions = @meeting.decisions
  end

  # PATCH /meetings/1/complete
  def complete
    if @meeting.can_complete?
      @meeting.complete_meeting!
      redirect_to @meeting, notice: 'Reunião concluída com sucesso!'
    else
      redirect_to @meeting, alert: 'Não é possível concluir esta reunião.'
    end
  end

  # PATCH /meetings/1/update_content
  def update_content
    if @meeting.content.update(content_params)
      render json: { success: true, message: 'Conteúdo atualizado com sucesso!' }
    else
      render json: { success: false, message: @meeting.content.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end

  # PATCH /meetings/1/reorder_agendas
  def reorder_agendas
    positions = params[:positions]
    
    if positions.blank?
      render json: { success: false, message: 'Posições não fornecidas' }, status: :bad_request
      return
    end

    ActiveRecord::Base.transaction do
      positions.each do |position_data|
        agenda_id = position_data[:id]
        new_position = position_data[:position]
        
        agenda = @meeting.agendas.find(agenda_id)
        agenda.update!(position: new_position)
      end
    end


    agendas = @meeting.agendas.order(:position).map { |agenda| { id: agenda.id, title: agenda.title, position: agenda.position } }

    render json: { 
      success: true, 
      message: 'Agenda reordenada com sucesso!',
      agendas: agendas
    }
  rescue ActiveRecord::RecordNotFound => e
    render json: { success: false, message: 'Item da agenda não encontrado' }, status: :not_found
  rescue StandardError => e
    render json: { success: false, message: 'Erro ao reordenar agenda: ' + e.message }, status: :unprocessable_entity
  end

  private
  # Use callbacks to share common setup or constraints between actions.
  def set_meeting
    @meeting = Meeting.find(params[:id])
  end

  # Only allow a list of trusted parameters through.
  def meeting_params
    params.require(:meeting).permit(
      :title, :description, :start_datetime, :end_datetime, :location, :status,
      content_attributes: [:id, :introduction, :summary, :closing],
      agendas_attributes: [:id, :title, :description, :position, :_destroy]
    )
  end

  def content_params
    params.require(:content).permit(:summary, :closing)
  end

  def update_meeting_step
    respond_to do |format|
      if @meeting.update(meeting_params)
        format.html { redirect_to edit_meeting_path(@meeting, step: 'content'), notice: "Informações básicas salvas! Agora vamos definir o conteúdo." }
        format.json { render :show, status: :ok, location: @meeting }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @meeting.errors, status: :unprocessable_entity }
      end
    end
  end

  def update_content_step
    respond_to do |format|
      if @meeting.update(meeting_params)
        format.html { redirect_to edit_meeting_path(@meeting, step: 'agenda'), notice: "Conteúdo salvo! Agora vamos criar a agenda." }
        format.json { render :show, status: :ok, location: @meeting }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @meeting.errors, status: :unprocessable_entity }
      end
    end
  end

  def update_agenda_step
    if @meeting.update(meeting_params)
      agenda = @meeting.agendas.last
      render json: { success: true, agenda_id: agenda.id }
    else
      render json: { success: false, error: @meeting.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end
end
