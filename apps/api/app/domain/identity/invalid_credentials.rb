module Identity
  class InvalidCredentials < DomainError
    def initialize
      super("Email hoặc mật khẩu chưa đúng.", code: "invalid_credentials")
    end
  end
end
