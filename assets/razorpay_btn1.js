axios.post("/order").then((info) => {
    console.log(info);
    var options = {
        "key": "rzp_test_YAdbElJCTjyshO",
        "name": "Royal  Fittness Gym",
        "description": "Test Transaction",
        "image": "https://static.vecteezy.com/system/resources/thumbnails/000/595/983/small/04012019-25.jpg",
        "order_id": info.data.id,
        "callback_url": "http://localhost:4000/verifyorder/",
        "theme": {
            "color": "#3399cc"
        }
    };
    var rzp1 = new Razorpay(options);
    document.getElementById('rzp-button1').onclick = function (e) {
        rzp1.open();
        e.preventDefault();
    }
})