module Engagement
  module PublicApi
    def self.viewer_state(user_id, post_ids)
      return { votes: {}, saved: [] } unless user_id
      { votes: Vote.where(user_id: user_id, post_id: post_ids).pluck(:post_id, :value).to_h,
        saved: Bookmark.where(user_id: user_id, post_id: post_ids).pluck(:post_id) }
    end
    def self.saved_post_ids_query(user_id)
      Bookmark.where(user_id: user_id).select(:post_id)
    end
    def self.add_comment(user_id:, post_id:, body:)
      Publishing::PublicApi.with_visible_post_lock(post_id) do
        comment = Comment.create!(user_id: user_id, post_id: post_id, body: body.to_s.strip)
        Publishing::PublicApi.increment_comments(post_id)
        Platform::Outbox.publish("engagement.comment_created.v1", aggregate_id: post_id, payload: { comment_id: comment.id, post_id: post_id })
        comment
      end
    end
  end
end
