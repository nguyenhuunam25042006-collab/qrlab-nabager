let scanner;

function startScan(){

document.getElementById("reader").innerHTML = "";

// stop nếu đang chạy
if(scanner){
scanner.stop().catch(()=>{});
}

scanner = new Html5Qrcode("reader");

// LẤY CAMERA (FIX IPHONE)
Html5Qrcode.getCameras().then(cameras => {

if(!cameras.length){
alert("Không có camera");
return;
}

// chọn camera sau
let cameraId = cameras[cameras.length - 1].id;

scanner.start(
cameraId,
{
fps: 10,
qrbox: 250
},
(qrText) => {

alert("ĐÃ QUÉT: " + qrText);

// dừng luôn
scanner.stop();

},
(err)=>{}
);

}).catch(err=>{
alert("Không cấp quyền camera");
});

}
