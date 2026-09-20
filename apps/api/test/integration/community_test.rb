require "test_helper"
class CommunityTest < ActionDispatch::IntegrationTest
  test "vote is idempotent, reversible, authenticated and emits only actual changes" do
    post_record = create_post
    endpoint = "/api/v1/posts/#{post_record.id}/vote"
    put endpoint, params: { value: 1 }, headers: { "X-Xom-Client" => "native" }, as: :json
    assert_response :unauthorized
    headers = native_headers(create_user)
    assert_difference "Platform::OutboxEvent.count", 1 do
      2.times { put endpoint, params: { value: 1 }, headers: headers, as: :json; assert_response :success, response.body }
    end
    assert_equal 1, post_record.reload.score
    assert_equal 1, Engagement::Vote.where(post_id: post_record.id).count
    put endpoint, params: { value: -1 }, headers: headers, as: :json
    assert_response :success, response.body
    assert_equal(-1, post_record.reload.score)
    put endpoint, params: { value: 0 }, headers: headers, as: :json
    assert_response :success, response.body
    assert_equal 0, post_record.reload.score
    assert_equal 0, Engagement::Vote.where(post_id: post_record.id).count
  end

  test "another user cannot delete a post, and hidden posts reject engagement" do
    post_record = create_post
    headers = native_headers(create_user)
    delete "/api/v1/posts/#{post_record.id}", headers: headers, as: :json
    assert_response :forbidden
    post_record.update!(status: "hidden")
    put "/api/v1/posts/#{post_record.id}/vote", params: { value: 1 }, headers: headers, as: :json
    assert_response :not_found, response.body
    assert_equal 0, post_record.reload.score
  end

  test "hostile origins cannot create sessions or use cookie-authenticated writes" do
    post "/api/v1/sessions", params: { email: "person@example.test", password: "irrelevant-password" }, headers: { "Origin" => "https://evil.example", "X-Xom-Client" => "native" }, as: :json
    assert_response :forbidden
  end

  test "member cannot moderate reports" do
    get "/api/v1/admin/reports", headers: native_headers(create_user)
    assert_response :forbidden
  end

  test "native registration issues revocable session and never grants a supplied role" do
    post "/api/v1/users", params: { name: "New Neighbor", email: "neighbor@example.test", password: "test-password-long-enough", password_confirmation: "test-password-long-enough", role: "admin", client: "mobile" }, headers: { "X-Xom-Client" => "native" }, as: :json
    assert_response :created, response.body
    token = response.parsed_body.fetch("token")
    assert_equal "member", Identity::User.find_by!(email: "neighbor@example.test").role
    headers = { "X-Xom-Client" => "native", "Authorization" => "Bearer #{token}" }
    get "/api/v1/me", headers: headers
    assert_response :success, response.body
    delete "/api/v1/session", headers: headers, as: :json
    assert_response :no_content
    get "/api/v1/me", headers: headers
    assert_response :unauthorized
  end

  test "new feed cursor does not repeat equal-timestamp rows and binds filters" do
    author = create_user
    23.times { create_post(author: author).update!(created_at: 1.hour.ago.change(usec: 0)) }
    get "/api/v1/posts", params: { sort: "new" }
    assert_response :success, response.body
    first_page = response.parsed_body
    assert_equal 20, first_page.fetch("data").size
    get "/api/v1/posts", params: { sort: "new", cursor: first_page.fetch("nextCursor") }
    assert_response :success, response.body
    assert_equal 3, response.parsed_body.fetch("data").size
    assert_empty first_page.fetch("data").map { |p| p["id"] } & response.parsed_body.fetch("data").map { |p| p["id"] }
    get "/api/v1/posts", params: { sort: "top", cursor: first_page.fetch("nextCursor") }
    assert_response :unprocessable_entity
  end
end
