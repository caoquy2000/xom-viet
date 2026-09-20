module Identity
  class RegisterAccount
    def initialize(users:, sessions:, transaction:)
      @users, @sessions, @transaction = users, sessions, transaction
    end

    def call(name:, email:, password:, password_confirmation:, previous_session: nil)
      @transaction.call do
        user = @users.create(name: name.to_s.strip, email: email.to_s.strip.downcase,
          password: password, password_confirmation: password_confirmation)
        @sessions.start(user, replacing: previous_session)
      end
    end
  end
end
