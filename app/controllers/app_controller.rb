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

  def recommendations
    render :json => {:recommendations => User.where("id != ?", current_user.id).to_a.sample(4).map { |x| x.attributes.reject {|k,v| /password/ === k }}}
  end

  def login
    email = params.fetch(:email)
    password = params.fetch(:password)
    if user = User.find_by(:email => email)
      if BCrypt::Password.new(user.password_hash) == password
        session[:user_id] = user.id
        render :text => "", :layout => false, :status => 200
      else
        raise ActiveRecord::RecordNotFound
      end
    else
      raise ActiveRecord::RecordNotFound
    end
  end

  def user_image
    render :text => HTTP.get("https://gravatar.com/avatar/#{current_user.gravatar_hash}").body.to_s, :layout => false
  end

  private

  def hash_password_from(params)
    password = params.delete(:password)
    password_hash = BCrypt::Password.create(password)
    params.merge(:password_hash => password_hash)
  end

  def current_user
    User.find(session[:user_id])
  end
end
