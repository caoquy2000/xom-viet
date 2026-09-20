module Api
  module V1
    class BookmarksController < ApplicationController
      before_action :authenticate!
      def update
        Publishing::PublicApi.with_visible_post_lock(params[:post_id]) do
          Engagement::Bookmark.create_or_find_by!(user_id: current_user.id, post_id: params[:post_id])
        end
        render_post(Publishing::Post.visible.find(params[:post_id]))
      end
      def destroy
        Publishing::PublicApi.visible!(params[:post_id])
        Engagement::Bookmark.where(user_id: current_user.id, post_id: params[:post_id]).delete_all
        render_post(Publishing::Post.visible.find(params[:post_id]))
      end
    end
  end
end
