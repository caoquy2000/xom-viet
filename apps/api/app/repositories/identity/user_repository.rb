module Identity
  class UserRepository
    def find_by_email(email)
      User.find_by(email: email)
    end

    def create(**attributes)
      User.create!(**attributes, username: "xom_#{SecureRandom.hex(8)}")
    end
  end
end
