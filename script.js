const formLink = "https://docs.google.com/forms/d/e/1FAIpQLSfjj3-9zh9VmOFR9z0P0V_Jv3j3rnPBdHEAu3h1KqMutKj4mQ/viewform?usp=sharing&ouid=111579897869090458060";
function onScanSuccess(qrCodeMessage) {

let device = devices.find(d => d.id.trim() === qrCodeMessage.trim());

if(!device){
document.getElementById("result").innerHTML =
"❌ Không tìm thấy máy";
return;
}

if(device.status=="busy"){
document.getElementById("result").innerHTML =
"⚠️ Máy đang được sử dụng";
}

else if(device.status=="broken"){
document.getElementById("result").innerHTML =
"🔧 Máy đang hỏng";
}

else if(device.status=="free"){
   document.getElementById("result").innerHTML =
   "✅ Máy đang trống - chuyển sang đặt lịch";

   window.open(formLink);
}

let scanner = new Html5QrcodeScanner(
"reader",
{fps:10, qrbox:250}
);

scanner.render(onScanSuccess);

function reportBroken(){
window.open(formLink);
}

function bookMachine(){
window.open(formLink);
}
