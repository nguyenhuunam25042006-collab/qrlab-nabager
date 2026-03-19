let scanner = null;
let currentDevice = "";
let chart = null;

// ===== 1. DỮ LIỆU THIẾT BỊ =====
let devices = JSON.parse(localStorage.getItem("devices")) || {
    "TB001": {name:"Tủ sấy", status:"Trống", user:"", start:null, total:0},
    "TB002": {name:"Hằn lún bánh xe", status:"Trống", user:"", start:null, total:0},
    "TB003": {name:"Marshall", status:"Trống", user:"", start:null, total:0},
    "TB004": {name:"Đầm BTN", status:"Trống", user:"", start:null, total:0},
    "TB005": {name:"Parafin", status:"Trống", user:"", start:null, total:0},
    "TB006": {name:"Kéo dài nhựa", status:"Trống", user:"", start:null, total:0},
    "TB007": {name:"Brookfield", status:"Trống", user:"", start:null, total:0},
    "TB008": {name:"Tổn thất nhựa", status:"Trống", user:"", start:null, total:0},
    "TB009": {name:"Cắt bê tông", status:"Trống", user:"", start:null, total:0},
    "TB010": {name:"Bảo dưỡng bê tông", status:"Trống", user:"", start:null, total:0}
};

// ===== 2. LƯU & ĐỊNH DẠNG =====
function save(){
    localStorage.setItem("devices", JSON.stringify(devices));
}

function formatTime(ms){
    let s = Math.floor(ms/1000);
    let m = Math.floor(s/60);
    return m + "p " + (s % 60) + "s";
}

// ===== 3. QUÉT QR (Sửa lỗi không bấm được) =====
function startScan(){
    if(typeof Html5Qrcode === "undefined"){
        alert("❌ Chưa load thư viện QR");
        return;
    }

    const reader = document.getElementById("reader");
    reader.innerHTML = "";

    if(scanner){
        scanner.stop().then(()=>scanner.clear()).catch(()=>{});
    }

    scanner = new Html5Qrcode("reader");

    Html5Qrcode.getCameras().then(cameras=>{
        if(!cameras.length){ alert("❌ Không có camera"); return; }
        
        let cam = cameras[cameras.length - 1].id;
        scanner.start(cam, {fps:10, qrbox:250}, (text)=>{
            scanner.stop().then(()=>{
                scanner.clear();
                
                let decodedText = text.trim();
                // Bóc tách ID (xử lý link từ Admin)
                if (decodedText.includes("id=")) {
                    currentDevice = decodedText.split("id=").pop().toUpperCase();
                } else {
                    let match = decodedText.match(/TB\d+/i);
                    currentDevice = match ? match[0].toUpperCase() : decodedText.toUpperCase();
                }

                if (navigator.vibrate) navigator.vibrate(200);
                showDevice(currentDevice);
                updateChart();
            }).catch(()=>{});
        }, (err)=>{});
    }).catch(()=>{ alert("❌ Không mở được camera"); });
}

// ===== 4. HIỂN THỊ THIẾT BỊ (Đã tách riêng ra ngoài) =====
function showDevice(id){
    const resultDiv = document.getElementById("result");
    if(!resultDiv) return;

    let d = devices[id];
    if(!d){
        resultDiv.innerHTML="❌ Không tìm thấy thiết bị";
        return;
    }

    let color = d.status === "Đang sử dụng" ? "using" : (d.status === "Bị hỏng" ? "broken" : "free");
    let timeText = d.start ? "⏱ " + formatTime(Date.now() - d.start) : "🕒 " + formatTime(d.total || 0);

    resultDiv.innerHTML = `
        <div class="result" style="text-align:center;">
            <img src="images/${id}.jpg" style="width:180px; height:180px; object-fit:cover; border-radius:15px; margin-bottom:10px;" onerror="this.src='https://via.placeholder.com/150?text=No+Photo'">
            <h3 style="margin:5px 0;">${d.name}</h3>
            <p style="color:#666; margin:0;">${id}</p>
            <span class="badge ${color}">${d.status}</span>
            <p style="margin:10px 0 5px 0;">👤 ND: <b>${d.user || "Chưa có"}</b></p>
            <p style="font-size:1.3em; font-weight:bold; color:#4a6cf7;">${timeText}</p>
        </div>
    `;
}

// ===== 5. ĐIỀU KHIỂN =====
function useDevice(){
    if(!currentDevice) return alert("⚠️ Quét thiết bị trước");
    let name = prompt("Nhập tên người dùng:");
    if(!name) return;

    let d = devices[currentDevice];
    d.status = "Đang sử dụng";
    d.user = name;
    d.start = Date.now();
    save();
    showDevice(currentDevice);
    updateChart();
}

function stopDevice(){
    if(!currentDevice) return;
    let d = devices[currentDevice];
    if(d.start){
        let used = Date.now() - d.start;
        let history = JSON.parse(localStorage.getItem("history")) || [];
        history.push({
            device: d.name, user: d.user,
            time: new Date().toLocaleString(),
            duration: formatTime(used)
        });
        localStorage.setItem("history", JSON.stringify(history));
        d.total += used;
        d.start = null;
    }
    d.status = "Trống"; d.user = "";
    save();
    showDevice(currentDevice);
    updateChart();
}

function errorDevice(){
    if(!currentDevice) return alert("⚠️ Quét thiết bị trước");
    devices[currentDevice].status = "Bị hỏng";
    save();
    showDevice(currentDevice);
    updateChart();
}

// ===== 6. BIỂU ĐỒ =====
function updateChart(){
    let u=0, f=0, b=0;
    Object.values(devices).forEach(d => {
        if(d.status==="Đang sử dụng") u++;
        else if(d.status==="Bị hỏng") b++;
        else f++;
    });

    const ctx = document.getElementById("chart");
    if(!ctx) return;
    if(chart) chart.destroy();
    chart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Đang dùng", "Trống", "Hỏng"],
            datasets: [{ data: [u,f,b], backgroundColor: ["#f1c40f", "#2ecc71", "#e74c3c"] }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// Tự nhận diện link từ QR Admin khi vừa vào trang
function checkUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id && devices[id.toUpperCase()]) {
        currentDevice = id.toUpperCase();
        showDevice(currentDevice);
    }
}

// Cập nhật thời gian nhảy giây
setInterval(() => { if (currentDevice && devices[currentDevice].start) showDevice(currentDevice); }, 1000);

// ===== INIT =====
checkUrl();
updateChart();
