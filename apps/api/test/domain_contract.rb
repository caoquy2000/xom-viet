# Can run without Rails or database: ruby test/domain_contract.rb
require_relative "../app/domain/domain_error" unless defined?(DomainError)
require_relative "../app/use_cases/engagement/cast_vote" unless defined?(Engagement::CastVote)
require_relative "../app/use_cases/publishing/create_post" unless defined?(Publishing::CreatePost)

class FakeVotes
  attr_reader :score, :value
  def initialize
    @score, @value = 0, 0
  end
  def with_post_lock(_id)
    yield
  end
  def value_for(**)
    @value
  end
  def set(value:, **)
    @value = value
  end
  def adjust_score(_id, delta)
    @score += delta
  end
end
class FakeEvents
  attr_reader :events
  def initialize
    @events = []
  end
  def publish(type, **payload)
    @events << [type, payload]
  end
end
repository = FakeVotes.new
events = FakeEvents.new
vote = Engagement::CastVote.new(repository: repository, events: events)
vote.call(user_id: "u1", post_id: "p1", value: 1)
vote.call(user_id: "u1", post_id: "p1", value: 1)
raise "retry double-counted" unless repository.score == 1 && events.events.length == 1
vote.call(user_id: "u1", post_id: "p1", value: -1)
raise "reverse vote delta wrong" unless repository.score == -1
vote.call(user_id: "u1", post_id: "p1", value: 0)
raise "clear vote delta wrong" unless repository.score == 0
[2, "1", nil, true, 1.0].each do |invalid|
  begin
    vote.call(user_id: "u1", post_id: "p1", value: invalid)
    raise "accepted invalid vote #{invalid.inspect}"
  rescue DomainError
    raise "invalid vote mutated state" unless repository.score == 0
  end
end
class FakePosts
  attr_reader :attributes
  Post = Struct.new(:id)
  def create(**attributes)
    @attributes = attributes
    Post.new("post-1")
  end
end
posts = FakePosts.new
post_events = FakeEvents.new
transaction = ->(&block) { block.call }
create = Publishing::CreatePost.new(repository: posts, events: post_events, transaction: transaction)
result = create.call(author_id: "u1", title: "  Câu chuyện vui  ", topic_slug: "hai-huoc")
raise "title not normalized" unless posts.attributes[:title] == "Câu chuyện vui"
raise "missing event" unless post_events.events.first.first == "publishing.post_created.v1"
raise "missing post id" unless result.id == "post-1"
begin
  create.call(author_id: "u1", title: "a", topic_slug: "hai-huoc")
  raise "accepted short title"
rescue DomainError
  raise "invalid post emitted event" unless post_events.events.length == 1
end
puts "Ruby domain contracts passed: vote retry/reverse/clear/invalid inputs and post normalization/validation/event."
