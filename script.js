const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  databaseURL: "YOUR_DB",
  projectId: "YOUR_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let current="";

// SCAN
function scan(){
const qr=new Html5Qrcode("reader");

qr.start({facingMode:"environment"},{fps:10,qrbox:250},

(text)=>{
if(text.includes("http")) text=text.split("/").pop();

current=text.toUpperCase();

navigator.vibrate(200);

check(current);

qr.stop();
});
}

// CHECK
function check(id){

db.ref("devices/"+id).on("value",(snap)=>{

let d=snap.val();

if(!d){
result.innerHTML="❌ Không có thiết bị";
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
});
}

// BOOK
function book(){
if(!current) return alert("Quét trước");

db.ref("devices/"+current).update({
status:"Đang sử dụng",
time:Date.now()
});
}

// REPORT
function report(){
if(!current) return alert("Quét trước");

db.ref("devices/"+current).update({
status:"Bị hỏng"
});
}

// AUTO RESET
setInterval(()=>{
db.ref("devices").once("value",(snap)=>{
let data=snap.val();

Object.keys(data).forEach(id=>{
let d=data[id];

if(d.status==="Đang sử dụng"){
if(Date.now()-d.time>120000){
db.ref("devices/"+id).update({status:"Trống"});
}
}
});
});
},10000);

// LOAD
let chart;

db.ref("devices").on("value",(snap)=>{
let data=snap.val();
let html="";
let u=0,f=0,b=0;

Object.keys(data).forEach(id=>{
let s=data[id].status;

if(s==="Đang sử dụng") u++;
else if(s==="Bị hỏng") b++;
else f++;

html+=`
<div style="display:flex;justify-content:space-between;padding:8px 0;">
<span>${data[id].name}</span>
<span>${s}</span>
</div>
`;
});

list.innerHTML=html;

if(chart) chart.destroy();

chart=new Chart(document.getElementById("chart"),{
type:"doughnut",
data:{
labels:["Đang dùng","Trống","Hỏng"],
datasets:[{data:[u,f,b]}]
}
});
});
