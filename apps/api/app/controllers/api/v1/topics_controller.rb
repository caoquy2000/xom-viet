module Api
  module V1
    class TopicsController < ApplicationController
      def index
        render json: Publishing::Topic.order(:position).as_json(only: %i[slug name emoji description])
      end
    end
  end
end
