if(window.location.hash) {
  let xhr = new XMLHttpRequest();
  let urlParams = window.location.hash.substring(1);
  console.log(urlParams);
  xhr.open("POST", '/save', true);
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.onreadystatechange = function() {
    console.log(this.readyState, this.status);
    if (this.readyState == 4 && this.status == 200) {
       console.log(`hopefully ${urlParams} was sent`);
      }
    };
  xhr.send(urlParams);
};
