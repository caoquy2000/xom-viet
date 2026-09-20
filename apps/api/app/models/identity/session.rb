require "digest"
module Identity
  class Session < ApplicationRecord
    self.table_name = "identity_sessions"
    LIFETIME = 30.days
    belongs_to :user, class_name: "Identity::User"
    def self.issue!(user)
      token = SecureRandom.urlsafe_base64(48)
      create!(user: user, token_digest: Digest::SHA256.hexdigest(token), expires_at: LIFETIME.from_now)
      token
    end
    def self.resolve(token)
      return if token.blank? || token.bytesize > 256
      where(token_digest: Digest::SHA256.hexdigest(token)).where("expires_at > ?", Time.current).first
    end
  end
end
