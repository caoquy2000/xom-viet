module Publishing
  class FeedQuery
    PAGE_SIZE = 20
    RANKS = {
      "new" => "EXTRACT(EPOCH FROM publishing_posts.created_at)::double precision",
      "top" => "publishing_posts.score::double precision",
      "hot" => "(LN(GREATEST(publishing_posts.score, 1)) + EXTRACT(EPOCH FROM publishing_posts.created_at) / 45000.0)::double precision"
    }.freeze
    def call(params, viewer_id:)
      sort = params.fetch(:sort, "hot")
      raise DomainError, "Cách sắp xếp không hợp lệ." unless RANKS.key?(sort)
      period = params.fetch(:period, "all")
      raise DomainError, "Khoảng thời gian không hợp lệ." unless %w[all day week].include?(period)
      filter = { sort: sort, period: period, topic: params[:topic].to_s, query: params[:query].to_s.first(100), saved: params[:saved] == "true", viewer: params[:saved] == "true" ? viewer_id : nil }
      verifier = Rails.application.message_verifier("feed-cursor-v1")
      cursor = params[:cursor].present? ? verifier.verified(params[:cursor], purpose: "feed") : nil
      raise DomainError, "Trang đã hết hạn. Hãy tải lại bảng tin." if params[:cursor].present? && (!cursor || cursor["filter"] != filter.stringify_keys)
      as_of = cursor ? Time.iso8601(cursor.fetch("as_of")) : Time.current
      scope = Post.visible.where("publishing_posts.created_at <= ?", as_of)
      scope = scope.joins(:topic).where(publishing_topics: { slug: filter[:topic] }) if filter[:topic].present?
      scope = scope.where("publishing_posts.created_at >= ?", as_of - (period == "day" ? 1.day : 7.days)) unless period == "all"
      scope = scope.where(id: Engagement::PublicApi.saved_post_ids_query(viewer_id)) if filter[:saved]
      if filter[:query].present?
        term = "%#{ActiveRecord::Base.sanitize_sql_like(filter[:query])}%"
        scope = scope.where("publishing_posts.title ILIKE :q OR publishing_posts.body ILIKE :q OR array_to_string(publishing_posts.tags, ' ') ILIKE :q", q: term)
      end
      rank = RANKS.fetch(sort)
      scope = scope.where("(#{rank}, publishing_posts.id) < (?, ?)", cursor.fetch("rank").to_f, cursor.fetch("id")) if cursor
      rows = scope.select("publishing_posts.*, #{rank} AS feed_rank").order(Arel.sql("#{rank} DESC, publishing_posts.id DESC")).includes(:topic).with_attached_image.limit(PAGE_SIZE + 1).to_a
      has_more = rows.length > PAGE_SIZE
      rows = rows.first(PAGE_SIZE)
      last = rows.last
      next_cursor = has_more ? verifier.generate({ "rank" => last.feed_rank, "id" => last.id, "as_of" => as_of.iso8601(6), "filter" => filter.stringify_keys }, purpose: "feed", expires_in: 1.hour) : nil
      { posts: rows, next_cursor: next_cursor }
    end
  end
end
