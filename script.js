function onScanSuccess(qrCodeMessage) {

let device = devices.find(d => d.id === qrCodeMessage);

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

else{
document.getElementById("result").innerHTML =
"✅ Máy sẵn sàng sử dụng";
}

}

let scanner = new Html5QrcodeScanner(
"reader",
{fps:10, qrbox:250}
);

scanner.render(onScanSuccess);

function reportBroken(){

window.open("LINK_GOOGLE_FORM_BAO_HONG");

}

function bookMachine(){

window.open("LINK_GOOGLE_FORM_DAT_LICH");

}
