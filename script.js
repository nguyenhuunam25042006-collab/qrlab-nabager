// 🔥 FIREBASE CONFIG (THAY CỦA BẠN)
var firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  databaseURL: "YOUR_DB_URL",
  projectId: "YOUR_PROJECT"
};

firebase.initializeApp(firebaseConfig);
var db = firebase.database();

let devices = {};
let history = [];
let currentDevice = null;
let scanner = null;

// ===== INIT 10 THIẾT BỊ =====
function initDevices(){
  let obj = {
    TB001:{name:"Tủ sấy",status:"Trống",user:"",startTime:null,totalTime:0},
    TB002:{name:"Thiết bị hằn lún bánh xe",status:"Trống",user:"",startTime:null,totalTime:0},
    TB003:{name:"Marshall tự động",status:"Trống",user:"",startTime:null,totalTime:0},
    TB004:{name:"Đầm bê tông nhựa",status:"Trống",user:"",startTime:null,totalTime:0},
    TB005:{name:"Hàm lượng parafin",status:"Trống",user:"",startTime:null,totalTime:0},
    TB006:{name:"Độ kéo dài",status:"Trống",user:"",startTime:null,totalTime:0},
    TB007:{name:"Độ nhớt Brookfield",status:"Trống",user:"",startTime:null,totalTime:0},
    TB008:{name:"Tổn thất khối lượng",status:"Trống",user:"",startTime:null,totalTime:0},
    TB009:{name:"Máy cắt bê tông",status:"Trống",user:"",startTime:null,totalTime:0},
    TB010:{name:"Bảo dưỡng bê tông",status:"Trống",user:"",startTime:null,totalTime:0}
  };
  db.ref("devices").set(obj);
}

// ===== LOAD DATA =====
db.ref("devices").on("value", snap=>{
  devices = snap.val() || {};
  updateChart();
  if(currentDevice) show();
});

db.ref("history").on("value", snap=>{
  history = Object.values(snap.val()||{});
  renderHistory();
});

// ===== QUÉT QR (FIX FULL) =====
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

    await navigator.mediaDevices.getUserMedia({ video:true });

    const cams = await Html5Qrcode.getCameras();
    if(!cams.length) return alert("Không có camera");

    let camId = cams[0].id;

    cams.forEach(c=>{
      if(c.label.toLowerCase().includes("back")){
        camId = c.id;
      }
    });

    await scanner.start(
      camId,
      { fps:15, qrbox:{width:300,height:300} },
      (text)=>{

        let deviceId = text.trim();

        if(text.includes("http")){
          try{
            let url = new URL(text);
            deviceId = url.searchParams.get("device");

            if(!deviceId){
              let parts = url.pathname.split("/");
              deviceId = parts.pop();
            }
          }catch(e){}
        }

        if(!devices[deviceId]){
          alert("QR không hợp lệ: "+deviceId);
          return;
        }

        currentDevice = deviceId;
        show();

        alert("Đã quét: "+deviceId);

        if(navigator.vibrate) navigator.vibrate(200);

        scanner.stop();
      }
    );

  }catch(err){
    alert("❌ Phải chạy bằng HTTPS hoặc localhost");
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
  let d = devices[currentDevice];
  if(!d || !d.startTime) return;

  let used = Date.now()-d.startTime;

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
  let d = devices[currentDevice];
  if(!d) return;

  d.status="Hỏng";
  db.ref("devices/"+currentDevice).set(d);
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
