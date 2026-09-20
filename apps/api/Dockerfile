FROM ruby:3.4-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends build-essential libpq-dev libvips ca-certificates && rm -rf /var/lib/apt/lists/*
COPY Gemfile* ./
RUN bundle install
COPY . .
RUN chmod +x bin/* && mkdir -p tmp/pids storage log && useradd --create-home xom && chown -R xom:xom /app
USER xom
EXPOSE 3001
CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0", "-p", "3001"]
