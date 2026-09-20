require "test_helper"
class CreatePostTest < ActiveSupport::TestCase
  class FailedOutbox
    def self.publish(*)
      raise "Simulated event persistence failure"
    end
  end
  test "event persistence failure rolls back the new post" do
    existing = create_post
    use_case = Publishing::CreatePost.new(repository: Publishing::PostRepository.new, events: FailedOutbox, transaction: Platform::Transaction)
    assert_no_difference "Publishing::Post.count" do
      assert_raises(RuntimeError) do
        use_case.call(author_id: existing.author_id, title: "Sự kiện và bài cùng transaction", topic_slug: "hai-huoc")
      end
    end
  end
  test "database enforces a single vote per user and post" do
    post = create_post
    user = create_user
    Engagement::Vote.create!(post_id: post.id, user_id: user.id, value: 1)
    assert_raises(ActiveRecord::RecordNotUnique) do
      Engagement::Vote.create!(post_id: post.id, user_id: user.id, value: -1)
    end
  end
end
