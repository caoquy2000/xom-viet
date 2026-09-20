FROM ruby:3.4-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends build-essential libpq-dev libvips ca-certificates gosu && rm -rf /var/lib/apt/lists/*
COPY Gemfile* ./
RUN bundle config set deployment true && bundle config set without 'development test' && bundle install
COPY . .
RUN chmod +x bin/* && mkdir -p tmp/pids storage log && useradd --create-home xom && chown -R xom:xom /app
ENTRYPOINT ["/app/bin/docker-entrypoint"]
EXPOSE 3001
CMD ["bundle", "exec", "puma", "-C", "config/puma.rb"]
