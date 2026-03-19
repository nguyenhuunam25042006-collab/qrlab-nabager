let scanner;
let currentDevice = null;

// ===== DATA =====
let devices = JSON.parse(localStorage.getItem("devices")) || {

TB001:{name:"Tủ sấy",status:"Trống"},
TB002:{name:"Hằn lún bánh xe",status:"Trống"},
TB003:{name:"Marshall",status:"Trống"},
TB004:{name:"Đầm BTN",status:"Trống"},
TB005:{name:"Parafin",status:"Trống"},
TB006:{name:"Kéo dài nhựa",status:"Trống"},
TB007:{name:"Brookfield",status:"Trống"},
TB008:{name:"Tổn thất nhựa",status:"Trống"},
TB009:{name:"Cắt bê tông",status:"Trống"},
TB010:{name:"Bảo dưỡng bê tông",status:"Trống"}

};

// ===== SAVE =====
function save(){
localStorage.setItem("devices",JSON.stringify(devices));
}

// ===== FORMAT TIME =====
function format(ms){
let s=Math.floor(ms/1000);
let m=Math.floor(s/60);
s=s%60;
return m+" phút "+s+" giây";
}

// ===== SCAN =====
function startScan(){

let reader=document.getElementById("reader");
reader.innerHTML="";

if(scanner){
scanner.stop().then(()=>scanner.clear()).catch(()=>{});
}

scanner=new Html5Qrcode("reader");

Html5Qrcode.getCameras().then(cameras=>{

let cam=cameras[cameras.length-1].id;

scanner.start(cam,{fps:10,qrbox:250},(text)=>{

scanner.stop().then(()=>scanner.clear());
reader.innerHTML="";

// ===== FIX LINK =====
let id=text.trim();

if(id.includes("http")){
let match=id.match(/TB\d+/);
if(match) id=match[0];
}

id=id.toUpperCase();

handleScan(id);

});

});
}

// ===== HANDLE =====
function handleScan(id){

if(!devices[id]){
alert("❌ Không tìm thấy: "+id);
return;
}

currentDevice=id;
show();

}

// ===== SHOW =====
function show(){

let d=devices[currentDevice];

let cls="free";
if(d.status=="Đang sử dụng") cls="using";
if(d.status=="Hỏng") cls="broken";

let timeText="";

if(d.startTime){
timeText="⏱ "+format(Date.now()-d.startTime);
}else if(d.totalTime){
timeText="🕒 Tổng: "+format(d.totalTime);
}

document.getElementById("result").innerHTML=`
<h3>${d.name}</h3>
<p>Mã: ${currentDevice}</p>

<div class="status ${cls}">
${d.status}
</div>

<p>👤 ${d.user || "Chưa có người dùng"}</p>
<p>⏰ Bắt đầu: ${d.start || "-"}</p>
<p>⏱ Kết thúc: ${d.end || "-"}</p>
<p>${timeText}</p>
`;
}

// ===== START =====
function startUse(){

if(!currentDevice){
alert("Quét thiết bị trước");
return;
}

let name=prompt("Nhập tên:");
if(!name) return;

let d=devices[currentDevice];

d.status="Đang sử dụng";
d.user=name;
d.start=new Date().toLocaleString();
d.startTime=Date.now();
d.end="";

save();
show();
}

// ===== STOP =====
function stopUse(){

if(!currentDevice) return;

let d=devices[currentDevice];

if(d.startTime){
let used=Date.now()-d.startTime;
d.totalTime=(d.totalTime||0)+used;
}

d.status="Trống";
d.end=new Date().toLocaleString();
d.startTime=null;

save();
show();
}

// ===== ERROR =====
function reportError(){

if(!currentDevice) return;

devices[currentDevice].status="Hỏng";

save();
show();
}

// ===== AUTO UPDATE TIME =====
setInterval(()=>{
  if(currentDevice){
show();
}
},1000);
