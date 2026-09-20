module Identity
  class SignIn
    def initialize(users:, passwords:, sessions:, transaction:)
      @users, @passwords, @sessions, @transaction = users, passwords, sessions, transaction
    end

    def call(email:, password:, previous_session: nil)
      user = @users.find_by_email(email.to_s.strip.downcase)
      raise InvalidCredentials unless @passwords.valid?(user, password)

      @transaction.call { @sessions.start(user, replacing: previous_session) }
    end
  end
end
