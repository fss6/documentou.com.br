class HomepageController < ApplicationController
  def index
    # TODO: Deve ser as meetings do usuário logado ou as meetings da account?
    @total_meetings = Meeting.count
    @recent_meetings = Meeting.order(created_at: :desc).limit(5)
    @upcoming_meetings = Meeting.where('start_datetime > ?', Time.current).order(:start_datetime).limit(5)
  end
end
