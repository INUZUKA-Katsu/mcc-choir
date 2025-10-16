require "cgi"
require 'dropbox_api'
require 'fileutils'

ROOT ="/Users/inuzuka0601/Sites/Docker/mcc"
INDEX_PATH=File.join(ROOT,"index.html")
TOKEN = ENV['DROPBOX_ACCESS_TOKEN']
$client = DropboxApi::Client.new(TOKEN)

def get_mp3_list()
  index_html=File.read(INDEX_PATH,encoding:"utf-8")
  #持ち歌一覧ページからリンクしている各楽曲ページのパスを取得
  pages = index_html.scan(/[^'"]+\.html/).uniq.
          delete_if{|s| s[0,4]=="http"}
  puts pages
  #持ち歌一覧ページからリンクしているmp3のパスを取得
  mp3s=[]
  pages.each do |html|
      mp3s = mp3s + File.read(html,encoding:"utf-8").
                    scan(/\/tmp[^"']+?\.mp3/).
                    uniq.
                    map{|mp3| CGI.unescape(mp3)}.sort
  end
  mp3s
end

def get_from_dropbox(src_path,dest_path)
  begin
    contents = ""
    $client.download src_path do |chunk|
      contents << chunk
    end
    File.open(dest_path,"wb") do |f|
      p dest_path
      f.write contents
    end  
  rescue=>e
    p e.message
    false
  end
end
puts get_mp3_list()

__END__
src_path="/mp3/easter/sukuinonusiha.mp3"
dest_path=File.join(ROOT,File.dirname("/tmp/mcc/mp3/easter/sukuinonusiha.mp3"))

get_from_dropbox(src_path,dest_path)

puts dest_path
