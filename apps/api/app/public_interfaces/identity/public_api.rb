module Identity
  module PublicApi
    def self.summaries(ids)
      User.where(id: ids.uniq).pluck(:id, :name, :username, :avatar).to_h do |id, name, username, avatar|
        [id, { id: id.to_s, name: name, username: username, avatar: avatar }]
      end
    end
  end
end
