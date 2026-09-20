module Api
  module V1
    class PostsController < ApplicationController
      before_action :authenticate!, only: %i[create destroy]
      def index
        page = Publishing::FeedQuery.new.call(params, viewer_id: current_user&.id)
        render json: { data: Publishing::PostPresenter.batch(page[:posts], viewer_id: current_user&.id, url_context: self), nextCursor: page[:next_cursor] }
      end
      def show
        render_post(Publishing::Post.visible.includes(:topic).with_attached_image.find(params[:id]))
      end
      def create
        use_case = Publishing::CreatePost.new(repository: Publishing::PostRepository.new, events: Platform::Outbox, transaction: Platform::Transaction)
        post = use_case.call(author_id: current_user.id, title: params.require(:title), topic_slug: params.require(:topic_slug), body: params[:body], image: params[:image], image_url: params[:image_url])
        render json: Publishing::PostPresenter.batch([post], viewer_id: current_user.id, url_context: self).first, status: :created
      end
      def destroy
        post = Publishing::Post.visible.find(params[:id])
        return render_error("forbidden", "Bạn chỉ được xóa bài của mình.", :forbidden) unless post.author_id == current_user.id
        post.with_lock do
          post.update!(status: "deleted")
          Platform::Outbox.publish("publishing.post_deleted.v1", aggregate_id: post.id, payload: { post_id: post.id })
        end
        head :no_content
      end
    end
  end
end
