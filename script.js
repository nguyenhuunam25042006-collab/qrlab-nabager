let scanner;
let currentDevice = null;

// ===== DANH SÁCH 10 THIẾT BỊ =====
let devices = JSON.parse(localStorage.getItem("devices")) || {

TB001:{name:"Tủ sấy",status:"Trống",user:"",startTime:null,totalTime:0},
TB002:{name:"Thiết bị hằn lún bánh xe",status:"Trống",user:"",startTime:null,totalTime:0},
TB003:{name:"Marshall tự động",status:"Trống",user:"",startTime:null,totalTime:0},
TB004:{name:"Đầm bê tông nhựa",status:"Trống",user:"",startTime:null,totalTime:0},
TB005:{name:"Xác định parafin",status:"Trống",user:"",startTime:null,totalTime:0},
TB006:{name:"Độ kéo dài nhựa",status:"Trống",user:"",startTime:null,totalTime:0},
TB007:{name:"Độ nhớt Brookfield",status:"Trống",user:"",startTime:null,totalTime:0},
TB008:{name:"Tổn thất khối lượng",status:"Trống",user:"",startTime:null,totalTime:0},
TB009:{name:"Máy cắt bê tông",status:"Trống",user:"",startTime:null,totalTime:0},
TB010:{name:"Bảo dưỡng bê tông",status:"Trống",user:"",startTime:null,totalTime:0}

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
return m + " phút " + s + " giây";
}

// ===== QUÉT QR =====
function startScan(){

const reader = document.getElementById("reader");
reader.innerHTML = "";

if(scanner){
scanner.stop().then(()=>scanner.clear());
}

scanner = new Html5Qrcode("reader");

Html5Qrcode.getCameras().then(cameras=>{

let cam = cameras[cameras.length-1].id;

scanner.start(
cam,
{ fps:10, qrbox:250 },

(text)=>{

scanner.stop();
reader.innerHTML = "";

// 🔥 FIX: lấy TB001 từ link
// 🔥 FIX: đọc ID từ QR (hỗ trợ cả link)
let id = text.trim();

if(id.includes("http")){
  try{
    let url = new URL(id);
    let param = url.searchParams.get("id");

    if(param){
      id = param;
    }else{
      let match = id.match(/TB\d+/);
      if(match) id = match[0];
    }

  }catch(e){
    let match = id.match(/TB\d+/);
    if(match) id = match[0];
  }
}

id = id.toUpperCase();

handleScan(id);

// ===== XỬ LÝ QR =====
function handleScan(id){

if(!devices[id]){
alert("❌ Không có thiết bị");
return;
}

currentDevice = id;
showDevice(id);
}

// ===== HIỂN THỊ =====
function showDevice(id){

let d = devices[id];

let statusClass = "green";
if(d.status==="Đang sử dụng") statusClass="yellow";
if(d.status==="Hỏng") statusClass="red";

let timeText = "";

if(d.startTime){
timeText = "⏱ " + formatTime(Date.now()-d.startTime);
}else if(d.totalTime){
timeText = "🕒 Tổng: " + formatTime(d.totalTime);
}

document.getElementById("result").innerHTML = `
<div style="padding:15px;border-radius:15px;">
<h3>${d.name}</h3>
<p>Mã: ${id}</p>
<div class="status ${statusClass}">${d.status}</div>
<p>👤 ${d.user || "Chưa có người dùng"}</p>
<p>${timeText}</p>
</div>
`;

}

// ===== SỬ DỤNG =====
function useDevice(){

if(!currentDevice){
alert("Chưa quét");
return;
}

let name = document.getElementById("username").value;

if(!name){
alert("Nhập tên");
return;
}

let d = devices[currentDevice];

d.status = "Đang sử dụng";
d.user = name;
  d.startTime = Date.now();

save();
showDevice(currentDevice);

}

// ===== TRẢ =====
function releaseDevice(){

if(!currentDevice) return;

let d = devices[currentDevice];

if(d.startTime){
let used = Date.now() - d.startTime;
d.totalTime += used;
}

d.status = "Trống";
d.user = "";
d.startTime = null;

save();
showDevice(currentDevice);

}

// ===== AUTO UPDATE TIME =====
setInterval(()=>{
if(currentDevice){
showDevice(currentDevice);
}
},1000);
