require 'rack'
require_relative 'lib/choir'


# index.htmlもパスワードが付与される場合があるため、静的ファイルとして扱わない。
#use Rack::Static, :urls => ['/christmas'], :root => 'contents'
use Rack::Static, :urls => ['/js','/css','/img','/tmp'], :root => 'contents'

run Choir.new
