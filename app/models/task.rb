class Task < ApplicationRecord
  belongs_to :owner
  belongs_to :meeting
end
