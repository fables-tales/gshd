class CreateUserTokens < ActiveRecord::Migration
  def change
    create_table :user_tokens do |t|
      t.string :user_id
      t.string :token

      t.timestamps null: false
    end
  end
end
