require_relative "boot"
require "rails"
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "active_storage/engine"
require "action_controller/railtie"
require "rails/test_unit/railtie"
Bundler.require(*Rails.groups)

module Xom
  class Application < Rails::Application
    config.load_defaults 8.1
    config.api_only = true
    config.time_zone = "UTC"
    config.active_job.queue_adapter = :sidekiq
    config.middleware.use ActionDispatch::Cookies
    config.middleware.use Rack::Attack
    config.active_storage.service = ENV.fetch("STORAGE_SERVICE", "local").to_sym
    config.active_storage.draw_routes = true
    config.filter_parameters += %i[password password_confirmation token authorization cookie email]
  end
end
