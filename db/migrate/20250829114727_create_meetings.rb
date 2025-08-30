class CreateMeetings < ActiveRecord::Migration[8.0]
  def change
    create_table :meetings do |t|
      t.string :title
      t.text :description
      t.datetime :start_datetime
      t.datetime :end_datetime
      t.string :location
      t.references :creator, null: false, foreign_key: { to_table: :users }
      t.timestamps
    end
  end
end
