module Engagement
  class Vote < ApplicationRecord
    self.table_name = "engagement_votes"
    validates :value, inclusion: { in: [-1, 1] }
  end
end
