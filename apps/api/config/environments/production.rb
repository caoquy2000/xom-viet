Rails.application.configure do
  config.enable_reloading = false
  config.eager_load = true
  config.consider_all_requests_local = false
  config.force_ssl = true
  config.assume_ssl = true
  config.log_level = ENV.fetch("RAILS_LOG_LEVEL", "info")
  config.logger = ActiveSupport::TaggedLogging.new(Logger.new($stdout))
  config.log_tags = [:request_id]
  config.cache_store = :redis_cache_store, { url: ENV.fetch("REDIS_URL") }
  config.hosts = [ENV.fetch("API_HOST")]
  # Railway health probes use an internal hostname, without browser credentials.
  config.host_authorization = { exclude: ->(request) { request.path == "/up" } }
  config.ssl_options = { redirect: { exclude: ->(request) { request.path == "/up" } } }
  config.secret_key_base = ENV.fetch("SECRET_KEY_BASE")
end
