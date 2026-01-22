require 'dropbox_api'
require 'cgi'
require 'uri'
require 'digest/sha2'
require 'json'
require 'fileutils'
#require 'net/http'

Encoding.default_external = "utf-8"

class Choir
  def initialize()
    if(ENV['DROPBOX_REFRESH_TOKEN'])
      @access_token = get_dropbox_access_token
      @client = DropboxApi::Client.new(@access_token)
      p "DROPBOX_ACCESS_TOKEN is set"
    end
  end
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
    # POSTリクエストの処理  
      if req.path=="/get_mp3.cgi" then
        param = req.params
        header["content-type"] = 'text/plain'
        response = get_missing_mp3(param) #戻り値は"done"
        return [200,header,[response]]
      
      elsif req.path.include? "Choir.cgi" then
        data = JSON.parse(req.body.read)
        data.each{|k,v| "data: #{k.to_s} => #{v}.to_s"}
        puts "path=> "+path
        # パスワードチェック（URL の pass パラメータがあれば優先的に利用）
        pass = data["password"] || req.params['pass']
        p pass
        if password_check(pass)
          t = Time.now
          day = "#{t.month.to_s}月#{t.day.to_s}日"
          header["content-type"] = "text/plain;charset=utf-8"
          response = day + "\n" + data["info"] + "\n\n" + get_information()
          update_information(response,path)
        else
          header["content-type"] = 'text/plain;charset=utf-8'
          response               = 'パスワードが違います.'
        end    
      end
    else
    # GETリクエストの処理
      p "path => " + path
      puts "path.match(/^\/(?:easter|christmas|other)\/.*(?:mp3|m4a|mid|mxl)$/i) => #{path.match(/^\/(?:easter|christmas|other)\/.*(?:mp3|m4a|mid|mxl)$/i)}"
      case path
      when /^(\/$|\/index\.html|\/mcc\/index\.html)/i
        p :rout1_index_html
        route_start = Time.now
        # URLから &pass=xxxxx を抽出してクリーニング
        pass = nil
        clean_path = path.split('&').first  # &pass=xxx 以降を削除
        if path.include?("&pass=")
          match = path.match(/^(.+?)&pass=(.+)$/)
          if match
            clean_path = match[1]
            pass = match[2]
          end
        end
        pass ||= req.params['pass']
        
        # herokuをリバースプロキシとする場合の「持ち歌一覧に戻る」リンク用
        html_path = File.join("./contents",'index.html')
        html = File.read(html_path)
        STDOUT.puts "[srvt] index File.read: #{(Time.now - route_start).round(3)}s"
        if ENV['RACK_ENV']=="development"
          html = insert_livereload_script(html)
        end
        # パスワードが有効な場合、すべてのリンクに pass を付与
        if pass && password_check(pass)
          html = append_pass_to_links(html, pass)
        end
        # 計測用プローブを注入 読込遅延が解決したためコメント化
        #html = insert_perf_probe(html)
        #STDOUT.puts "[srvt] index total build: #{(Time.now - route_start).round(3)}s"
        header["content-type"] = 'text/html'        
        response               = html
      when /^\/(?:easter|christmas|other)\/.*html/i
        p :rout2_other_html
        route_start = Time.now
        # URLから &pass=xxxxx を抽出
        pass = nil
        clean_path = path
        if path.include?("&pass=")
          match = path.match(/^(.+?)&pass=(.+)$/)
          if match
            clean_path = match[1]
            pass = match[2]
          end
        end
        
        html_path = File.join("./contents",clean_path)
        html = File.read(html_path)
        STDOUT.puts "[srvt] song File.read: #{(Time.now - route_start).round(3)}s"
        # 自動リフレッシュ用のスクリプトを挿入する。
        if ENV['RACK_ENV']=="development"
          html = insert_livereload_script(html)
        end
        # jsファイルにキャッシュが効かないように日時を付加する。
        html = add_date_to_jsurl(html)
        STDOUT.puts "[srvt] song add_date_to_jsurl: #{(Time.now - route_start).round(3)}s"
        # バックエンドで音源ファイルを調べ、ない場合は、自動でダウンロードする。
        Thread.new do
          load_missing_mp3_in_background(html)
        end
        html = remove_video_link(html)
        # URLから取得した pass か、req.params から取得した pass のどちらかを使用
        pass ||= req.params['pass']
        # パスワードが有効な場合
        if pass && password_check(pass)
          # すべてのリンクに pass を付与
          p :append_pass_to_links
          t0 = Time.now
          html = append_pass_to_links(html, pass)
          STDOUT.puts "[srvt] song append_pass_to_links: #{(Time.now - t0).round(3)}s"
          # 連絡事項のテキストエリアがあるときは連絡事項を組み込む
          if html.include?("<!--連絡事項-->") && !html.include?("連絡事項.txt")
            p :include_information
            t1 = Time.now
            html = include_information(html)
            STDOUT.puts "[srvt] song include_information: #{(Time.now - t1).round(3)}s"
          end
        end
        # 計測用プローブを注入
        #html = insert_perf_probe(html)
        #STDOUT.puts "[srvt] song total build: #{(Time.now - route_start).round(3)}s"
        header["content-type"] = 'text/html'        
        response               = html
      when /^\/(?:easter|christmas|other)\/.*(?:mp3|m4a|mid|mxl)$/i
        p :rout_when_mp3_midi_mxl
        STDOUT.puts "path => #{path}"
        tmp_file = File.join("./tmp",path)
        STDOUT.puts "tmp_file => #{tmp_file}"
        header = header_of_binary_data(path)
        if File.exist?(tmp_file) and File.size(tmp_file) > 0
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
      when /連絡事項\.txt/
        pass = req.params['pass']
        puts "pass => #{pass}"
        if pass && password_check(pass)
          puts "連絡事項を取得"
          info = get_information()
        else
          info = ""
        end
        header["content-type"] = 'text/plain;charset=UTF-8'
        response = info
      when /^\/mcc\/.*(pdf|mscz)$/i
        # URL の pass パラメータが有効ならパスワード入力を省略する。
        pass = req.params['pass']
        if pass && password_check(pass)
          header,response = return_binary_data(path)
        else
          #パスワード管理するファイルの場合は、その旨を表示してブロックする。
          if need_password?(path)
            html = get_html_format.sub(/<CONTENTS>/,"<h4>パスワードが必要です。</h4>")
            header["content-type"] = 'text/html'        
            response               = html
          else
            header,response = return_binary_data(path)
          end
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
  
  def get_from_dropbox(path, count=0)
    contents = ""
    unless @client
      begin
        @client = DropboxApi::Client.new(@access_token)
      rescue
        @access_token = get_dropbox_access_token
        @client = DropboxApi::Client.new(@access_token)
      end
    end
    begin
      @client.download path do |chunk|
        contents << chunk
      end
    rescue DropboxApi::Errors::ExpiredAccessTokenError
      if count > 3
        puts "error: access_token is expired and failed to get new token:  @get_from_dropbox #{path}"
        return ""
      end
      @access_token = get_dropbox_access_token
      @client = DropboxApi::Client.new(@access_token)
      contents = get_from_dropbox(path, count+1)
    rescue=>e
      p "failed to get from dropbox: #{path} @get_from_dropbox"
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
      STDOUT.puts "path => #{path} @load_missing_mp3_in_background"

      #直接 Dropbpx へのリンクが書かれている場合はスキップ
      next if path.match(/^https:\/\/dl\.dropboxusercontent\.com/i)
      
      dest_path = File.join("./tmp", path)
      STDOUT.puts "dest_path => #{dest_path} @load_missing_mp3_in_background"
      
      unless File.exist?(dest_path)
        src_path = File.join("/mp3", path)
        contents = get_from_dropbox(src_path)
        write_binary_data(dest_path,contents)
        STDOUT.puts "loaded #{dest_path} @load_missing_mp3_in_background"
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
  def append_pass_to_links(html, pass)
    # すべてのサイト内 .html リンクに pass パラメータを付与（外部リンクは除外）
    escaped_pass = CGI.escape(pass)
    html.gsub!(/href=( ["'] ) ( [^"']+?\.html ) ( [^"']* ) \1/ix) do
      quote = $1
      base  = $2    # ～.html まで
      rest  = $3    # クエリやアンカーなど（任意）
      href  = base + rest
      # 外部リンクや mailto は対象外
      if href =~ /^(https?:|mailto:)/i
        "href=#{quote}#{href}#{quote}"
      # すでに pass= 付与済みなら何もしない
      elsif href.include?('pass=')
        "href=#{quote}#{href}#{quote}"
      else
        "href=#{quote}#{href}&pass=#{escaped_pass}#{quote}"
      end
    end
    html
  end
  def include_information(html)
    puts "include_information実行"
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
  def update_information(new_data,path,count=0)
    info_path   = get_info_path()
    backup_path = info_path.sub(/\.txt/,".bak")
    #既存のバックアップファイルを削除する。
    begin  
      @client.delete(backup_path)
    rescue DropboxApi::Errors::NotFoundError
      # バックアップファイルがないとき
    rescue DropboxApi::Errors::ExpiredAccessTokenError
      # アクセストークンが有効期限切れの場合
      if count > 3
        puts "error: access_token is expired and failed to get new token:  @update_information #{info_path}"
        return nil
      end
      @access_token = get_dropbox_access_token
      @client = DropboxApi::Client.new(@access_token)
      update_information(new_data,path,count+1)
    
    rescue=>e
      p "failed to delete backup"
      puts "backup is "+backup_path
      p e.message
    end
    p :continue
    
    #現在のファイルをリネームする（バックアップ）。
    begin
      @client.move(info_path, backup_path)
    rescue DropboxApi::Errors::NotFoundError
      # 既存の 連絡事項.txt がないとき
    end
    p :continue2

    #上書き更新
    @client.upload(info_path, new_data, mode: :overwrite)
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
        @client = DropboxApi::Client.new(@access_token)
        metadata = @client.get_metadata("/mp3")
        return @access_token #既存の@access_tokenが有効なとき
      ensure
        #@access_tokenが無効のときは以下に進む。
      end
    end
    refresh_token = ENV['DROPBOX_REFRESH_TOKEN']
    app_key       = ENV['DROPBOX_APP_KEY']
    app_secret    = ENV['DROPBOX_APP_SECRET']
    
    res=`curl https://api.dropbox.com/oauth2/token \
        -d grant_type=refresh_token \
        -d refresh_token=#{refresh_token} \
        -u #{app_key}:#{app_secret}` #`
    @access_token=JSON.parse(res)["access_token"]
    @access_token
  end
  def dropbox_file_exist?(file_path, count=0)
    # チェックしたいファイルのDropboxパス（ルートからの絶対パス）
    begin
      metadata = @client.get_metadata(file_path)
      if metadata.is_a?(DropboxApi::Metadata::File)
        true
      else
        nil #ファイルではなくフォルダーだった場合
      end
    rescue DropboxApi::Errors::NotFoundError
      nil
    rescue DropboxApi::Errors::ExpiredAccessTokenError
      if count > 3
        puts "error: access_token is expired and failed to get new token:  @dropbox_file_exist? #{file_path}"
        return nil
      end
      @access_token = get_dropbox_access_token
      @client = DropboxApi::Client.new(@access_token)
      dropbox_file_exist?(file_path, count+1)
    end
  end
  def insert_livereload_script(html)
    return html unless ENV['LIVERELOAD'] == '1'
    host = ENV['LIVERELOAD_HOST'] || 'http://localhost:35729'
    loader = <<~EOS
      <script>
        (function(){
          try {
            var s=document.createElement('script');
            s.src='#{host}/livereload.js?snipver=1';
            s.async=true; // DOMContentLoaded をブロックしない
            s.onerror=function(){ console.log('[probe] livereload connect failed'); };
            (document.head||document.documentElement).appendChild(s);
          } catch(e) { console.log('[probe] livereload loader error', e && e.message); }
        })();
      </script>
    EOS
    return html.sub(/<\/body>/i, loader + "\n</body>")
  end
  def insert_perf_probe(html)
    probe = <<~EOS
      <script>
        (function(){
          const t0 = performance.now();
          try {
            console.log('[probe] inline start', t0.toFixed(1));
            document.addEventListener('readystatechange', function(){
              console.log('[probe] readyState=', document.readyState, performance.now().toFixed(1));
            });
            document.addEventListener('DOMContentLoaded', function(){
              console.log('[probe] DOMContentLoaded', performance.now().toFixed(1));
            });
            window.addEventListener('load', function(){
              console.log('[probe] window load', performance.now().toFixed(1));
            });
            // audio メタデータ監視
            window.addEventListener('load', function(){
              var audios = document.querySelectorAll('audio');
              audios.forEach(function(a, i){
                a.addEventListener('loadedmetadata', function(){
                  console.log('[probe] audio metadata', i, (a.currentSrc||a.src||'').slice(0,120), performance.now().toFixed(1));
                });
              });
            });
            // 定期的に最近のリソース状況を出す
            setTimeout(function(){
              try {
                var entries = performance.getEntriesByType('resource') || [];
                var last = entries.slice(-10).map(function(e){ return [e.initiatorType, e.name.slice(0,100), Math.round(e.duration)]; });
                console.log('[probe] last resources', last);
              } catch(e){}
            }, 5000);
          } catch(e) { console.log('[probe] error', e && e.message); }
        })();
      </script>
    EOS
    html.sub(/<\/head>/i, probe + "\n</head>")
  end
  def add_date_to_jsurl(html)
    #常に最新ファイルを読み込ませるため.
    return html.gsub(/(<script src=["']\/js\/[^\/]+\.js)(["']><\/script>)/i){
      $1 + "?#{Time.now.strftime("%m%d%H%M")}" + $2
    } 
  end
end
