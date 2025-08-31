class Meeting < ApplicationRecord
  belongs_to :creator, class_name: "User"
  has_one :content, dependent: :destroy
  has_many :agendas, dependent: :destroy
  
  accepts_nested_attributes_for :content
  accepts_nested_attributes_for :agendas, allow_destroy: true, reject_if: :all_blank
  
  # Validações
  validates :title, presence: true
  validates :start_datetime, presence: true
  validates :end_datetime, presence: true
  validate :end_datetime_after_start_datetime
  
  # Parsear datas no formato do Flatpickr
  def start_datetime=(value)
    if value.is_a?(String) && value.present?
      begin
        # Tentar parsear no formato Y-m-d H:i
        parsed_time = Time.strptime(value, "%Y-%m-%d %H:%M")
        super(parsed_time)
      rescue ArgumentError
        # Se falhar, tentar parsear normalmente
        super(value)
      end
    else
      super(value)
    end
  end
  
  def end_datetime=(value)
    if value.is_a?(String) && value.present?
      begin
        # Tentar parsear no formato Y-m-d H:i
        parsed_time = Time.strptime(value, "%Y-%m-%d %H:%M")
        super(parsed_time)
      rescue ArgumentError
        # Se falhar, tentar parsear normalmente
        super(value)
      end
    else
      super(value)
    end
  end
  
  private
  
  def end_datetime_after_start_datetime
    return if end_datetime.blank? || start_datetime.blank?
    
    if end_datetime <= start_datetime
      errors.add(:end_datetime, "deve ser posterior à data de início")
    end
  end
end
