const formLink="https://forms.gle/swQgBUYASe1Hinaw7";

let lastDevice="";
let history=[];

loadDevices();

function startScan(){

const html5QrCode=new Html5Qrcode("reader");

html5QrCode.start(
{facingMode:"environment"},
{fps:10,qrbox:250},
(qrCodeMessage)=>{

lastDevice=qrCodeMessage.trim();

checkDevice(lastDevice);

html5QrCode.stop();

}
);

}

function checkDevice(deviceId){

deviceId=deviceId.toUpperCase();

const device=devices[deviceId];

if(!device){

document.getElementById("result").innerHTML="❌ Không tìm thấy thiết bị";

return;

}

let status="";

if(device.status==="free") status="🟢 Trống";

if(device.status==="using") status="🟡 Đang sử dụng";

if(device.status==="broken") status="🔴 Bị hỏng";

document.getElementById("result").innerHTML=
"<b>Thiết bị:</b> "+device.name+"<br>"+status;

history.unshift({

device:device.name,
time:new Date().toLocaleString()

});

updateHistory();

}

function updateHistory(){

let table="";

history.forEach(h=>{

table+=`
<tr>
<td>${h.device}</td>
<td>${h.time}</td>
</tr>
`;

});

document.getElementById("historyTable").innerHTML=table;

}

function loadDevices(){

let table="";

for(let id in devices){

let status="";

if(devices[id].status==="free") status="🟢 Trống";

if(devices[id].status==="using") status="🟡 Đang sử dụng";

if(devices[id].status==="broken") status="🔴 Bị hỏng";

table+=`
<tr>
<td>${id}</td>
<td>${status}</td>
</tr>
`;

}

document.getElementById("deviceTable").innerHTML=table;

}

function report(){

if(lastDevice===""){

alert("Quét thiết bị trước");

return;

}

window.open(formLink,"_blank");

}
