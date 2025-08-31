class CreateTasks < ActiveRecord::Migration[8.0]
  def change
    create_table :tasks do |t|
      t.text :description
      t.references :owner, null: false, foreign_key: { to_table: :users }
      t.date :deadline
      t.references :meeting, null: false, foreign_key: true
      t.string :status

      t.timestamps
    end
  end
end
