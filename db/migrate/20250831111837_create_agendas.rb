class CreateAgendas < ActiveRecord::Migration[8.0]
  def change
    create_table :agendas do |t|
      t.string :title
      t.text :description
      t.integer :position
      t.references :meeting, null: false, foreign_key: true

      t.timestamps
    end
  end
end
