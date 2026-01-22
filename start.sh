#!/bin/zsh
# ターミナルにタブを２つ追加し、それぞれのタブで監視サーバーguardとPumaを起動するスクリプト

# 環境設定
export LIVERELOAD=${LIVERELOAD:-1}
export LIVERELOAD_HOST=${LIVERELOAD_HOST:-http://localhost:35729}
CURRENT_DIR=$PWD

# コマンド定義
CMD_GUARD="cd '$CURRENT_DIR'; export LIVERELOAD=$LIVERELOAD; export LIVERELOAD_HOST=$LIVERELOAD_HOST; bundle exec guard start"
CMD_PUMA="cd '$CURRENT_DIR'; export RACK_ENV=development; export LIVERELOAD=$LIVERELOAD; export LIVERELOAD_HOST=$LIVERELOAD_HOST; bundle exec rerun -- bundle exec puma -C config/puma.rb"

echo "Opening processes in new tabs..."

# AppleScriptでタブを開いて実行
osascript <<EOF
tell application "Terminal"
    activate
    -- 1つ目のタブ 監視サーバーを起動
    tell application "System Events" to keystroke "t" using command down
    delay 0.1
    do script "$CMD_GUARD" in front window
    
    -- 2つ目のタブ　rerunを起動し、その上でPumaを起動
    tell application "System Events" to keystroke "t" using command down
    delay 0.1
    do script "$CMD_PUMA" in front window
end tell
EOF