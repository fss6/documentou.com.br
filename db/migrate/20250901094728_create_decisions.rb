class CreateDecisions < ActiveRecord::Migration[8.0]
  def change
    create_table :decisions do |t|
      t.text :description
      t.string :status

      t.timestamps
    end
  end
end
