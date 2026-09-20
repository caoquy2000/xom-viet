require "net/http"
require "openssl"
module Platform
  class RelayOutboxJob < ApplicationJob
    queue_as :events
    # A webhook adapter is supplied; replace it with a broker adapter when needed.
    # At-least-once delivery. Receiver MUST deduplicate on event id.
    def perform
      endpoint = ENV["EVENTS_WEBHOOK_URL"]
      return if endpoint.blank?
      uri = URI(endpoint)
      raise "Event delivery requires HTTPS" unless uri.is_a?(URI::HTTPS)
      50.times do
        delivered = OutboxEvent.transaction do
          event = OutboxEvent.where(published_at: nil).order(:created_at).lock("FOR UPDATE SKIP LOCKED").first
          next false unless event
          body = { id: event.id, type: event.event_type, aggregate_id: event.aggregate_id, occurred_at: event.created_at.iso8601(6), payload: event.payload }.to_json
          signature = OpenSSL::HMAC.hexdigest("SHA256", ENV.fetch("EVENTS_WEBHOOK_SECRET"), body)
          request = Net::HTTP::Post.new(uri, "Content-Type" => "application/json", "X-Xom-Signature" => signature, "Idempotency-Key" => event.id)
          request.body = body
          response = Net::HTTP.start(uri.host, uri.port, use_ssl: true, open_timeout: 3, read_timeout: 5) { |http| http.request(request) }
          raise "Event delivery failed: #{response.code}" unless response.is_a?(Net::HTTPSuccess)
          event.update!(published_at: Time.current)
          true
        end
        break unless delivered
      end
    end
  end
end
