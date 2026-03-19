// ===== FIREBASE CONFIG (THAY CỦA BẠN) =====
const firebaseConfig = {
apiKey: "YOUR_KEY",
authDomain: "YOUR_PROJECT.firebaseapp.com",
databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
projectId: "YOUR_PROJECT",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ===== DATA =====
let devices = {};
let history = [];
let scanner;
let currentDevice = null;

// ===== LOAD DATA ONLINE =====
db.ref("devices").on("value", snap=>{
devices = snap.val() || {};
updateChart();
});

db.ref("history").on("value", snap=>{
history = snap.val() || [];
renderHistory();
});

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

let id=text.match(/TB\d+/);
if(id) id=id[0];

handleScan(id);

});

});
}

// ===== HANDLE =====
function handleScan(id){

if(!devices[id]){
alert("Không có thiết bị");
return;
}

currentDevice=id;
show();

}

// ===== SHOW =====
function show(){

let d=devices[currentDevice];

document.getElementById("result").innerHTML=`
<h3>${d.name}</h3>
<p>${d.status}</p>
<p>👤 ${d.user||""}</p>
`;

}

// ===== START =====
function startUse(){

let name=prompt("Tên:");

let d=devices[currentDevice];

d.status="Đang sử dụng";
d.user=name;
d.start=Date.now();

db.ref("devices/"+currentDevice).set(d);

}

// ===== STOP =====
function stopUse(){

let d=devices[currentDevice];

let end=Date.now();

history.push({
device:currentDevice,
user:d.user,
time:(end-d.start)
});

db.ref("history").set(history);

d.status="Trống";
d.user="";
d.start=null;

db.ref("devices/"+currentDevice).set(d);

}

// ===== ERROR =====
function reportError(){
devices[currentDevice].status="Hỏng";
db.ref("devices/"+currentDevice).set(devices[currentDevice]);
}

// ===== CHART =====
let chart;

function updateChart(){

let using=0, free=0, broken=0;

Object.values(devices).forEach(d=>{
if(d.status=="Đang sử dụng") using++;
else if(d.status=="Hỏng") broken++;
else free++;
});

let data=[free,using,broken];

if(chart){
chart.data.datasets[0].data=data;
chart.update();
return;
}

chart=new Chart(document.getElementById("chart"),{
type:"doughnut",
data:{
labels:["Trống","Đang dùng","Hỏng"],
datasets:[{data}]
}
});

}

// ===== HISTORY =====
function renderHistory(){

let html="";

history.slice(-10).reverse().forEach(h=>{
html+=`
<p>${h.device} - ${h.user} - ${Math.floor(h.time/1000)}s</p>
`;
});

document.getElementById("history").innerHTML=html;

}
},1000);
