module Engagement
  class CastVote
    def initialize(repository:, events:)
      @repository, @events = repository, events
    end
    def call(user_id:, post_id:, value:)
      raise DomainError, "Bình chọn không hợp lệ." unless value.is_a?(Integer) && [-1, 0, 1].include?(value)
      @repository.with_post_lock(post_id) do
        previous = @repository.value_for(user_id: user_id, post_id: post_id)
        next if previous == value
        @repository.set(user_id: user_id, post_id: post_id, value: value)
        @repository.adjust_score(post_id, value - previous)
        @events.publish("engagement.vote_changed.v1", aggregate_id: post_id, payload: { post_id: post_id, user_id: user_id, previous: previous, value: value })
      end
    end
  end
end
