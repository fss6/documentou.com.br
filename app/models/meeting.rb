class Meeting < ApplicationRecord
  belongs_to :creator, class_name: "User"
  
  # Validações
  validates :title, presence: true
  validates :start_datetime, presence: true
  validates :end_datetime, presence: true
  validate :end_datetime_after_start_datetime
  
  private
  
  def end_datetime_after_start_datetime
    return if end_datetime.blank? || start_datetime.blank?
    
    if end_datetime <= start_datetime
      errors.add(:end_datetime, "deve ser posterior à data de início")
    end
  end
end
