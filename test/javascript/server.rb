require 'bundler'
Bundler.setup
require 'sinatra'
require 'json'
require File.join(File.expand_path('../../..', __FILE__), 'coffeescript/processor')

ClientSideValidations::Processor.run

class AssetPath
  def initialize(app, options={})
    @app = app
    @urls = options[:urls] || ["/favicon.ico"]
    @index = options[:index]
    root = options[:root] || Dir.pwd
    cache_control = options[:cache_control]
    @file_server = Rack::File.new(root, cache_control)
  end

  def overwrite_file_path(path)
    @urls.kind_of?(Hash) && @urls.key?(path) || @index && path == '/'
  end

  def route_file(path)
    @urls.kind_of?(Array) && @urls.any? { |url| path.index(url) == 0 }
  end

  def can_serve(path)
    route_file(path) || overwrite_file_path(path)
  end

  def call(env)
    path = env["PATH_INFO"]

    if can_serve(path)
      env["PATH_INFO"] = (path == '/' ? @index : @urls[path]) if overwrite_file_path(path)
      response = @file_server.call(env)
      if response.first == 404
        @app.call(env)
      else
        response
      end
    else
      @app.call(env)
    end
  end
end

use AssetPath, :urls => ['/vendor/assets/javascripts'], :root => File.expand_path('../..', settings.root)

JQUERY_VERSIONS = %w[ 1.6 1.6.1 1.6.2 1.6.3 1.6.4 1.7 1.7.1 ].freeze
BACKBONE_VERSIONS = %w[ 0.5.3 0.9.1 ].freeze

helpers do
  def jquery_link jquery_version
    if params[:jquery_version] == jquery_version
      "[#{jquery_version}]"
    else
      "<a href='/?jquery_version=#{jquery_version}&backbone_version=#{params[:backbone_version]}'>#{jquery_version}</a>"
    end
  end

  def jquery_src
    if params[:jquery_version] == 'edge' then '/vendor/jquery.js'
    else "http://code.jquery.com/jquery-#{params[:jquery_version]}.js"
    end
  end

  def test_base
    names = ['/vendor/qunit.js', 'settings']
    names.map { |name| script_tag name }.join("\n")
  end
  
  def backbone_link backbone_version
    if params[:backbone_version] == backbone_version
      "[#{backbone_version}]"
    else
      "<a href='/?jquery_version=#{params[:jquery_version]}&backbone_version=#{backbone_version}'>#{backbone_version}</a>"
    end
  end
  
  def backbone_src
    "/vendor/backbone-#{params[:backbone_version]}.js"
  end

  def test *types
    types.map do |type|
      Dir.glob(File.expand_path("public/test/#{type}", settings.root) + '/*.js').map { |file| File.basename(file) }.map do |file|
        script_tag "/test/#{type}/#{file}"
      end.join("\n")
    end.join("\n")
  end

  def script_tag src
    src = "/test/#{src}.js" unless src.index('/')
    %(<script src='#{src}' type='text/javascript'></script>)
  end

  def jquery_versions
    JQUERY_VERSIONS
  end
  
  def backbone_versions
    BACKBONE_VERSIONS
  end
end

get '/' do
  params[:jquery_version] ||= '1.7.1'
  params[:backbone_version] ||= '0.9.1'
  erb :index
end

get '/validators/uniqueness' do
  content_type 'application/json'

  if user = params[:user2]
    status 500
    'error'
  elsif user = params['active_record_test_module/user2']
    status 200
    'false'
  elsif scope = params[:scope]
    if scope[:name] == 'test name' || scope[:name] == 'taken name'
      status 200
      'false'
    else
      status 404
      'true'
    end
  elsif params[:case_sensitive] == 'false' && (params[:user][:email] || params[:users][:email]) == 'taken@test.com'
    status 200
    'false'
  else
    status 404
    'true'
  end

end

post '/users' do
  data = { :params => params }.update(request.env)
  payload = data.to_json.gsub('<', '&lt;').gsub('>', '&gt;')
  <<-HTML
    <script>
      if (window.top && window.top !== window)
        window.top.jQuery.event.trigger('iframe:loaded', #{payload})
    </script>
    <p id="response">Form submitted</p>
  HTML
end

