module Identity
  # Composition root. Domain use cases never construct Rails dependencies.
  module Commands
    def self.register_account
      RegisterAccount.new(users: UserRepository.new, sessions: SessionRepository.new,
        transaction: Platform::Transaction)
    end

    def self.sign_in
      SignIn.new(users: UserRepository.new, passwords: PasswordVerifier.new,
        sessions: SessionRepository.new, transaction: Platform::Transaction)
    end
  end
end
