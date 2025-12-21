window.addEventListener("DOMContentLoaded", function () {
  const comunicationBoardElement = document.getElementById('comuBoard');
  if (comunicationBoardElement) {
    const params = new URLSearchParams(window.location.search);
    const pass = params.get('pass');
    const url = pass ? '/mcc/連絡事項.txt?pass=' + encodeURIComponent(pass) : '/mcc/連絡事項.txt';
    fetch(url).then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.text();
    }).then(data => {
      document.getElementById('comuBoard').innerHTML = data;
    }).catch(error => {
      console.error('Error fetching the file:', error);
    });
  }
});
function plus_password(target){
  const params = new URLSearchParams(window.location.search);
  var pass = params.get('pass');
  if (!pass) {
    var password = prompt("Please enter the password:");
    if (password != null && password !== "") {
      window.location.href = target + "&password=" + password;
    }
  } else {
    window.location.href = target + "&password=" + pass;
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
  const params = new URLSearchParams(window.location.search);
  var pass = params.get('pass');
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
