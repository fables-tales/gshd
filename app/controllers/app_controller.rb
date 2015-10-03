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

  def chat
    user_to_id = params.fetch(:other_user_id)
    user_from_id = current_user.id
    ChatMessage.create!(
      :user_from_id => user_from_id,
      :user_to_id   => user_to_id,
      :message      => params.fetch(:message)
    )
    Pusher.url = "https://b3d4264958cd66d206a3:7105e393c9093834d42b@api.pusherapp.com/apps/145792"
    Pusher.trigger("messages_from_#{user_from_id}_to_#{user_to_id}", 'message', {
      message: params.fetch(:message),
      at: Time.now.utc.to_i,
      name: User.find(user_from_id).name,
    })

    render :json => {}
  end

  def current_user_id
    render :json => {:id => current_user.id }
  end

  def recommendations
    rec_ids = Affinity.where(:user_1_id => current_user.id).order("score DESC").sample(4).map(&:user_2_id)
    render :json => {:recommendations => User.where(:id => rec_ids)}
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

  def chat_history
    user_ids = [current_user.id, params.fetch(:other_user_id).to_i]
    other_user_name = User.find(params.fetch(:other_user_id).to_i).name
    chat_messages = ChatMessage.where(:user_from_id => user_ids, :user_to_id => user_ids).order(:created_at)
    formatted_chat_messages = chat_messages.map { |x|
      {
        :at => x.created_at.to_i,
        :name => x.user_from_id == current_user.id ? "You" : other_user_name,
        :message => x.message
      }
    }

    render :json => {:chat_history => formatted_chat_messages}
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
