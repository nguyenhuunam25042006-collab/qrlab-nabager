// ===== FIREBASE CONFIG =====
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  databaseURL: "YOUR_DB",
  projectId: "YOUR_ID",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ===== LOGIN =====
function login(){
if(user.value==="admin" && pass.value==="123"){
alert("Login thành công");
}else{
alert("Sai tài khoản");
}
}

// ===== SCAN =====
let current="";

function scan(){
const qr=new Html5Qrcode("reader");

qr.start({facingMode:"environment"},{fps:10,qrbox:250},

(text)=>{
if(text.includes("http")) text=text.split("/").pop();

current=text.toUpperCase();

navigator.vibrate(200); // rung máy

check(current);
qr.stop();
});
}

// ===== CHECK =====
function check(id){

db.ref("devices/"+id).on("value",snap=>{

let d=snap.val();

if(!d){
result.innerHTML="❌ Không có thiết bị";
return;
}

result.innerHTML=`
<b>${d.name}</b><br>
${d.status}
`;

});
}

// ===== BOOK =====
function book(){

db.ref("devices/"+current).update({
status:"Đang sử dụng",
time:Date.now()
});

}

// ===== AUTO RESET SAU 2 PHÚT =====
setInterval(()=>{

db.ref("devices").once("value",snap=>{
let data=snap.val();

Object.keys(data).forEach(id=>{
if(data[id].status==="Đang sử dụng"){

let t=data[id].time||0;

if(Date.now()-t>120000){
db.ref("devices/"+id).update({status:"Trống"});
}

}
});
});

},10000);

// ===== REPORT =====
function report(){
db.ref("devices/"+current).update({status:"Bị hỏng"});
}

// ===== LOAD + CHART =====
let chart;

db.ref("devices").on("value",snap=>{

let data=snap.val();
let html="";
let using=0,free=0,broken=0;

Object.keys(data).forEach(id=>{

let s=data[id].status;

if(s==="Đang sử dụng") using++;
else if(s==="Bị hỏng") broken++;
else free++;

html+=`
<div class="device">
<span>${data[id].name}</span>
<span>${s}</span>
</div>
`;

});

deviceList.innerHTML=html;

if(chart) chart.destroy();

chart=new Chart(chart,{
type:"doughnut",
data:{
labels:["Đang dùng","Trống","Hỏng"],
datasets:[{data:[using,free,broken]}]
}
});

});
