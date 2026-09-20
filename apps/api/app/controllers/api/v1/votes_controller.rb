module Api
  module V1
    class VotesController < ApplicationController
      before_action :authenticate!
      def update
        Engagement::CastVote.new(repository: Engagement::VoteRepository.new, events: Platform::Outbox).call(user_id: current_user.id, post_id: params[:post_id], value: params.require(:value))
        render_post(Publishing::Post.visible.find(params[:post_id]))
      end
    end
  end
end
