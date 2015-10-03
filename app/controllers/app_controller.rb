class AppController < ApplicationController
  def index
  end

  def signup
    create_params = hash_password_from(params.slice(:name, :email, :password))
    begin
      user = User.create!(create_params.permit(:name, :email, :password_hash))
      session[:user_id] = user.id
      render :nothing => true, :status => 201
    rescue
      logger.debug($!.message)
      logger.debug($!.backtrace.join("\n"))
      render :nothing => true, :status => 400
    end
  end

  private

  def hash_password_from(params)
    password = params.delete(:password)
    password_hash = BCrypt::Password.create(password)
    params.merge(:password_hash => password_hash)
  end
end
