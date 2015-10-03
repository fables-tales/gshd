# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)
#
#

names = [
  "Oliver",
  "Jack",
  "Harry",
  "Jacob",
  "Charlie",
  "Thomas",
  "George",
  "Oscar",
  "James",
  "William",
  "Amelia",
  "Olivia",
  "Emily",
  "Isla",
  "Poppy",
  "Ava",
  "Isabella",
  "Jessica",
  "Lily",
  "Sophie"
]

names.each do |name|
  User.create!(:name => name, :email => "#{name.downcase}@example.com")
end

User.all.each do |u|
  terms = ["dog", "cat", "bird", "potato", "google", "postgres"]

  terms.each do |t|
    Term.create!(:name => t, :user_id => u.id, :value => rand)
  end
end
