window.addEventListener("DOMContentLoaded", function () {
  const comunicationBoardElement = document.getElementById('comuBoard');
  if (comunicationBoardElement) {
    fetch('/mcc/連絡事項.txt').then(response => response.text()).then(data => {
      document.getElementById('comuBoard').innerHTML = data;
    }).catch(error => {
      console.error('Error fetching the file:', error);
    });
  }
});