module Publishing
  class Topic < ApplicationRecord
    self.table_name = "publishing_topics"
    validates :slug, presence: true, uniqueness: true
    validates :name, presence: true
  end
end
