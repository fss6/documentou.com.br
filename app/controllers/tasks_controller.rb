class TasksController < ApplicationController
  before_action :set_task, only: %i[show edit update destroy update_status]

  # GET /tasks
  def index
    @tasks = current_user.tasks.includes(:meeting).order(:deadline)
    @kanban_columns = {
      'pending' => @tasks.by_status('pending'),
      'in_progress' => @tasks.by_status('in_progress'),
      'completed' => @tasks.by_status('completed')
    }
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

    if @task.save
      redirect_to tasks_path, notice: 'Tarefa criada com sucesso!'
    else
      @meetings = current_user.meetings
      render :new, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /tasks/1
  def update
    if @task.update(task_params)
      redirect_to tasks_path, notice: 'Tarefa atualizada com sucesso!'
    else
      @meetings = current_user.meetings
      render :edit, status: :unprocessable_entity
    end
  end

  # DELETE /tasks/1
  def destroy
    @task.destroy
    redirect_to tasks_path, notice: 'Tarefa excluída com sucesso!'
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
    params.require(:task).permit(:description, :deadline, :meeting_id, :status)
  end
end
