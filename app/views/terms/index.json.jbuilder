json.array!(@terms) do |term|
  json.extract! term, :id, :user_id, :name, :value
  json.url term_url(term, format: :json)
end
