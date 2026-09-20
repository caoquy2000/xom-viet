Rack::Attack.cache.store = Rails.cache
Rack::Attack.throttle("api/ip", limit: 240, period: 60) { |req| req.ip if req.path.start_with?("/api/") }
Rack::Attack.throttle("auth/ip", limit: 10, period: 60) do |req|
  req.ip if req.post? && %w[/api/v1/sessions /api/v1/users].include?(req.path)
end
Rack::Attack.throttle("publishing/ip", limit: 15, period: 60) { |req| req.ip if req.post? && req.path == "/api/v1/posts" }
Rack::Attack.throttled_responder = lambda do |_request|
  [429, { "Content-Type" => "application/json", "Retry-After" => "60" }, [{ error: { code: "rate_limited", message: "Bạn thao tác hơi nhanh. Thử lại sau một phút nhé." } }.to_json]]
end
