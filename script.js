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
let scanner = null;

// ===== INIT 10 DEVICES =====
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

// ===== QUÉT QR PRO =====
async function startScan(){

  const reader = document.getElementById("reader");
  reader.innerHTML = "";

  if(scanner){
    try{
      await scanner.stop();
      await scanner.clear();
    }catch(e){}
  }

  scanner = new Html5Qrcode("reader");

  try{

    // xin quyền camera
    await navigator.mediaDevices.getUserMedia({ video:true });

    const devicesList = await Html5Qrcode.getCameras();

    if(!devicesList.length){
      alert("Không có camera");
      return;
    }

    let cameraId = devicesList[0].id;

    // ưu tiên camera sau
    devicesList.forEach(d=>{
      if(d.label.toLowerCase().includes("back")){
        cameraId = d.id;
      }
    });

    await scanner.start(
      cameraId,
      { fps:10, qrbox:250 },
      (text)=>{
        currentDevice = text;
        show();

        if(navigator.vibrate) navigator.vibrate(200);

        scanner.stop();
      }
    );

  }catch(err){
    alert("❌ Không mở được camera\n👉 Dùng HTTPS hoặc localhost");
    console.error(err);
  }
}

// ===== HIỂN THỊ =====
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

  d.status="Đang sử dụng";
  d.user=user;
  d.startTime=Date.now();

  db.ref("devices/"+currentDevice).set(d);
}

// ===== STOP =====
function stopUse(){
  if(!currentDevice) return;

  let d = devices[currentDevice];
  if(!d.startTime) return;

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

// ===== AUTO LINK QR =====
const urlParams = new URLSearchParams(window.location.search);
const device = urlParams.get("device");
if(device){
  currentDevice=device;
}
