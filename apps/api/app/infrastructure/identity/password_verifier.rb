module Identity
  class PasswordVerifier
    # A failed lookup still performs a password hash comparison.
    DUMMY_DIGEST = BCrypt::Password.create(SecureRandom.hex(32)).to_s.freeze

    def valid?(user, password)
      return false unless password.is_a?(String) && password.bytesize <= 72
      digest = user&.password_digest || DUMMY_DIGEST
      BCrypt::Password.new(digest).is_password?(password) && !user.nil?
    end
  end
end
