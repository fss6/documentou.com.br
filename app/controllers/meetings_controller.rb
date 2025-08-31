class MeetingsController < ApplicationController
  before_action :set_meeting, only: %i[ show edit update destroy ]

  # GET /meetings or /meetings.json
  def index
    @meetings = Meeting.all
  end

  # GET /meetings/1 or /meetings/1.json
  def show
  end

  # GET /meetings/new
  def new
    @meeting = Meeting.new
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

  private
  # Use callbacks to share common setup or constraints between actions.
  def set_meeting
    @meeting = Meeting.find(params.expect(:id))
  end

  # Only allow a list of trusted parameters through.
  def meeting_params
    params.require(:meeting).permit(
      :title, :description, :start_datetime, :end_datetime, :location, :creator_id,
      content_attributes: [:introduction, :summary, :closing],
      agendas_attributes: [:id, :title, :description, :position, :_destroy]
    )
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
