class AddCheckToAgendas < ActiveRecord::Migration[8.0]
  def change
    add_column :agendas, :check, :boolean, default: false
  end
end
