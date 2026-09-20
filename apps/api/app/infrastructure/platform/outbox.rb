module Platform
  module Outbox
    def self.publish(event_type, aggregate_id:, payload:)
      OutboxEvent.create!(event_type: event_type, aggregate_id: aggregate_id.to_s, payload: payload)
    end
  end
end
