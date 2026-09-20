module Identity
  class User < ApplicationRecord
    self.table_name = "identity_users"
    has_secure_password
    normalizes :email, with: ->(email) { email.strip.downcase }
    validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
    validates :name, length: { in: 2..40 }
    validates :password, length: { minimum: 12, maximum: 72 }, allow_nil: true
    validates :password_confirmation, presence: true, on: :create, if: :confirmation_required?
    validates :email, length: { maximum: 254 }
    validates :username, presence: true, uniqueness: true, format: { with: /\A[a-z0-9_]{3,40}\z/ }
    validates :role, inclusion: { in: %w[member moderator admin] }

    private
    def confirmation_required?
      !password_confirmation.nil?
    end
  end
end
