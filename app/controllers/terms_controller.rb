class TermsController < ApplicationController
  before_action :set_term, only: [:show, :edit, :update, :destroy]

  skip_before_action :verify_authenticity_token, :only => [:bookmarklet, :mass_create]
  before_filter :cors_preflight_check, :only => [:mass_create]
  after_filter :cors_set_access_control_headers, :only => [:mass_create]

  # For all responses in this controller, return the CORS access control headers.

  def cors_set_access_control_headers
    headers['Access-Control-Allow-Origin'] = '*'
    headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'
    headers['Access-Control-Allow-Headers'] = 'X-Requested-With, X-Prototype-Version, Authorization, Content-Type'
    headers['Access-Control-Max-Age'] = "1728000"
  end

  # If this is a preflight OPTIONS request, then short-circuit the
  # request, return only the necessary headers and return an empty
  # text/plain.

  def cors_preflight_check
    if request.method == :options
      headers['Access-Control-Allow-Origin'] = '*'
      headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'
      headers['Access-Control-Allow-Headers'] = 'X-Requested-With, X-Prototype-Version, Authorization'
      headers['Access-Control-Max-Age'] = '1728000'
      render :text => '', :content_type => 'text/plain'
    end
  end

  def mass_create
    if request.method == "POST"
      user_id = UserToken.find_by(:token => params.fetch("auth")).user_id
      params.fetch("terms").each do |term|
        ActiveRecord::Base.transaction do
          t = Term.find_or_create_by(:user_id => user_id, :name => term) do |t|
            t.value = 0
          end
          t.value += 1
          t.save!
        end
      end

      system("cd recommender && python app.py")
    end
    render :text => "", :layout => false
  end

  def bookmarklet
    @user_token = UserToken.create!(:user_id => session.fetch(:user_id), :token => SecureRandom.hex).token
    render "bookmarklet.js", :layout => false
  end

  # GET /terms
  # GET /terms.json
  def index
    @terms = Term.where(:user_id => session[:user_id])
  end

  # GET /terms/1
  # GET /terms/1.json
  def show
  end

  # GET /terms/new
  def new
    @term = Term.new
  end

  # GET /terms/1/edit
  def edit
  end

  # POST /terms
  # POST /terms.json
  def create
    @term = Term.new(term_params)
    raise "nope" unless term.user_id == session[:user_id]

    respond_to do |format|
      if @term.save
        format.html { redirect_to @term, notice: 'Term was successfully created.' }
        format.json { render :show, status: :created, location: @term }
      else
        format.html { render :new }
        format.json { render json: @term.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /terms/1
  # PATCH/PUT /terms/1.json
  def update
    respond_to do |format|
      if @term.update(term_params)
        format.html { redirect_to @term, notice: 'Term was successfully updated.' }
        format.json { render :show, status: :ok, location: @term }
      else
        format.html { render :edit }
        format.json { render json: @term.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /terms/1
  # DELETE /terms/1.json
  def destroy
    @term.destroy
    respond_to do |format|
      format.html { redirect_to terms_url, notice: 'Term was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_term
      @term = Term.find(params[:id])
      raise ActiveRecord::RecordNotFound unless @term.user_id == session[:user_id]
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def term_params
      params.require(:term).permit(:user_id, :name, :value_float)
    end
end
