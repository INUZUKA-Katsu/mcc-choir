document.addEventListener("DOMContentLoaded", function () {
  const comunicationBoardElement = document.getElementById('comuBoard');
  const pass = getPass();
  
  if (comunicationBoardElement) {
    // URL に pass がない場合：textarea クリックでパスワード入力
    if (comunicationBoardElement.textContent.includes('<!--連絡事項-->')) {
      comunicationBoardElement.style.cursor = 'pointer';
      comunicationBoardElement.style.opacity = '0.7';
      comunicationBoardElement.addEventListener('click', loadCommunicationViaClick);
      // ツールチップを表示
      comunicationBoardElement.title = 'クリックしてパスワードを入力してください';
    }
  }
});

function loadCommunicationViaClick(event) {
  event.preventDefault();
  const pass = prompt("Please enter the password:");
  if (!pass) return;
  
  const url = '/mcc/連絡事項.txt?pass=' + encodeURIComponent(pass);
  fetch(url)
    .then(response => response.text())
    .then(data => {
      if (data === '') {
        alert('パスワードが違います');
      } else {
        const textarea = document.getElementById('comuBoard');
        textarea.innerHTML = data;
        textarea.style.opacity = '1';
        textarea.style.cursor = 'auto';
        textarea.title = '';
        // クリックイベント削除（読み込み後は不要）
        textarea.removeEventListener('click', loadCommunicationViaClick);
      }
    })
    .catch(error => {
      alert('Error: ' + error.message);
      console.error('Error:', error);
    });
}

function plus_password(target){
  var pass = getPass();
  if (!pass) {
    var password = prompt("Please enter the password:");
    if (password != null && password !== "") {
      window.location.href = target + "?pass=" + encodeURIComponent(password);
    }
  } else {
    window.location.href = target + "?pass=" + encodeURIComponent(pass);
  }
}
//以下は、連絡事項のテキストエリアの書き込みに係る処理
function cancelText(){
  document.getElementById("returnText").value="";
}
function addText(){
  var elm=document.getElementById("returnText");

  if(elm.value==""){
    alert("追記する内容が何も入力されていません。");
    return ;
  }
  var pass = getPass();
  if (!pass) {
    pass = prompt("Please enter the password:");
    if(!pass) {
      alert("パスワードが入力されませんでした。処理を中止します。");
      return;
    }
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('pass', pass);
    //アドレスバーの表示を更新するだけ。再読込はしない。
    window.history.replaceState(null, '', newUrl.toString());
  }
  var data={"password":pass,"info":elm.value};
  var sendData=JSON.stringify(data);
  var xmlHttp = new XMLHttpRequest();
  //応答時の処理定義
  xmlHttp.onreadystatechange = function(){
    if(xmlHttp.readyState == 4 && xmlHttp.status == 200){
      var response=xmlHttp.responseText;
      if(response=="パスワードが違います."){
        alert("パスワードが違います！");
      }else{
        elm.value="";
        document.getElementById("comuBoard").value=response;
      }
    }
  }
  //POSTリクエスト
  xmlHttp.open("POST","./Choir.cgi" , true);
  xmlHttp.setRequestHeader('content-type', 'application/json;charset=UTF-8');
  xmlHttp.send(sendData);
}

// Helper: URL に付与された pass を取得する（標準クエリパラメータのみ）
function getPass(){
  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get('pass');
}

