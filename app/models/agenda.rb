class Agenda < ApplicationRecord
  belongs_to :meeting

  def checked?
    check
  end
end
