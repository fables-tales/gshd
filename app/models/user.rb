class User < ActiveRecord::Base
  def gravatar_hash
    OpenSSL::Digest::MD5.hexdigest(email.strip.downcase)
  end
end
