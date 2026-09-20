module Engagement
  class Comment < ApplicationRecord
    self.table_name = "engagement_comments"
    validates :body, length: { in: 1..2000 }
  end
end
