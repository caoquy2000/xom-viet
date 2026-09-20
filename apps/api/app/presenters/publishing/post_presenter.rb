module Publishing
  module PostPresenter
    def self.batch(posts, viewer_id:, url_context:)
      authors = Identity::PublicApi.summaries(posts.map(&:author_id))
      state = Engagement::PublicApi.viewer_state(viewer_id, posts.map(&:id))
      posts.map do |post|
        { id: post.id.to_s, title: post.title, body: post.body, topicSlug: post.topic.slug,
          imageUrl: post.image.attached? ? url_context.url_for(post.image) : post.image_url,
          author: authors.fetch(post.author_id), createdAt: post.created_at.iso8601,
          score: post.score, commentCount: post.comment_count, tags: post.tags,
          viewerVote: state[:votes].fetch(post.id, 0), saved: state[:saved].include?(post.id) }
      end
    end
  end
end
