module Api
  module V1
    class SessionsController < ApplicationController
      include SessionResponse
      before_action :authenticate!, only: :show

      def create
        grant = Identity::Commands.sign_in.call(email: string_param(:email),
          password: string_param(:password), previous_session: current_session)
        render_session(grant)
      end

      def show
        render json: Identity::PublicApi.summaries([current_user.id])[current_user.id]
      end

      def destroy
        current_session&.destroy!
        clear_session_cookie
        head :no_content
      end
    end
  end
end
