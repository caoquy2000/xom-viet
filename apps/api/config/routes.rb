Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check
  namespace :api do
    namespace :v1 do
      resources :users, only: :create
      resources :sessions, only: :create
      delete "session", to: "sessions#destroy"
      get "me", to: "sessions#show"
      resources :topics, only: :index
      resources :posts, only: %i[index show create destroy] do
        put "vote", to: "votes#update"
        put "bookmark", to: "bookmarks#update"
        delete "bookmark", to: "bookmarks#destroy"
        resources :comments, only: %i[index create]
        resources :reports, only: :create
      end
      namespace :admin do
        resources :reports, only: %i[index update]
      end
    end
  end
end
