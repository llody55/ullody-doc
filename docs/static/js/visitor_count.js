window.onload = function() {
    // 初始化Oneline组件，传入一个唯一的ID
    new Oneline("using-a-z-and-0-9-to-make-a-unique-id-for-your-website").on("OnelineUpdate", (e) => {
        // 更新页面上的在线用户数
        document.querySelector("#visitor-count").innerText = e.detail.count;
    });
};