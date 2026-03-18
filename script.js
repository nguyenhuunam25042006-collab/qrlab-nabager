// ===== FIREBASE =====
const firebaseConfig = {
  apiKey: "DÁN_KEY",
  authDomain: "DÁN_DOMAIN",
  databaseURL: "DÁN_DB_URL",
  projectId: "DÁN_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let current = "";
let scanner = null;

// ===== SCAN (ĐÃ FIX LỖI) =====
function scan(){

const reader = document.getElementById("reader");
reader.innerHTML = "";

// tạo scanner mới
const html5QrCode = new Html5Qrcode("reader");

// hiển thị camera selector (fix iPhone + Android)
Html5Qrcode.getCameras().then(devices => {

if (devices && devices.length) {

// ưu tiên camera sau
const backCam = devices.find(d => d.label.toLowerCase().includes("back")) || devices[0];

html5QrCode.start(
backCam.id,
{
fps: 10,
qrbox: { width: 250, height: 250 }
},
(qrCodeMessage) => {

let text = qrCodeMessage.trim();

// nếu là link thì lấy TB001
if(text.includes("http")){
text = text.split("/").pop();
}

current = text.toUpperCase();

navigator.vibrate && navigator.vibrate(200);

check(current);

// dừng sau khi quét
html5QrCode.stop();

},
(errorMessage) => {
// bỏ qua lỗi scan
}
);

} else {
alert("Không tìm thấy camera");
}

}).catch(err => {
alert("Không mở được camera: " + err);
});

}
// ===== CHECK =====
function check(id){

db.ref("devices/"+id).on("value",(snap)=>{

let d = snap.val();

if(!d){
result.innerHTML = "❌ Không tìm thấy thiết bị";
return;
}

let color="free";
if(d.status==="Đang sử dụng") color="using";
if(d.status==="Bị hỏng") color="broken";

result.innerHTML = `
<div class="result">
<h3>${d.name}</h3>
<p>Mã: ${id}</p>
<span class="badge ${color}">${d.status}</span>
</div>
`;

});
}

// ===== BOOK =====
function book(){
if(!current) return alert("Quét trước");

db.ref("devices/"+current).update({
status:"Đang sử dụng",
time:Date.now()
});
}

// ===== REPORT =====
function report(){
if(!current) return alert("Quét trước");

db.ref("devices/"+current).update({
status:"Bị hỏng"
});
}

// ===== AUTO RESET =====
setInterval(()=>{
db.ref("devices").once("value",(snap)=>{
let data=snap.val();

Object.keys(data).forEach(id=>{
let d=data[id];

if(d.status==="Đang sử dụng"){
if(Date.now()-d.time > 120000){
db.ref("devices/"+id).update({status:"Trống"});
}
}
});
});
},10000);

// ===== LOAD LIST + CHART =====
let chart;

db.ref("devices").on("value",(snap)=>{
let data=snap.val();
let html="";
let using=0,free=0,broken=0;

Object.keys(data).forEach(id=>{
let s=data[id].status;

if(s==="Đang sử dụng") using++;
else if(s==="Bị hỏng") broken++;
else free++;

let color="free";
if(s==="Đang sử dụng") color="using";
if(s==="Bị hỏng") color="broken";

html+=`
<div class="device">
<span>${data[id].name}</span>
<span class="badge ${color}">${s}</span>
</div>
`;
});

deviceList.innerHTML=html;

if(chart) chart.destroy();

chart=new Chart(document.getElementById("chart"),{
type:"doughnut",
data:{
labels:["Đang dùng","Trống","Hỏng"],
datasets:[{data:[using,free,broken]}]
}
});

});
