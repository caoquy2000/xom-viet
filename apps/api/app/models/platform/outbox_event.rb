module Platform
  class OutboxEvent < ApplicationRecord
    self.table_name = "platform_outbox_events"
  end
end
