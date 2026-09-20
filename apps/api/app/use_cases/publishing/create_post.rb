module Publishing
  # Ports are constructor-injected; this use case has no ActiveRecord dependency.
  class CreatePost
    def initialize(repository:, events:, transaction:)
      @repository, @events, @transaction = repository, events, transaction
    end
    def call(author_id:, title:, topic_slug:, body: "", image: nil, image_url: nil)
      title = title.to_s.strip
      raise DomainError, "Tiêu đề cần từ 3 đến 200 ký tự." unless (3..200).cover?(title.length)
      raise DomainError, "Nội dung không quá 5.000 ký tự." if body.to_s.length > 5000
      @transaction.call do
        post = @repository.create(author_id: author_id, title: title, topic_slug: topic_slug, body: body.to_s, image: image, image_url: image_url)
        @events.publish("publishing.post_created.v1", aggregate_id: post.id, payload: { post_id: post.id, author_id: author_id })
        post
      end
    end
  end
end
