class CreateCommunity < ActiveRecord::Migration[8.1]
  def change
    enable_extension "pgcrypto"
    enable_extension "pg_trgm"
    create_table :identity_users, id: :uuid do |t|
      t.string :email, null: false
      t.string :name, null: false
      t.string :username, null: false
      t.string :avatar, null: false, default: "🙂"
      t.string :password_digest, null: false
      t.string :role, null: false, default: "member"
      t.timestamps
    end
    add_index :identity_users, "lower(email)", unique: true, name: "identity_users_email_unique"
    add_index :identity_users, :username, unique: true
    add_check_constraint :identity_users, "role IN ('member', 'moderator', 'admin')", name: "identity_valid_role"

    create_table :identity_sessions, id: :uuid do |t|
      t.references :user, type: :uuid, null: false, foreign_key: { to_table: :identity_users }
      t.string :token_digest, null: false
      t.datetime :expires_at, null: false
      t.timestamps
    end
    add_index :identity_sessions, :token_digest, unique: true
    add_index :identity_sessions, :expires_at

    create_table :publishing_topics, id: :uuid do |t|
      t.string :slug, null: false
      t.string :name, null: false
      t.string :emoji, null: false
      t.text :description, null: false, default: ""
      t.integer :position, null: false, default: 0
      t.timestamps
    end
    add_index :publishing_topics, :slug, unique: true
    create_table :publishing_posts, id: :uuid do |t|
      t.uuid :author_id, null: false
      t.references :topic, null: false, type: :uuid, foreign_key: { to_table: :publishing_topics }
      t.string :title, null: false, limit: 200
      t.text :body, null: false, default: ""
      t.string :image_url
      t.string :status, null: false, default: "published"
      t.bigint :score, null: false, default: 0
      t.bigint :comment_count, null: false, default: 0
      t.string :tags, array: true, default: [], null: false
      t.timestamps
    end
    add_foreign_key :publishing_posts, :identity_users, column: :author_id
    add_index :publishing_posts, :author_id
    add_index :publishing_posts, [:status, :created_at, :id], order: { created_at: :desc, id: :desc }
    add_index :publishing_posts, [:status, :score, :id], order: { score: :desc, id: :desc }
    add_index :publishing_posts, [:topic_id, :status, :created_at]
    add_index :publishing_posts, :title, using: :gin, opclass: :gin_trgm_ops
    add_check_constraint :publishing_posts, "status IN ('published', 'hidden', 'deleted')", name: "publishing_valid_status"
    add_check_constraint :publishing_posts, "comment_count >= 0", name: "publishing_nonnegative_comments"

    create_table :engagement_votes, id: :uuid do |t|
      t.uuid :user_id, null: false
      t.uuid :post_id, null: false
      t.integer :value, null: false
      t.timestamps
    end
    add_index :engagement_votes, [:user_id, :post_id], unique: true
    add_index :engagement_votes, :post_id
    add_check_constraint :engagement_votes, "value IN (-1, 1)", name: "engagement_valid_vote"

    create_table :engagement_bookmarks, id: :uuid do |t|
      t.uuid :user_id, null: false
      t.uuid :post_id, null: false
      t.timestamps
    end
    add_index :engagement_bookmarks, [:user_id, :post_id], unique: true

    create_table :engagement_comments, id: :uuid do |t|
      t.uuid :user_id, null: false
      t.uuid :post_id, null: false
      t.text :body, null: false
      t.timestamps
    end
    add_index :engagement_comments, [:post_id, :created_at, :id]
    add_check_constraint :engagement_comments, "char_length(body) BETWEEN 1 AND 2000", name: "engagement_comment_length"

    create_table :moderation_reports, id: :uuid do |t|
      t.uuid :user_id, null: false
      t.uuid :post_id, null: false
      t.uuid :reviewer_id
      t.string :reason, null: false
      t.string :status, null: false, default: "pending"
      t.timestamps
    end
    add_index :moderation_reports, [:user_id, :post_id], unique: true
    add_index :moderation_reports, [:status, :created_at]
    add_foreign_key :moderation_reports, :identity_users, column: :reviewer_id
    %i[engagement_votes engagement_bookmarks engagement_comments moderation_reports].each do |table|
      add_foreign_key table, :identity_users, column: :user_id
      add_foreign_key table, :publishing_posts, column: :post_id
    end

    create_table :platform_outbox_events, id: :uuid do |t|
      t.string :event_type, null: false
      t.string :aggregate_id, null: false
      t.jsonb :payload, null: false, default: {}
      t.datetime :published_at
      t.timestamps
    end
    add_index :platform_outbox_events, :created_at, where: "published_at IS NULL", name: "outbox_pending"
  end
end
