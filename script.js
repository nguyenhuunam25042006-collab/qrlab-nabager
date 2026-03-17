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
"Thiết bị: " + qrCodeMessage;

html5QrCode.stop();

}
).catch(err => {
console.log("Camera lỗi:", err);
});

}
