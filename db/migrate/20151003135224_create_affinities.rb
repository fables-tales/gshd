class CreateAffinities < ActiveRecord::Migration
  def change
    create_table :affinities do |t|
      t.float :user_1_id
      t.float :user_2_id
      t.float :score

      t.timestamps null: false
    end
  end
end
