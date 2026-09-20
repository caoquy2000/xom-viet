module Publishing
  class PostRepository
    def create(author_id:, title:, topic_slug:, body:, image:, image_url:)
      topic = Topic.find_by(slug: topic_slug)
      raise DomainError, "Chọn một chủ đề hợp lệ." unless topic
      post = Post.new(author_id: author_id, title: title, body: body, topic: topic, image_url: image_url.presence)
      post.image.attach(image) if image
      post.save!
      post
    end
  end
end
