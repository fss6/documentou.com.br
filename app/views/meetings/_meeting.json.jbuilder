json.extract! meeting, :id, :title, :description, :start_datetime, :end_datetime, :location, :user_id, :created_at, :updated_at
json.url meeting_url(meeting, format: :json)
