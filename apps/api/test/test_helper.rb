ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"
class ActiveSupport::TestCase
  setup { Rack::Attack.cache.store.clear }
  def create_user(name: "Test User")
    Identity::User.create!(name: name, username: "test_#{SecureRandom.hex(5)}", email: "#{SecureRandom.hex(5)}@example.test", password: "correct-horse-test-only")
  end
  def create_post(author: create_user)
    topic = Publishing::Topic.find_or_create_by!(slug: "hai-huoc") { |t| t.name = "Hài hước"; t.emoji = "😂" }
    Publishing::Post.create!(author_id: author.id, topic: topic, title: "Một câu chuyện trong xóm")
  end
  def native_headers(user)
    { "Authorization" => "Bearer #{Identity::Session.issue!(user)}", "X-Xom-Client" => "native" }
  end
end
