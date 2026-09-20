module Api
  module V1
    class ReportsController < ApplicationController
      before_action :authenticate!
      def create
        Publishing::PublicApi.visible!(params[:post_id])
        report = Moderation::Report.find_or_initialize_by(user_id: current_user.id, post_id: params[:post_id])
        report.update!(reason: params.require(:reason))
        head :created
      end
    end
  end
end
