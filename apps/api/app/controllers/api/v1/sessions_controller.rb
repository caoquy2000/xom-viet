module Api
  module V1
    class SessionsController < ApplicationController
      before_action :authenticate!, only: %i[show destroy]
      def create
        user = Identity::User.find_by(email: params.require(:email).to_s.strip.downcase)
        unless user&.authenticate(params.require(:password))
          return render_error("invalid_credentials", "Email hoặc mật khẩu chưa đúng.", :unauthorized)
        end
        current_session&.destroy!
        token = Identity::Session.issue!(user)
        result = { user: Identity::PublicApi.summaries([user.id])[user.id] }
        if params[:client] == "mobile"
          result[:token] = token
        else
          cookies[:xom_session] = { value: token, httponly: true, secure: Rails.env.production?, same_site: :lax, expires: 30.days.from_now }
        end
        render json: result
      end
      def show
        render json: Identity::PublicApi.summaries([current_user.id])[current_user.id]
      end
      def destroy
        current_session.destroy!
        cookies.delete(:xom_session, secure: Rails.env.production?, same_site: :lax)
        head :no_content
      end
    end
  end
end
