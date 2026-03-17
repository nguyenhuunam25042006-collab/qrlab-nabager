const formLink="https://forms.gle/swQgBUYASe1Hinaw7";

let lastDevice="";

function startScan(){

const html5QrCode=new Html5Qrcode("reader");

html5QrCode.start(
{facingMode:"environment"},
{fps:10,qrbox:200},
(qrCodeMessage)=>{

lastDevice=qrCodeMessage.trim();

checkDevice(lastDevice);

html5QrCode.stop();

}
);

}

function checkDevice(deviceId){

const device=devices[deviceId];

if(!device){
document.getElementById("result").innerHTML="❌ Không tìm thấy thiết bị";
return;
}

let status="";

if(device.status==="free"){
status="🟢 Thiết bị trống";
}

if(device.status==="using"){
status="🟡 Thiết bị đang sử dụng";
}

if(device.status==="broken"){
status="🔴 Thiết bị bị hỏng";
}

document.getElementById("result").innerHTML=
"Thiết bị: "+device.name+"<br>"+status;

}

function report(){

if(lastDevice===""){
alert("Hãy quét thiết bị trước");
return;
}

window.open(formLink,"_blank");

}
