class TasksController < ApplicationController
  before_action :set_task, only: %i[show edit update destroy update_status]

  # GET /tasks
  def index
    if params[:meeting_id]
      # Buscar tasks de uma reunião específica
      @meeting = Meeting.find(params[:meeting_id])
      @tasks = @meeting.tasks.includes(:owner).order(:deadline)
      
      respond_to do |format|
        format.json { 
          render json: {
            tasks: @tasks.map do |task|
              {
                id: task.id,
                description: task.description,
                status: task.status,
                deadline: task.deadline,
                owner_name: task.owner.name,
                created_at: task.created_at
              }
            end
          }
        }
      end
    else
      # Buscar todas as tasks do usuário (comportamento original)
      @tasks = current_user.tasks.includes(:meeting).order(:deadline)
      @kanban_columns = {
        'pending' => @tasks.by_status('pending'),
        'in_progress' => @tasks.by_status('in_progress'),
        'completed' => @tasks.by_status('completed')
      }
    end
  end

  # GET /tasks/1
  def show
  end

  # GET /tasks/new
  def new
    @task = current_user.tasks.new
    @meetings = current_user.meetings
  end

  # GET /tasks/1/edit
  def edit
    @meetings = current_user.meetings
  end

  # POST /tasks
  def create
    @task = current_user.tasks.new(task_params)
    @task.owner = current_user
    @task.status = :pending

    puts "===== TASK ERRORS ====="
    puts "valid? : #{@task.valid?}"
    puts "errors: #{@task.errors.full_messages}"
    puts "errors: #{@task.errors.full_messages.inspect}"
    puts @task.errors.full_messages.inspect

    if @task.save
      respond_to do |format|
        format.html { redirect_to tasks_path, notice: 'Tarefa criada com sucesso!' }
        format.json { 
          render json: {
            task: {
              id: @task.id,
              description: @task.description,
              status: @task.status,
              deadline: @task.deadline,
              owner_name: @task.owner.name,
              created_at: @task.created_at
            }
          }, status: :created 
        }
      end
    else
      respond_to do |format|
        format.html do
          @meetings = current_user.meetings
          render :new, status: :unprocessable_entity
        end
        format.json { render json: { message: @task.errors.full_messages.join(', ') }, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /tasks/1
  def update
    if @task.update(task_params)
      respond_to do |format|
        format.html { redirect_to tasks_path, notice: 'Tarefa atualizada com sucesso!' }
        format.json { 
          render json: {
            task: {
              id: @task.id,
              description: @task.description,
              status: @task.status,
              deadline: @task.deadline,
              owner_name: @task.owner.name,
              created_at: @task.created_at
            }
          }
        }
      end
    else
      respond_to do |format|
        format.html do
          @meetings = current_user.meetings
          render :edit, status: :unprocessable_entity
        end
        format.json { render json: { message: @task.errors.full_messages.join(', ') }, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /tasks/1
  def destroy
    @task.destroy
    respond_to do |format|
      format.html { redirect_to tasks_path, notice: 'Tarefa excluída com sucesso!' }
      format.json { render json: { message: 'Tarefa excluída com sucesso!' } }
    end
  end

  # PATCH /tasks/1/update_status
  def update_status
    new_status = params[:status]
    
    if Task::STATUSES.key?(new_status)
      @task.update(status: new_status)
      render json: { success: true, message: 'Status atualizado com sucesso!' }
    else
      render json: { success: false, message: 'Status inválido' }, status: :unprocessable_entity
    end
  end

  private

  def set_task
    @task = current_user.tasks.find(params[:id])
  end

  def task_params
    params.require(:task).permit(:description, :deadline, :meeting_id, :status, :owner_id)
  end
end
