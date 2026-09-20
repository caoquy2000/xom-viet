module Api
  module V1
    class UsersController < ApplicationController
      include SessionResponse

      def create
        grant = Identity::Commands.register_account.call(
          name: string_param(:name), email: string_param(:email),
          password: string_param(:password), password_confirmation: string_param(:password_confirmation),
          previous_session: current_session)
        render_session(grant, status: :created)
      end
    end
  end
end
