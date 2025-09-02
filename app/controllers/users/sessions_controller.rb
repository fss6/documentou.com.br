class Users::SessionsController < Devise::SessionsController
  layout 'devise'
  
  # GET /resource/sign_in
  def new
    super
  end

  # POST /resource/sign_in
  def create
    super
  end

  # DELETE /resource/sign_out
  def destroy
    super
  end

  protected

  def after_sign_in_path_for(resource)
    meetings_path
  end

  def after_sign_out_path_for(resource_or_scope)
    new_user_session_path
  end
end
