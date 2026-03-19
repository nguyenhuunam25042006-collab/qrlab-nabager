let scanner = null;
let currentDevice = "";

// ===== DATA =====
let devices = JSON.parse(localStorage.getItem("devices")) || {
"TB001": {name:"Tủ sấy", status:"Trống", user:"", startTime:null, totalTime:0},
"TB002": {name:"Hằn lún bánh xe", status:"Trống", user:"", startTime:null, totalTime:0},
"TB003": {name:"Marshall", status:"Trống", user:"", startTime:null, totalTime:0},
"TB004": {name:"Đầm BTN", status:"Trống", user:"", startTime:null, totalTime:0},
"TB005": {name:"Parafin", status:"Trống", user:"", startTime:null, totalTime:0},
"TB006": {name:"Kéo dài nhựa", status:"Trống", user:"", startTime:null, totalTime:0},
"TB007": {name:"Brookfield", status:"Trống", user:"", startTime:null, totalTime:0},
"TB008": {name:"Tổn thất nhựa", status:"Trống", user:"", startTime:null, totalTime:0},
"TB009": {name:"Cắt bê tông", status:"Trống", user:"", startTime:null, totalTime:0},
"TB010": {name:"Bảo dưỡng bê tông", status:"Trống", user:"", startTime:null, totalTime:0}
};

// ===== SAVE =====
function save(){
localStorage.setItem("devices", JSON.stringify(devices));
}

// ===== SCAN (FIX HOÀN TOÀN) =====
async function startScan(){

const reader = document.getElementById("reader");
reader.innerHTML = "";

if(scanner){
try{
await scanner.stop();
await scanner.clear();
}catch(e){}
}

scanner = new Html5Qrcode("reader");

try{

await navigator.mediaDevices.getUserMedia({video:true});

const cams = await Html5Qrcode.getCameras();
if(!cams.length) return alert("Không có camera");

let camId = cams[cams.length - 1].id;

await scanner.start(
camId,
{fps:15, qrbox:250},

async (text)=>{

await scanner.stop();
await scanner.clear();

let id = text.trim();

// xử lý QR link
if(id.includes("http")){
try{
let url = new URL(id);
id = url.searchParams.get("device") || id.split("/").pop();
}catch(e){}
}

id = id.toUpperCase();

if(!devices[id]){
alert("❌ QR không hợp lệ");
return;
}

currentDevice = id;

navigator.vibrate && navigator.vibrate(200);

showDevice(id);
updateChart();

}

);

}catch(err){
alert("❌ Lỗi camera (cần HTTPS)");
}
}

// ===== SHOW =====
function showDevice(id){

let d = devices[id];

if(!d){
result.innerHTML="❌ Không tìm thấy thiết bị";
return;
}

let color="free";
if(d.status==="Đang sử dụng") color="using";
if(d.status==="Bị hỏng") color="broken";

let time = d.startTime ? format(Date.now()-d.startTime) : "0s";

result.innerHTML=`
<div class="result">
<h3>${d.name}</h3>
<p>${id}</p>
<span class="badge ${color}">${d.status}</span>
<p>👤 ${d.user || "Chưa có"}</p>
<p>⏱ ${time}</p>
<input id="userInput" placeholder="Nhập tên">
</div>
`;
}

// ===== USE =====
function useDevice(){

if(!currentDevice) return alert("Quét trước");

let input = document.getElementById("userInput");
let name = input ? input.value : "";

if(!name) return alert("Nhập tên");

let d = devices[currentDevice];

d.status="Đang sử dụng";
d.user=name;
d.startTime=Date.now();

save();
showDevice(currentDevice);
updateChart();
}

// ===== STOP =====
function stopDevice(){

if(!currentDevice) return;

let d = devices[currentDevice];
if(!d.startTime) return;

let used = Date.now()-d.startTime;

d.totalTime += used;
d.startTime=null;
d.status="Trống";
d.user="";

save();
showDevice(currentDevice);
updateChart();
}

// ===== ERROR =====
function errorDevice(){

if(!currentDevice) return;

devices[currentDevice].status="Bị hỏng";

save();
showDevice(currentDevice);
updateChart();
}

// ===== FORMAT TIME =====
function format(ms){
let s=Math.floor(ms/1000);
let m=Math.floor(s/60);
s%=60;
return m+"m "+s+"s";
}

// ===== CHART =====
let chart;

function updateChart(){

let u=0,f=0,b=0;

Object.values(devices).forEach(d=>{
if(d.status==="Đang sử dụng") u++;
else if(d.status==="Bị hỏng") b++;
else f++;
});

if(chart) chart.destroy();

chart=new Chart(document.getElementById("chart"),{
type:"doughnut",
data:{
labels:["Đang dùng","Trống","Hỏng"],
datasets:[{data:[u,f,b]}]
}
});
}

// INIT
updateChart();
