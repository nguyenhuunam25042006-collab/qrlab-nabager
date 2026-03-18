// ===== FIREBASE CONFIG =====
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  databaseURL: "YOUR_DB",
  projectId: "YOUR_ID",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ===== SCAN =====
let current="";

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

// ===== CHECK =====
function check(id){

db.ref("devices/"+id).on("value",snap=>{

let d=snap.val();

if(!d){
result.innerHTML="❌ Không có thiết bị";
return;
}

result.innerHTML=`
<div style="padding:15px;border-radius:12px;background:#fff;">
<b>${d.name}</b><br>
${d.status}
</div>
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

// ===== REPORT =====
function report(){
db.ref("devices/"+current).update({
status:"Bị hỏng"
});
}

// ===== AUTO RESET =====
setInterval(()=>{

db.ref("devices").once("value",snap=>{
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

chart=new Chart(document.getElementById("chart"),{
type:"doughnut",
data:{
labels:["Đang dùng","Trống","Hỏng"],
datasets:[{data:[using,free,broken]}]
}
});

});
