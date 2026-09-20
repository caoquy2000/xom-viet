module Moderation
  class Report < ApplicationRecord
    self.table_name = "moderation_reports"
    validates :reason, inclusion: { in: %w[spam harassment unsafe copyright] }
    validates :status, inclusion: { in: %w[pending resolved dismissed] }
  end
end
