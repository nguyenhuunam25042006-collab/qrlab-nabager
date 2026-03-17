const formLink = "https://docs.google.com/forms/d/e/1FAIpQLSfjj3-9zh9VmOFR9z0P0V_Jv3j3rnPBdHEAu3h1KqMutKj4mQ/viewform?usp=sharing&ouid=111579897869090458060";
function startScan() {

const html5QrCode = new Html5Qrcode("reader");

html5QrCode.start(
{ facingMode: "environment" },
{
fps: 10,
qrbox: 250
},
(qrCodeMessage) => {

document.getElementById("result").innerHTML =
checkDevice(qrCodeMessage);

html5QrCode.stop();

}
).catch(err => {
console.log("Camera lỗi:", err);
});
function checkDevice(deviceId){

const device = devices[deviceId];

if(!device){
document.getElementById("result").innerHTML = "❌ Không tìm thấy thiết bị";
return;
}

let statusText = "";

if(device.status === "free"){
statusText = "🟢 Thiết bị trống";
}

if(device.status === "using"){
statusText = "🟡 Thiết bị đang sử dụng";
}

if(device.status === "broken"){
statusText = "🔴 Thiết bị bị hỏng";
}

document.getElementById("result").innerHTML =
"Thiết bị: " + device.name + "<br>" + statusText;

}
