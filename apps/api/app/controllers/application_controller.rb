class ApplicationController < ActionController::API
  include ActionController::Cookies
  before_action :verify_browser_origin
  after_action :prevent_private_response_caching
  rescue_from ActiveRecord::RecordNotFound do
    render_error("not_found", "Không tìm thấy nội dung.", :not_found)
  end
  rescue_from ActiveRecord::RecordInvalid do |error|
    render_error("validation_failed", error.record.errors.full_messages.join(", "), :unprocessable_entity)
  end
  rescue_from ActiveRecord::RecordNotUnique do
    render_error("conflict", "Thông tin này đã được sử dụng.", :conflict)
  end
  rescue_from DomainError do |error|
    render_error(error.code, error.message, :unprocessable_entity)
  end
  rescue_from ActionController::ParameterMissing do |error|
    render_error("missing_parameter", "Thiếu thông tin: #{error.param}", :bad_request)
  end
  rescue_from Identity::InvalidCredentials do |error|
    render_error(error.code, error.message, :unauthorized)
  end

  private
  def current_session
    return @current_session if defined?(@current_session)
    bearer = request.headers["Authorization"]&.match(/\ABearer (.+)\z/)&.captures&.first
    @current_session = Identity::Session.resolve(bearer || cookies[:xom_session])
  end
  def current_user
    current_session&.user
  end
  def authenticate!
    render_error("unauthorized", "Bạn đăng nhập để tham gia nhé.", :unauthorized) unless current_user
  end
  def moderator!
    return render_error("unauthorized", "Bạn cần đăng nhập.", :unauthorized) unless current_user
    render_error("forbidden", "Bạn không có quyền kiểm duyệt.", :forbidden) unless %w[moderator admin].include?(current_user.role)
  end
  # Browser writes MUST carry an allowed Origin, including login and registration.
  # Native clients omit Origin and use bearer tokens; the special header cannot be
  # sent cross-origin by a hostile browser without a successful CORS preflight.
  def verify_browser_origin
    return if request.get? || request.head? || request.options?
    origin = request.headers["Origin"]
    allowed = ENV.fetch("WEB_ORIGINS", "http://localhost:4173").split(",").map(&:strip)
    if origin.present?
      return if allowed.include?(origin)
    elsif request.headers["X-Xom-Client"] == "native" && cookies[:xom_session].blank?
      return
    end
    render_error("invalid_origin", "Nguồn yêu cầu không hợp lệ.", :forbidden)
  end
  def render_error(code, message, status)
    render json: { error: { code: code, message: message }, requestId: request.request_id }, status: status
  end
  def prevent_private_response_caching
    response.headers["Cache-Control"] = "no-store"
    response.headers["Pragma"] = "no-cache"
  end
  def render_post(post)
    render json: Publishing::PostPresenter.batch([post], viewer_id: current_user&.id, url_context: self).first
  end
end
