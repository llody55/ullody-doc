window.onload = function(){
    new Oneline("using-a-z-and-0-9-to-make-a-unique-id-for-your-website").on("OnelineUpdate",(e)=>{
    document.querySelector("#visitor-count").innerText = e.detail.count;
  })
  }