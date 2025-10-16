require 'dropbox_api'
require 'cgi'
require 'uri'
require 'digest/sha2'
require 'json'
require 'fileutils'
#require 'net/http'

Encoding.default_external = "utf-8"

class Choir
  # callメソッドはenvを受け取り、3つの値(StatusCode, Headers, Body)を配列として返す
  def call(env)
  	req  = Rack::Request.new(env)
    path = CGI.unescape(req.path())
    p "req.path => " + req.path
    p "req.params => " + req.params.to_s
    #if path.end_with?(".mid")
    #  # 静的ファイルに任せる
    #  return @app.call(env)
    #end
    header  = Hash.new
  	if req.post?
  	  if req.path=="/get_mp3.cgi" then
        param = req.params
        header["content-type"] = 'text/plain'
        response = get_missing_mp3(param) #戻り値は"done"
        return [200,header,[response]]
      
      elsif req.path.include? "Choir.cgi" then
        p :tout0
        data = JSON.parse(req.body.read)
        data.each{|k,v| "data: #{k.to_s} => #{v}.to_s"}
        puts "path=> "+path
        #パスワードチェック
        pass = data["password"]
        p pass
        if password_check(pass)
          p :rout1
          t = Time.now
          day = "#{t.month.to_s}月#{t.day.to_s}日"
          header["content-type"] = "text/plain;charset=utf-8"
          p :rout2
          response = day + "\n" + data["info"] + "\n\n" + get_information(path)
          p :rout3
          update_information(response,path)
        else
          header["content-type"] = 'text/plain;charset=utf-8'
          response               = 'パスワードが違います.'
        end    
      end
    else
      p "path => " + path
      puts "path.match(/^\/(?:easter|christmas|other)\/.*(?:mp3|m4a|mid|mxl)$/i) => #{path.match(/^\/(?:easter|christmas|other)\/.*(?:mp3|m4a|mid|mxl)$/i)}"
      case path
      when '/mcc/index.html'
        # herokuをリバースプロキシとする場合の「持ち歌一覧に戻る」リンク用
        html_path = File.join("./contents",'index.html')
        html = File.read(html_path)
        header["content-type"] = 'text/html'        
        response               = html
      when /^\/(?:easter|christmas|other)\/.*html$/i
        p :rout_when_html
        html_path = File.join("./contents",path)
        html = File.read(html_path)
        Thread.new do
          load_missing_mp3_in_background(html)
        end
        html = remove_video_link(html)
        if html.include?("<!--連絡事項-->") && !html.include?("連絡事項.txt")
          html = include_information(html)
        end
        header["content-type"] = 'text/html'        
        response               = html
      when /^\/(?:easter|christmas|other)\/.*(?:mp3|m4a|mid|mxl)$/i
        p :rout_when_mp3_midi_mxl
        STDOUT.puts "path => #{path}"
        tmp_file = File.join("./tmp",path)
        STDOUT.puts "tmp_file => #{tmp_file}"
        header = header_of_binary_data(path)
        if File.exist? tmp_file
          p "File.exist? #{File.exist? tmp_file}: #{tmp_file}"
          File.open(tmp_file,"rb") do |fp|
            #size = fp.stat.size
            #ranges = Rack::Utils.byte_ranges(env, size)
            #if ranges&.any?
            header["content-length"] = fp.stat.size.to_s
            response = fp.read
            response
          end
        else
          p "get_mp3(path): #{path}"
          response = get_mp3(path)
          header["content-length"] = response.size.to_s
        end
      when /^\/連絡事項\.txt$/
        info = get_information()
        header["content-type"] = 'text/plain;charset=UTF-8'
        response = info
      when /^\/mcc\/.*(pdf|mscz)$/i
        #パスワード管理するファイルの場合は、その旨を表示してブロックする。
        if need_password?(path)
          html = get_html_format.sub(/<CONTENTS>/,"<h4>パスワードが必要です。</h4>")
          header["content-type"] = 'text/html'        
          response               = html
        else
          #p path
          header,response = return_binary_data(path)
        end
      when /password=/
        ans=path.match(/(.*?)&password=(.*)$/)
        pass=ans[2]
        path=ans[1]
        if password_check(pass)
          if path.match(/html$/i)
            html = File.read('.'+path).force_encoding("UTF-8")
            html = remove_onclick_link(html)
            header["content-type"] = 'text/html'        
            response               = html
          else
            header,response = return_binary_data(path)    
          end
        else
          html = get_html_format.sub(/<CONTENTS>/,"<h4>パスワードが違います。<a href='#' onclick='history.back();'>戻る</a></h4>")
          header["content-type"] = 'text/html'
          response               = html
        end
      else
        p :rout_else
      end
    end
    [ 200, header, [response] ]
  end
  def password_check(pass)
    Digest::SHA256.hexdigest(pass)==ENV['MCCPSW']
  end
  def need_password?(path)
    def get_passworded_files(path)
      list = []
      Dir.glob(path+"/*").each do |f|
        if FileTest.directory? f
          ary = get_passworded_files(f)      
          list=list+ary if ary and ary.size>0 
        elsif f[-5,5]=".html"
          #p f
          s=File.read(f).force_encoding('UTF-8') if File.exist?(f)
          ary=s.scan(/onclick\="plus_password\('(.*?)'\)"/) if s
          list=list+ary  if ary and ary.size>0
        end
      end
      list
    end
    root = __dir__+'/mcc'
    $list||=get_passworded_files(root).flatten.map{|path| File.basename(path).downcase}
    $list.find{|f| f==File.basename(path).downcase}
  end
  def return_binary_data(path)
    src_path = File.join("/mp3",path)
    response = get_from_dropbox(src_path)
    header = header_of_binary_data(path)
    header["content-length"] = response.size.to_s
    return [header,response]
  end
  def header_of_binary_data(path)
      filename=File.basename(path)
      header = Hash.new
      header["content-type"] = get_type(filename)
      header["content-disposition"] = 
        get_disposition(filename) + "filename=\"#{filename}\""
      header["expires"] = "0"
      header["cache-control"] = "must-revalidate, post-check=0,pre-check=0"
      header["pragma"] = "private"
      header
  end
  def get_type(filename)
    case filename.match(/\.\w+$/)[0].downcase
    when ".html"        ;  "text/html"
    when ".pdf"         ;  "application/pdf"
    when ".png"         ;  "image/png"
    when ".jpg","jpeg"  ;  "image/jpeg"
    when ".gif"         ;  "image/gif"
    when ".mp3"         ;  "audio/mp3"
    when ".m4a"         ;  "audio/m4a"
    when ".mid"         ;  "audio/midi"
    when ".xml"         ;  "application/xml"
    else                ;  "application/octet-stream"
    end
  end
  def get_disposition(filename)
    case filename.match(/\.\w+$/)[0].downcase
    when ".html"         ;  "inline;"
    when ".pdf"          ;  "inline;"
    when ".jpg","jpeg"   ;  "inline;"
    when ".png"          ;  "inline;"
    when ".gif"          ;  "inline;"
    when ".mp3"          ;  "inline;"
    when ".m4a"          ;  "inline;"
    else                 ;  "attachment;"
    end
  end
  
  def get_from_dropbox(path)
    #2021年以前にブラウザ上で手動で作成した読取り専用のアクセストークンは有効期限がない。
    client = DropboxApi::Client.new(get_dropbox_access_token)
    contents = ""
    begin
      client.download path do |chunk|
        contents << chunk
      end
    rescue=>e
      p e.message
    end
    contents
  end
  def write_binary_data(dest_path,contents)
      unless Dir.exist? File.dirname(dest_path)
        FileUtils.mkdir_p File.dirname(dest_path)
      end
      File.open(dest_path,"wb") do |f|
        f.write contents
      end
  end
  def get_mp3(path)
    src_path = File.join("/mp3",path)
    puts "src_path =>" + src_path
    contents = get_from_dropbox(src_path)
    Thread.new do
      dest_path = File.join("./tmp",path)
      STDOUT.puts "dest_path => #{dest_path}"
      write_binary_data(dest_path,contents)
    end
    return contents
  end
  def load_missing_mp3_in_background(html)
    html.scan(/[^"']+\.mp3/).each do |path|
      STDOUT.puts "path => #{path}"
      #直接 Dropbpx へのリンクが書かれている場合はスキップ
      next if path.match(/^https:\/\/dl\.dropboxusercontent\.com/i)
      dest_path = File.join("./tmp", path)
      STDOUT.puts "dest_path => #{dest_path}"
      unless File.exist?(dest_path)
        src_path = File.join("/mp3", path)
        contents = get_from_dropbox(src_path)
        write_binary_data(dest_path,contents)
        STDOUT.puts "loaded #{dest_path}"
      end
    end
  end
  def get_html_format
    str=<<EOS
    <!doctype html>
    <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style type="text/css">
          div.body {width: 80%; margin-left: auto; margin-right: auto;}
          h4       {margin-bottom: 1em;font-size: 20px;}
		    </style>
      <script type="text/javascript" src="/js/get_mp3.js"></script>
	    </head>
	    <body>
        <CONTENTS>
      </body>
    </html>
EOS
  end
  def remove_video_link(html)
    if html.match(/<video.*?video>/mi)
      html.scan(/<video.*?video>/mi).each do |video|
        f = video.match(/[^\/]*\.(mp4|webm)/i)
        html.sub!(video,"<!--#{f[0]}-->")
        puts "/tmp/#{f[0]}"
        puts video
        puts
        File.write("./tmp/#{f[0]}.txt",video)
      end
    end
    html
  end
  def remove_onclick_link(html)
    html.gsub!(/<a.+onclick.+plus_password\(\).?>(.*)<\/a>/i){$1}
  end
  def include_information(html)
    info = get_information()
    if info
      html.sub!('<!--連絡事項-->',info.force_encoding("utf-8"))
    else
      html.sub!(/(.*)(<li>.*?textarea.*?<\/li>)/m){$1}
    end
    html
  end
  def get_information()
    info_path = get_info_path()
    begin 
      info = get_from_dropbox(info_path)
      if info
        info = info.force_encoding("utf-8")
      else
        info = ""
      end
      puts " info => " + info.to_s[0,10]
    rescue => e
      puts info_path
      puts e.message
      return nil
    end
    info
  end
  def update_information(new_data,path)
    info_path   = get_info_path()
    backup_path = info_path.sub(/\.txt/,".bak")
    access_token = get_dropbox_access_token
    client = DropboxApi::Client.new(access_token)

    #既存のバックアップファイルを削除する。
    begin  
      client.delete(backup_path)
    rescue DropboxApi::Errors::NotFoundError
      # バックアップファイルがないとき
    rescue=>e
      p "failed to delete backup"
      puts "backup is "+backup_path
      p e.message
    end
    p :continue
    
    #現在のファイルをリネームする（バックアップ）。
    begin
      client.move(info_path, backup_path)
    rescue DropboxApi::Errors::NotFoundError
      # 既存の 連絡事項.txt がないとき
    end
    p :continue2

    #上書き更新
    client.upload(info_path, new_data, mode: :overwrite)
  end
  def get_info_path()
    "/mp3/連絡事項.txt"
  end
  def get_dropbox_access_token()
    p :get_dropbox_access_token
    p Time.now
    #書き込み権限のあるアクセストークンは数時間しか有効期限がないので
    #動的に取得する。
    if @access_token
      begin
        client = DropboxApi::Client.new(@access_token)
        metadata = client.get_metadata("/mp3")
        return @access_token #既存の@access_tokenが有効なとき
      ensure
        #@access_tokenが無効のときは以下に進む。
      end
    end
    refresh_token = ENV['DROPBOX_REFRESH_TOKEN']
    app_key = ENV['DROPBOX_APP_KEY']
    app_secret = ENV['DROPBOX_APP_SECRET']
    
    res=`curl https://api.dropbox.com/oauth2/token \
        -d grant_type=refresh_token \
        -d refresh_token=#{refresh_token} \
        -u #{app_key}:#{app_secret}` #`
    @access_token=JSON.parse(res)["access_token"]
    @access_token
  end
  def dropbox_file_exist?(file_path)
    token = get_dropbox_access_token
    client = DropboxApi::Client.new(token)
    # チェックしたいファイルのDropboxパス（ルートからの絶対パス）
    begin
      metadata = client.get_metadata(file_path)
      if metadata.is_a?(DropboxApi::Metadata::File)
        true
      else
        nil #ファイルではなくフォルダーだった場合
      end
    rescue DropboxApi::Errors::NotFoundError
      nil
    end
  end
end
#use Rack::Static, :urls => ['/christmas'], :root => 'contents'
use Rack::Static, :urls => ['/js','/css','/img','/tmp'], :root => 'contents'
use Rack::Static, :urls => ['/index.html'], :root => 'contents'
use Rack::Static, :urls => {'/'=>'index.html'}, :root => 'contents'

run Choir.new
