module Identity
  class SessionRepository
    Grant = Data.define(:user, :token)

    def start(user, replacing: nil)
      replacing&.destroy!
      Grant.new(user: user, token: Session.issue!(user))
    end
  end
end
