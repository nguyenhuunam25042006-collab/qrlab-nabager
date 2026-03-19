// 🔥 FIREBASE CONFIG (THAY CỦA BẠN)
var firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  databaseURL: "YOUR_DB_URL",
  projectId: "YOUR_PROJECT"
};

firebase.initializeApp(firebaseConfig);
var db = firebase.database();

// ===== DATA =====
let devices = {};
let history = [];
let currentDevice = null;

// ===== INIT DEVICES =====
function initDevices(){
  let obj = {};
  for(let i=1;i<=10;i++){
    let id = "TB00"+i;
    obj[id]={
      name:"Thiết bị "+i,
      status:"Trống",
      user:"",
      startTime:null,
      totalTime:0
    };
  }
  db.ref("devices").set(obj);
}

// ===== LOAD REALTIME =====
db.ref("devices").on("value", snap=>{
  devices = snap.val() || {};
  updateChart();
  if(currentDevice) show();
});

db.ref("history").on("value", snap=>{
  history = Object.values(snap.val()||{});
  renderHistory();
});

// ===== SCAN =====
function startScan(){
  const scanner = new Html5Qrcode("reader");

  scanner.start(
    { facingMode:"environment" },
    { fps:10, qrbox:250 },
    text=>{
      currentDevice = text;
      show();
      scanner.stop();
    }
  );
}

// ===== SHOW =====
function show(){
  let d = devices[currentDevice];
  if(!d) return;

  document.getElementById("result").innerHTML = `
    <b>${d.name}</b><br>
    <span class="status ${
      d.status=="Trống"?"free":
      d.status=="Đang sử dụng"?"using":"broken"
    }">${d.status}</span>
    <p>👤 ${d.user||"Chưa có"}</p>
    <p>⏱ ${d.startTime?format(Date.now()-d.startTime):"0s"}</p>
  `;
}

// ===== START =====
function startUse(){
  let user = document.getElementById("username").value;
  if(!currentDevice || !user) return alert("Thiếu dữ liệu");

  let d = devices[currentDevice];
  if(!d) return;

  d.status="Đang sử dụng";
  d.user=user;
  d.startTime=Date.now();

  db.ref("devices/"+currentDevice).set(d);
}

// ===== STOP =====
function stopUse(){
  if(!currentDevice) return;

  let d = devices[currentDevice];
  if(!d || !d.startTime) return;

  let used = Date.now()-d.startTime;
  d.totalTime += used;

  db.ref("history").push({
    device:currentDevice,
    user:d.user,
    time:used,
    date:new Date().toLocaleString()
  });

  d.status="Trống";
  d.user="";
  d.startTime=null;

  db.ref("devices/"+currentDevice).set(d);
}

// ===== ERROR =====
function reportError(){
  if(!currentDevice) return;

  let d = devices[currentDevice];
  if(!d) return;

  d.status="Hỏng";

  db.ref("devices/"+currentDevice).set(d);

  db.ref("history").push({
    device:currentDevice,
    action:"Báo lỗi",
    date:new Date().toLocaleString()
  });
}

// ===== FORMAT =====
function format(ms){
  let s=Math.floor(ms/1000);
  let m=Math.floor(s/60);
  s%=60;
  return m+"m "+s+"s";
}

// ===== CHART =====
let chart;

function updateChart(){
  let using=0,free=0,broken=0;

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
    html+=`<p>${h.device} - ${h.user||""} - ${h.date} ${h.time?format(h.time):""}</p>`;
  });
  document.getElementById("history").innerHTML=html;
}

// ===== AUTO UPDATE =====
setInterval(()=>{
  if(currentDevice) show();
},1000);

// ===== AUTO LOAD DEVICE FROM LINK =====
const urlParams = new URLSearchParams(window.location.search);
const device = urlParams.get("device");
if(device){
  currentDevice=device;
}
