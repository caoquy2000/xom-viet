module Api
  module V1
    module Admin
      class ReportsController < ApplicationController
        before_action :moderator!
        def index
          render json: Moderation::Report.where(status: "pending").order(:created_at).limit(100).as_json(only: %i[id post_id reason created_at])
        end
        def update
          report = Moderation::Report.find(params[:id])
          action = params.require(:resolution)
          raise DomainError, "Cách xử lý không hợp lệ." unless %w[hide dismiss].include?(action)
          report.with_lock do
            Publishing::PublicApi.hide(report.post_id) if action == "hide"
            report.update!(status: action == "hide" ? "resolved" : "dismissed", reviewer_id: current_user.id)
            Platform::Outbox.publish("moderation.report_resolved.v1", aggregate_id: report.id, payload: { report_id: report.id, resolution: action, reviewer_id: current_user.id })
          end
          head :no_content
        end
      end
    end
  end
end
