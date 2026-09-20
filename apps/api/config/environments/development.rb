Rails.application.configure do
  config.enable_reloading = true
  config.eager_load = false
  config.consider_all_requests_local = true
  config.server_timing = true
  config.cache_store = :memory_store
  config.hosts << ENV["API_HOST"] if ENV["API_HOST"].present?
  config.secret_key_base = ENV.fetch("SECRET_KEY_BASE", "development-only-#{'x' * 64}")
end
