let scanner = null;
let currentDevice = "";

// ===== DATA =====
let devices = JSON.parse(localStorage.getItem("devices")) || {
"TB001": {name:"Tủ sấy", status:"Trống", user:"", start:null, total:0},
"TB002": {name:"Hằn lún bánh xe", status:"Trống", user:"", start:null, total:0},
"TB003": {name:"Marshall", status:"Trống", user:"", start:null, total:0},
"TB004": {name:"Đầm BTN", status:"Trống", user:"", start:null, total:0},
"TB005": {name:"Parafin", status:"Trống", user:"", start:null, total:0},
"TB006": {name:"Kéo dài nhựa", status:"Trống", user:"", start:null, total:0},
"TB007": {name:"Brookfield", status:"Trống", user:"", start:null, total:0},
"TB008": {name:"Tổn thất nhựa", status:"Trống", user:"", start:null, total:0},
"TB009": {name:"Cắt bê tông", status:"Trống", user:"", start:null, total:0},
"TB010": {name:"Bảo dưỡng bê tông", status:"Trống", user:"", start:null, total:0}
};

// ===== SAVE =====
function save(){
localStorage.setItem("devices", JSON.stringify(devices));
}

// ===== FORMAT TIME =====
function formatTime(ms){
let s = Math.floor(ms/1000);
let m = Math.floor(s/60);
s = s % 60;
return m + "p " + s + "s";
}

// ===== SCAN =====
function startScan(){

if(typeof Html5Qrcode === "undefined"){
alert("❌ Chưa load thư viện QR");
return;
}

const reader = document.getElementById("reader");
reader.innerHTML = "";

// stop scanner cũ
if(scanner){
scanner.stop().then(()=>scanner.clear()).catch(()=>{});
}

scanner = new Html5Qrcode("reader");

Html5Qrcode.getCameras().then(cameras=>{

if(!cameras.length){
alert("❌ Không có camera");
return;
}

let cam = cameras[cameras.length - 1].id;

scanner.start(
cam,
{fps:10, qrbox:250},

(text)=>{

scanner.stop().then(()=>{
scanner.clear();

// ===== XỬ LÝ QR =====
let id = text.trim();

if(id.includes("479mv3qs")) id = "TB001";
if(id.includes("abc123")) id = "TB002";
if(id.includes("xyz456")) id = "TB003";

let match = id.match(/TB\d+/);
if(match) id = match[0];

id = id.toUpperCase();
currentDevice = id;

navigator.vibrate && navigator.vibrate(200);

setTimeout(()=>{
showDevice(currentDevice);
updateChart();
},200);

}).catch(()=>{});

},
(err)=>{}
);

}).catch(()=>{
alert("❌ Không mở được camera");
});

}

// ===== SHOW =====
function showDevice(id){

document.getElementById("reader").innerHTML = "";

let d = devices[id];

if(!d){
document.getElementById("result").innerHTML="❌ Không tìm thấy thiết bị";
return;
}

let color="free";
if(d.status==="Đang sử dụng") color="using";
if(d.status==="Bị hỏng") color="broken";

// ⏱ HIỂN THỊ THỜI GIAN
let timeText = "";

if(d.start){
timeText = "⏱ " + formatTime(Date.now() - d.start);
}else{
timeText = "🕒 " + formatTime(d.total || 0);
}

document.getElementById("result").innerHTML=`
<div class="result">
<h3>${d.name}</h3>
<p>${id}</p>
<span class="badge ${color}">${d.status}</span>

<p>👤 ${d.user || "Chưa có"}</p>
<p>${timeText}</p>

</div>
`;
}
// ===== USE =====
function useDevice(){
if(!currentDevice) return alert("⚠️ Quét thiết bị trước");

// 👉 nhập tên
let name = prompt("Nhập tên người dùng:");
if(!name) return;

let d = devices[currentDevice];

d.status = "Đang sử dụng";
d.user = name;
d.start = Date.now();

save();
showDevice(currentDevice);
updateChart();
}

// ===== STOP (THÊM MỚI) =====
function stopDevice(){
if(!currentDevice) return;

let d = devices[currentDevice];

if(d.start){
let used = Date.now() - d.start;

// 🔥 LƯU LỊCH SỬ
let history = JSON.parse(localStorage.getItem("history")) || [];

history.push({
device: d.name,
user: d.user,
time: new Date().toLocaleString(),
duration: formatTime(used)
});

localStorage.setItem("history", JSON.stringify(history));

// ===== CODE CŨ =====
d.total += used;
d.start = null;

alert("⏱ Đã dùng: " + formatTime(used));
}

d.status = "Trống";
d.user = "";

save();
showDevice(currentDevice);
updateChart();
}
// ===== ERROR =====
function errorDevice(){
if(!currentDevice) return alert("⚠️ Quét thiết bị trước");

devices[currentDevice].status="Bị hỏng";
save();
showDevice(currentDevice);
updateChart();
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

// ===== AUTO UPDATE TIME =====
setInterval(()=>{
if(currentDevice) showDevice(currentDevice);
},1000);

// INIT
updateChart();
