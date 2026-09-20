require "test_helper"

class AuthenticationTest < ActionDispatch::IntegrationTest
  ORIGIN = { "Origin" => "http://localhost:4173" }.freeze
  PASSWORD = "correct-horse-user-only".freeze

  def registration(email: "neighbor@example.test", **overrides)
    { name: "Hàng Xóm", email: email, password: PASSWORD, password_confirmation: PASSWORD, **overrides }
  end

  test "browser registration creates a hashed password and cookie session which survives a fresh request" do
    post "/api/v1/users", params: registration(email: " NEIGHBOR@example.test ", role: "admin"), headers: ORIGIN, as: :json
    assert_response :created, response.body
    user = Identity::User.find_by!(email: "neighbor@example.test")
    assert_equal "member", user.role
    assert user.authenticate(PASSWORD)
    refute_equal PASSWORD, user.password_digest
    refute response.parsed_body.key?("token")
    assert_match(/httponly/i, response.headers["Set-Cookie"].to_s)
    assert_match(/samesite=lax/i, response.headers["Set-Cookie"].to_s)
    assert_equal "no-store", response.headers["Cache-Control"]
    token = cookies[:xom_session]
    assert_not_nil token
    assert_equal Digest::SHA256.hexdigest(token), Identity::Session.find_by!(user: user).token_digest
    fresh = open_session
    fresh.get "/api/v1/me", headers: { "Cookie" => "xom_session=#{token}" }
    assert_equal 200, fresh.response.status
    assert_equal user.id.to_s, fresh.response.parsed_body["id"]
  end

  test "logout revokes a session, is repeatable, and login restores the same user" do
    post "/api/v1/users", params: registration, headers: ORIGIN, as: :json
    assert_response :created, response.body
    user_id = response.parsed_body.dig("user", "id")
    token = cookies[:xom_session]
    2.times { delete "/api/v1/session", headers: ORIGIN; assert_response :no_content }
    assert_nil Identity::Session.resolve(token)
    get "/api/v1/me"
    assert_response :unauthorized
    post "/api/v1/sessions", params: { email: "NEIGHBOR@example.test", password: PASSWORD }, headers: ORIGIN, as: :json
    assert_response :success, response.body
    assert_equal user_id, response.parsed_body.dig("user", "id")
    refute_equal token, cookies[:xom_session]
  end

  test "login returns the same error for unknown email and wrong password" do
    user = create_user
    [user.email, "unknown@example.test"].each do |email|
      post "/api/v1/sessions", params: { email: email, password: "incorrect-password" }, headers: ORIGIN, as: :json
      assert_response :unauthorized, response.body
      assert_equal "invalid_credentials", response.parsed_body.dig("error", "code")
    end
  end

  test "mismatch, short passwords, multibyte passwords over 72 bytes and duplicate emails cannot create accounts" do
    [registration(password_confirmation: "different-password"), registration(password: "short", password_confirmation: "short"), registration(password: "🔐" * 24, password_confirmation: "🔐" * 24)].each do |input|
      assert_no_difference "Identity::User.count" do
        post "/api/v1/users", params: input, headers: ORIGIN, as: :json
        assert_response :unprocessable_entity, response.body
      end
    end
    post "/api/v1/users", params: registration, headers: ORIGIN, as: :json
    assert_response :created, response.body
    assert_no_difference "Identity::User.count" do
      post "/api/v1/users", params: registration(email: "NEIGHBOR@example.test"), headers: ORIGIN, as: :json
      assert_response :unprocessable_entity, response.body
    end
  end

  test "expired session and hostile origins cannot authenticate writes" do
    user = create_user
    token = Identity::Session.issue!(user)
    Identity::Session.find_by!(user: user).update!(expires_at: 1.second.ago)
    get "/api/v1/me", headers: { "Authorization" => "Bearer #{token}" }
    assert_response :unauthorized
    ["https://evil.example", nil].each do |origin|
      headers = origin ? { "Origin" => origin } : {}
      post "/api/v1/users", params: registration, headers: headers, as: :json
      assert_response :forbidden, response.body
    end
  end

  test "changing user rotates only this browser session and saved posts are isolated" do
    first = create_user(name: "First User")
    second = create_user(name: "Second User")
    post_record = create_post(author: first)
    Engagement::Bookmark.create!(user_id: first.id, post_id: post_record.id)
    other_device_token = Identity::Session.issue!(first)
    [first, second].each_with_index do |user, index|
      previous_token = cookies[:xom_session]
      post "/api/v1/sessions", params: { email: user.email, password: "correct-horse-test-only" }, headers: ORIGIN, as: :json
      assert_response :success, response.body
      assert_nil Identity::Session.resolve(previous_token) if previous_token
      get "/api/v1/posts", params: { saved: "true" }
      assert_response :success, response.body
      assert_equal(index.zero? ? 1 : 0, response.parsed_body.fetch("data").size)
    end
    assert_not_nil Identity::Session.resolve(other_device_token)
  end

  test "a browser cannot request a native token through the JSON client field" do
    post "/api/v1/users", params: registration(client: "mobile"), headers: ORIGIN, as: :json
    assert_response :created, response.body
    refute response.parsed_body.key?("token")
    assert_not_nil cookies[:xom_session]
  end
end
