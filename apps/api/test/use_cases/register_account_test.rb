require "test_helper"
class RegisterAccountTest < ActiveSupport::TestCase
  class UnavailableSessionStore
    def start(*)
      raise "Session persistence failed"
    end
  end
  test "registration rolls back the account if session storage fails" do
    command = Identity::RegisterAccount.new(users: Identity::UserRepository.new,
      sessions: UnavailableSessionStore.new, transaction: Platform::Transaction)
    assert_no_difference "Identity::User.count" do
      assert_raises(RuntimeError) do
        command.call(name: "New User", email: "rollback@example.test",
          password: "test-password-long-enough", password_confirmation: "test-password-long-enough")
      end
    end
  end
end
