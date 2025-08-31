class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable

  belongs_to :account
  has_many :meetings, foreign_key: :creator_id
  has_many :tasks, foreign_key: :owner_id
  
  validates :email, presence: true, uniqueness: { scope: :account_id }
  validates :name, presence: true
  

   # Custom Devise warden conditions
   def self.find_for_database_authentication(warden_conditions)
    where(warden_conditions).where(active: true).joins(:account).where(accounts: {active: true}).first
  end

  private

  def password_required?
    new_record? || password.present? || password_confirmation.present?
  end
end
