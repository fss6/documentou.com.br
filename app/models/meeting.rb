class Meeting < ApplicationRecord
  belongs_to :creator, class_name: "User"
  has_one :content, dependent: :destroy
  has_many :agendas, dependent: :destroy
  has_many :decisions, dependent: :destroy
  has_many :tasks, dependent: :destroy
  
  accepts_nested_attributes_for :content
  accepts_nested_attributes_for :agendas, allow_destroy: true, reject_if: :all_blank
  
  # Status da reunião
  enum :status, {
    scheduled: 'scheduled',      # Agendada
    in_progress: 'in_progress',  # Em andamento
    completed: 'completed'       # Concluída
  }
  

  
  # Validações
  validates :title, presence: true
  validates :start_datetime, presence: true
  validates :end_datetime, presence: true
  validates :status, presence: true, inclusion: { in: statuses.keys }
  validate :end_datetime_after_start_datetime
  
  # Parsear datas no formato do Flatpickr
  def start_datetime=(value)
    if value.is_a?(String) && value.present?
      begin
        # Tentar parsear no formato brasileiro d/m/Y H:i
        if value.match?(/\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2}/)
          day, month, year, time = value.split(/[\/\s]/)
          hour, minute = time.split(':')
          parsed_time = Time.new(year.to_i, month.to_i, day.to_i, hour.to_i, minute.to_i)
          super(parsed_time)
        else
          # Tentar parsear no formato Y-m-d H:i
          parsed_time = Time.strptime(value, "%Y-%m-%d %H:%M")
          super(parsed_time)
        end
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
        # Tentar parsear no formato brasileiro d/m/Y H:i
        if value.match?(/\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2}/)
          day, month, year, time = value.split(/[\/\s]/)
          hour, minute = time.split(':')
          parsed_time = Time.new(year.to_i, month.to_i, day.to_i, hour.to_i, minute.to_i)
          super(parsed_time)
        else
          # Tentar parsear no formato Y-m-d H:i
          parsed_time = Time.strptime(value, "%Y-%m-%d %H:%M")
          super(parsed_time)
        end
      rescue ArgumentError
        # Se falhar, tentar parsear normalmente
        super(value)
      end
    else
      super(value)
    end
  end
  
  # Métodos para gerenciar status
  def start_meeting!
    update!(status: :in_progress)
  end
  
  def complete_meeting!
    update!(status: :completed)
  end
  
  def can_start?
    scheduled?
  end
  
  def can_complete?
    in_progress?
  end
  
  def status_display
    I18n.t("meetings.status.#{status}", default: status&.titleize)
  end
  
  private
  
  def end_datetime_after_start_datetime
    return if end_datetime.blank? || start_datetime.blank?
    
    if end_datetime <= start_datetime
      errors.add(:end_datetime, "deve ser posterior à data de início")
    end
  end
end
