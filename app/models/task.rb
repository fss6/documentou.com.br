class Task < ApplicationRecord
  belongs_to :owner, class_name: 'User'
  belongs_to :meeting

  validates :description, presence: true
  validates :status, presence: true, inclusion: { in: %w[pending in_progress completed] }
  validates :deadline, presence: true

  scope :by_status, ->(status) { where(status: status) }
  scope :owned_by, ->(user) { where(owner: user) }

  STATUSES = {
    'pending' => 'TODO',
    'in_progress' => 'DOING',
    'completed' => 'DONE'
  }.freeze

  def status_display
    STATUSES[status] || status
  end

  def overdue?
    deadline.present? && deadline < Date.current && status != 'completed'
  end

  def urgent?
    # Uma tarefa é considerada urgente se estiver atrasada ou próxima do prazo (3 dias)
    overdue? || (deadline.present? && deadline <= Date.current + 3.days)
  end
end
