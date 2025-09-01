class Decision < ApplicationRecord
  belongs_to :meeting
  
  validates :description, presence: true
  validates :status, presence: true
  
  enum :status, {
    pending: 'pending',      # Pendente
    approved: 'approved',    # Aprovada
    rejected: 'rejected'     # Rejeitada
  }
  
  def status_display
    I18n.t("decisions.status.#{status}", default: status&.titleize)
  end
end
