class CreateChatMessages < ActiveRecord::Migration
  def change
    create_table :chat_messages do |t|
      t.integer :user_from_id
      t.integer :user_to_id
      t.text :message

      t.timestamps null: false
    end
  end
end
