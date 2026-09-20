module SessionResponse
  extend ActiveSupport::Concern

  private

  def string_param(key)
    value = params.require(key)
    raise DomainError, "Thông tin #{key} không hợp lệ." unless value.is_a?(String)
    value
  end

  def render_session(grant, status: :ok)
    result = { user: Identity::PublicApi.summaries([grant.user.id])[grant.user.id] }
    if native_client?
      result[:token] = grant.token
    else
      cookies[:xom_session] = session_cookie_options.merge(value: grant.token, expires: Identity::Session::LIFETIME.from_now)
    end
    render json: result, status: status
  end

  def native_client?
    request.headers["X-Xom-Client"] == "native" && request.headers["Origin"].blank?
  end

  def session_cookie_options
    { httponly: true, secure: Rails.env.production?, same_site: :lax, path: "/" }
  end

  def clear_session_cookie
    cookies.delete(:xom_session, **session_cookie_options)
  end
end
