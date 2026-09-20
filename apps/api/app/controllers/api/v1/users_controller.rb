module Api
  module V1
    class UsersController < ApplicationController
      def create
        user = Identity::User.create!(name: params.require(:name), email: params.require(:email), password: params.require(:password), username: "xom_#{SecureRandom.hex(8)}")
        token = Identity::Session.issue!(user)
        set_cookie(token) unless params[:client] == "mobile"
        response = { user: Identity::PublicApi.summaries([user.id])[user.id] }
        response[:token] = token if params[:client] == "mobile"
        render json: response, status: :created
      end
      private
      def set_cookie(token)
        cookies[:xom_session] = { value: token, httponly: true, secure: Rails.env.production?, same_site: :lax, expires: 30.days.from_now }
      end
    end
  end
end
