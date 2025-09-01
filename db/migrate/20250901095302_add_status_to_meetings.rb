class AddStatusToMeetings < ActiveRecord::Migration[8.0]
  def change
    add_column :meetings, :status, :string, default: "scheduled"
  end
end
