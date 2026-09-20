module Engagement
  class VoteRepository
    def with_post_lock(post_id, &block)
      Publishing::PublicApi.with_visible_post_lock(post_id, &block)
    end
    def value_for(user_id:, post_id:)
      Vote.find_by(user_id: user_id, post_id: post_id)&.value || 0
    end
    def set(user_id:, post_id:, value:)
      vote = Vote.find_or_initialize_by(user_id: user_id, post_id: post_id)
      value.zero? ? vote.destroy! : vote.update!(value: value)
    end
    def adjust_score(post_id, delta)
      Publishing::PublicApi.adjust_score(post_id, delta)
    end
  end
end
