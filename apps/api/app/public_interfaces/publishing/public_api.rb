module Publishing
  module PublicApi
    # Public commands prevent Engagement/Moderation from importing our models.
    def self.with_visible_post_lock(id)
      post = Post.find(id)
      post.with_lock do
        raise ActiveRecord::RecordNotFound unless post.status == "published"
        yield
      end
    end
    def self.visible!(id)
      Post.visible.find(id).id
    end
    def self.adjust_score(id, delta)
      Post.where(id: id).update_all(["score = score + ?", delta])
    end
    def self.increment_comments(id)
      Post.where(id: id).update_all("comment_count = comment_count + 1")
    end
    def self.hide(id)
      Post.visible.find(id).update!(status: "hidden")
    end
  end
end
