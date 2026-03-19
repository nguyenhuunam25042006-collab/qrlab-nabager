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

// ===== TIME =====
function formatTime(ms){
let s = Math.floor(ms/1000);
let m = Math.floor(s/60);
s = s % 60;
return m + "p " + s + "s";
}

// ===== SCAN =====
function startScan(){

const reader = document.getElementById("reader");
reader.innerHTML = "";

if(scanner){
scanner.stop().then(()=>scanner.clear()).catch(()=>{});
}

scanner = new Html5Qrcode("reader");

Html5Qrcode.getCameras().then(cameras=>{

let cam = cameras[cameras.length-1].id;

scanner.start(cam,{fps:10,qrbox:250},

(text)=>{

scanner.stop().then(()=>{
scanner.clear();

let id = text.trim();

// ===== ĐỌC LINK QR =====
try{
let url = new URL(id);
let tb = url.searchParams.get("id");
if(tb) id = tb;
}catch(e){}

// lấy TB001 từ link
let match = id.match(/TB\d+/);
if(match) id = match[0];

id = id.toUpperCase();
currentDevice = id;

setTimeout(()=>{
showDevice(currentDevice);
updateChart();
},200);

});

});

});
}

// ===== SHOW =====
function showDevice(id){

let d = devices[id];
if(!d){
document.getElementById("result").innerHTML="❌ Không có thiết bị";
return;
}

let color="free";
if(d.status==="Đang sử dụng") color="using";
if(d.status==="Bị hỏng") color="broken";

let time = d.start
? formatTime(Date.now()-d.start)
: formatTime(d.total);

document.getElementById("result").innerHTML=`
<div class="result">
<h3>${d.name}</h3>
<p>${id}</p>
<span class="badge ${color}">${d.status}</span>
<p>👤 ${d.user || "Chưa có"}</p>
<p>⏱ ${time}</p>
</div>
`;
}

// ===== USE =====
function useDevice(){
if(!currentDevice) return alert("Quét trước");

let name = document.getElementById("username").value;
if(!name) return alert("Nhập tên");

let d = devices[currentDevice];

d.status="Đang sử dụng";
d.user=name;
d.start=Date.now();

save();
showDevice(currentDevice);
updateChart();
renderUsingList();
}

// ===== STOP =====
function stopDevice(){
if(!currentDevice) return;

let d = devices[currentDevice];

if(d.start){
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

// ===== TIME =====
function formatTime(ms){
let s = Math.floor(ms/1000);
let m = Math.floor(s/60);
s = s % 60;
return m + "p " + s + "s";
}

// ===== SCAN =====
function startScan(){

const reader = document.getElementById("reader");
reader.innerHTML = "";

if(scanner){
scanner.stop().then(()=>scanner.clear()).catch(()=>{});
}

scanner = new Html5Qrcode("reader");

Html5Qrcode.getCameras().then(cameras=>{

let cam = cameras[cameras.length-1].id;

scanner.start(cam,{fps:10,qrbox:250},

(text)=>{

scanner.stop().then(()=>{
scanner.clear();

let id = text.trim();

// ===== ĐỌC LINK QR =====
try{
let url = new URL(id);
let tb = url.searchParams.get("id");
if(tb) id = tb;
}catch(e){}

// lấy TB001 từ link
let match = id.match(/TB\d+/);
if(match) id = match[0];

id = id.toUpperCase();
currentDevice = id;

setTimeout(()=>{
showDevice(currentDevice);
updateChart();
},200);

});

});

});
}

// ===== SHOW =====
function showDevice(id){

let d = devices[id];
if(!d){
document.getElementById("result").innerHTML="❌ Không có thiết bị";
return;
}

let color="free";
if(d.status==="Đang sử dụng") color="using";
if(d.status==="Bị hỏng") color="broken";

let time = d.start
? formatTime(Date.now()-d.start)
: formatTime(d.total);

document.getElementById("result").innerHTML=`
<div class="result">
<h3>${d.name}</h3>
<p>${id}</p>
<span class="badge ${color}">${d.status}</span>
<p>👤 ${d.user || "Chưa có"}</p>
<p>⏱ ${time}</p>
</div>
`;
}

// ===== USE =====
function useDevice(){
if(!currentDevice) return alert("Quét trước");

let name = document.getElementById("username").value;
if(!name) return alert("Nhập tên");

let d = devices[currentDevice];

d.status="Đang sử dụng";
d.user=name;
d.start=Date.now();

save();
showDevice(currentDevice);
updateChart();
renderUsingList();
}

// ===== STOP =====
function stopDevice(){
if(!currentDevice) return;

let d = devices[currentDevice];

if(d.start){
  let used = Date.now()-d.start;
d.total += used;
d.start=null;
alert("⏱ "+formatTime(used));
}

d.status="Trống";
d.user="";

save();
showDevice(currentDevice);
updateChart();
renderUsingList();
}

// ===== ERROR =====
function errorDevice(){
if(!currentDevice) return;

devices[currentDevice].status="Bị hỏng";

save();
showDevice(currentDevice);
updateChart();
renderUsingList();
}

// ===== USING LIST =====
function renderUsingList(){

let html="";

Object.entries(devices).forEach(([id,d])=>{
if(d.status==="Đang sử dụng"){

let time = d.start
? formatTime(Date.now()-d.start)
: "0";

html+=`
<div style="margin-bottom:10px;padding:10px;background:#f1f5f9;border-radius:10px;">
<b>${d.name}</b><br>
${id}<br>
👤 ${d.user}<br>
⏱ ${time}
</div>
`;
}
});

document.getElementById("usingList").innerHTML =
html || "Không có thiết bị đang sử dụng";
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

// realtime
setInterval(()=>{
if(currentDevice) showDevice(currentDevice);
renderUsingList();
},1000);

updateChart();
renderUsingList();
