let scanner;
let currentDevice = "";

// ===== LOAD DATA (LƯU LOCAL) =====
let devices = JSON.parse(localStorage.getItem("devices")) || {
"TB001": {name:"Tủ sấy", status:"Trống"},
"TB002": {name:"Hằn lún bánh xe", status:"Trống"},
"TB003": {name:"Marshall", status:"Trống"},
"TB004": {name:"Đầm BTN", status:"Trống"},
"TB005": {name:"Parafin", status:"Trống"},
"TB006": {name:"Kéo dài nhựa", status:"Trống"},
"TB007": {name:"Brookfield", status:"Trống"},
"TB008": {name:"Tổn thất nhựa", status:"Trống"},
"TB009": {name:"Cắt bê tông", status:"Trống"},
"TB010": {name:"Bảo dưỡng bê tông", status:"Trống"}
};

// ===== LƯU =====
function save(){
localStorage.setItem("devices", JSON.stringify(devices));
}

// ===== QUÉT QR =====
function startScan(){

document.getElementById("reader").innerHTML="";

if(scanner){
scanner.stop().catch(()=>{});
}

scanner = new Html5Qrcode("reader");

Html5Qrcode.getCameras().then(cameras=>{

let cam = cameras[cameras.length-1].id;

scanner.start(cam,{fps:10,qrbox:250},

(text)=>{

let id = text.trim();

if(id.includes("http")){
id = id.split("/").pop();
}

currentDevice = id.toUpperCase();

navigator.vibrate && navigator.vibrate(200);

showDevice(currentDevice);
updateChart();

scanner.stop();

},
(err)=>{}
);

});
}

// ===== HIỂN THỊ =====
function showDevice(id){

let d = devices[id];

if(!d){
result.innerHTML="❌ Không tìm thấy thiết bị";
return;
}

let color="free";
if(d.status==="Đang sử dụng") color="using";
if(d.status==="Bị hỏng") color="broken";

result.innerHTML=`
<div class="result">
<h3>${d.name}</h3>
<p>${id}</p>
<span class="badge ${color}">${d.status}</span>
</div>
`;
}

// ===== SỬ DỤNG =====
function useDevice(){
if(!currentDevice) return alert("Quét trước");

devices[currentDevice].status="Đang sử dụng";
save();
showDevice(currentDevice);
updateChart();
}

// ===== BÁO LỖI =====
function errorDevice(){
if(!currentDevice) return alert("Quét trước");

devices[currentDevice].status="Bị hỏng";
save();
showDevice(currentDevice);
updateChart();
}

// ===== BIỂU ĐỒ =====
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
