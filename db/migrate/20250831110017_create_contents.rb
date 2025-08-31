class CreateContents < ActiveRecord::Migration[8.0]
  def change
    create_table :contents do |t|
      t.text :introduction, default: ""
      t.text :summary, default: ""
      t.text :closing, default: ""
      t.references :meeting, null: false, foreign_key: true

      t.timestamps
    end
  end
end
