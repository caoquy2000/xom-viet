module Api
  module V1
    class CommentsController < ApplicationController
      before_action :authenticate!, only: :create
      def index
        Publishing::PublicApi.visible!(params[:post_id])
        comments = Engagement::Comment.where(post_id: params[:post_id]).order(:created_at, :id).limit(100).to_a
        render json: serialize(comments)
      end
      def create
        comment = Engagement::PublicApi.add_comment(user_id: current_user.id, post_id: params[:post_id], body: params.require(:body))
        render json: serialize([comment]).first, status: :created
      end
      private
      def serialize(comments)
        authors = Identity::PublicApi.summaries(comments.map(&:user_id))
        comments.map { |comment| { id: comment.id.to_s, body: comment.body, author: authors.fetch(comment.user_id), createdAt: comment.created_at.iso8601 } }
      end
    end
  end
end
