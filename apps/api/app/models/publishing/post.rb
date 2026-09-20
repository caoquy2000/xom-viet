module Publishing
  class Post < ApplicationRecord
    self.table_name = "publishing_posts"
    belongs_to :topic, class_name: "Publishing::Topic"
    has_one_attached :image
    scope :visible, -> { where(status: "published") }
    validates :title, length: { in: 3..200 }
    validates :body, length: { maximum: 5000 }
    validates :status, inclusion: { in: %w[published hidden deleted] }
    validates :image_url, format: { with: /\Ahttps:\/\/[^\s]+\z/ }, allow_blank: true
    validate :safe_image
    private
    def safe_image
      return unless image.attached?
      errors.add(:image, "phải là JPG, PNG, WebP hoặc GIF") unless %w[image/jpeg image/png image/webp image/gif].include?(image.blob.content_type)
      errors.add(:image, "phải nhỏ hơn 8 MB") if image.blob.byte_size > 8.megabytes
    end
  end
end
