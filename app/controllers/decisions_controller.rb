class DecisionsController < ApplicationController
  before_action :set_meeting
  
  def create
    @decision = @meeting.decisions.build(decision_params)
    
    if @decision.save
      render json: {
        id: @decision.id,
        description: @decision.description,
        status: @decision.status,
        created_at: @decision.created_at
      }, status: :created
    else
      render json: { message: @decision.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end
  
  private
  
  def set_meeting
    @meeting = Meeting.find(params[:meeting_id])
  end
  
  def decision_params
    params.require(:decision).permit(:description, :status)
  end
end
