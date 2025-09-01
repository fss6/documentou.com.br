class Content < ApplicationRecord
  belongs_to :meeting
  
  validates :meeting, presence: true
end
