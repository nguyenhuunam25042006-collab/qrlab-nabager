let used=Date.now()-d.startTime;
d.totalTime=(d.totalTime||0)+used;

history.push({
device:currentDevice,
user:d.user,
time:used
});

db.ref("history").set(history);
}

d.status="Trống";
d.user="";
d.startTime=null;

db.ref("devices/"+currentDevice).set(d);

}

// ===== ERROR =====
function reportError(){
if(!currentDevice) return;

devices[currentDevice].status="Hỏng";
db.ref("devices/"+currentDevice).set(devices[currentDevice]);
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
html+=`<p>${h.device} - ${h.user} - ${format(h.time)}</p>`;
});

document.getElementById("history").innerHTML=html;

}

// ===== AUTO UPDATE =====
setInterval(()=>{
if(currentDevice) show();
},1000);
