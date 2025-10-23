require 'rack'
require_relative 'lib/choir'



#use Rack::Static, :urls => ['/christmas'], :root => 'contents'
use Rack::Static, :urls => ['/js','/css','/img','/tmp'], :root => 'contents'
use Rack::Static, :urls => ['/index.html'], :root => 'contents'
use Rack::Static, :urls => {'/'=>'index.html'}, :root => 'contents'

run Choir.new
