class Users::RegistrationsController < Devise::RegistrationsController
  layout 'devise'
  
  # GET /resource/sign_up
  def new
    super
  end

  # POST /resource
  def create
    super
  end

  # GET /resource/edit
  def edit
    super
  end

  # PUT /resource
  def update
    super
  end

  # DELETE /resource
  def destroy
    super
  end

  protected

  def after_sign_up_path_for(resource)
    meetings_path
  end

  def after_update_path_for(resource)
    meetings_path
  end
end
