module Platform
  module Transaction
    def self.call(&block)
      ApplicationRecord.transaction(&block)
    end
  end
end
