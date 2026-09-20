Rails.application.configure do
  config.enable_reloading = false
  config.eager_load = ENV["CI"].present?
  config.consider_all_requests_local = true
  config.cache_store = :memory_store
  config.active_job.queue_adapter = :test
  config.active_storage.service = :test
  config.action_dispatch.show_exceptions = :rescuable
  config.secret_key_base = "test-only-#{'t' * 64}"
end
