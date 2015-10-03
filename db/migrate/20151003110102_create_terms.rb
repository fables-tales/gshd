class CreateTerms < ActiveRecord::Migration
  def change
    create_table :terms do |t|
      t.integer :user_id
      t.string :name
      t.float :value

      t.timestamps null: false
    end
  end
end
