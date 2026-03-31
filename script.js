// ===== 0. CẤU HÌNH FIREBASE =====
const firebaseConfig = {
    databaseURL: "https://qrlab-c1704-default-rtdb.firebaseio.com"
};
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

let scanner = null;
let currentDevice = "";
let chart = null;

// ===== 1. DỮ LIỆU THIẾT BỊ (Nên có khung mặc định để tránh lỗi undefined) =====
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

// LẮNG NGHE DỮ LIỆU TỪ CLOUD
db.ref('devices').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        devices = data;
        localStorage.setItem("devices", JSON.stringify(devices));
        // Nếu đang ở màn hình thiết bị nào đó thì cập nhật lại thông tin hiển thị ngay
        if (currentDevice) showDevice(currentDevice);
        updateChart();
    }
});

function save() { 
    localStorage.setItem("devices", JSON.stringify(devices)); 
    db.ref('devices').set(devices);
}

function formatTime(ms) { 
    if(!ms || ms < 0) return "0p 0s";
    let s = Math.floor(ms/1000); 
    return Math.floor(s/60) + "p " + (s % 60) + "s"; 
}

// ===== 2. HÀM QUÉT QR (GIỮ NGUYÊN) =====
function startScan() {
    if(typeof Html5Qrcode === "undefined") return alert("❌ Chưa nạp thư viện QR");
    const reader = document.getElementById("reader");
    if(!reader) return;
    reader.innerHTML = "";
    if(scanner) scanner.stop().then(()=>scanner.clear()).catch(()=>{});
    scanner = new Html5Qrcode("reader");

    Html5Qrcode.getCameras().then(cameras => {
        let cam = cameras[cameras.length - 1].id;
        scanner.start(cam, {fps:10, qrbox:250}, (text) => {
            scanner.stop().then(() => {
                scanner.clear();
                let rawText = text.trim();
                let foundId = "";

                if (rawText.includes("id=")) {
                    foundId = rawText.split("id=").pop().split("&")[0].toUpperCase();
                } else {
                    let match = rawText.match(/TB\d+/i);
                    foundId = match ? match[0].toUpperCase() : rawText.toUpperCase();
                }

                if (!devices[foundId]) {
                    let manualId = prompt("❌ Không nhận diện được máy!\nNhập ID thủ công (Ví dụ: TB001):");
                    if (manualId) foundId = manualId.toUpperCase().trim();
                }

                if (devices[foundId]) {
                    currentDevice = foundId;
                    if (navigator.vibrate) navigator.vibrate(200);
                    showDevice(currentDevice);
                    updateChart();
                } else if (foundId !== "") {
                    alert("❌ Thiết bị " + foundId + " không tồn tại!");
                }
            });
        });
    }).catch(err => alert("❌ Lỗi Camera: " + err));
}

// ===== 3. HIỂN THỊ THIẾT BỊ (TỐI ƯU CẬP NHẬT) =====
function showDevice(id) {
    let d = devices[id];
    if(!d) return;
    let colorClass = d.status === "Đang sử dụng" ? "using" : (d.status === "Bị hỏng" ? "broken" : "free");
    
    // Tính toán thời gian thực nếu đang sử dụng
    let timeText = d.start ? "⏱ " + formatTime(Date.now() - d.start) : "🕒 " + formatTime(d.total || 0);

    const resultDiv = document.getElementById("result");
    if(!resultDiv) return;

    resultDiv.innerHTML = `
        <div style="text-align:center; animation: fadeIn 0.5s ease;">
            <img src="images/${id}.jpg" style="width:180px; height:180px; object-fit:cover; border-radius:20px; margin-bottom:10px; border: 2px solid var(--glass-border);" onerror="this.src='https://via.placeholder.com/150?text=No+Photo'">
            <h3 style="color: var(--primary-neon); margin: 10px 0;">${d.name}</h3>
            <span class="badge ${colorClass}">${d.status}</span>
            <p style="margin-top:15px; font-size: 0.9em; color: rgba(255,255,255,0.7);">👤 NGƯỜI DÙNG: <b style="color: white;">${d.user || "ĐANG TRỐNG"}</b></p>
            <p style="font-size:1.6em; font-weight:bold; color: var(--primary-neon); text-shadow: 0 0 10px rgba(0,242,254,0.5);">${timeText}</p>
        </div>`;
    
    renderQueueInfo(id);
}

// ===== 4. ĐIỀU KHIỂN VẬN HÀNH =====
function useDevice() {
    if(!currentDevice) return alert("⚠️ Vui lòng quét mã QR trước!");
    let nameInput = document.getElementById("user-name");
    let name = (nameInput && nameInput.value) ? nameInput.value : prompt("Nhập tên người sử dụng:");
    
    if(!name) return;
    
    let d = devices[currentDevice];
    if(d.status === "Đang sử dụng") return alert("❌ Thiết bị này đang có người sử dụng!");
    if(d.status === "Bị hỏng") return alert("❌ Thiết bị đang hỏng, không thể sử dụng!");
    
    d.status = "Đang sử dụng"; 
    d.user = name; 
    d.start = Date.now();
    save(); 
}

function stopDevice() {
    if(!currentDevice) return;
    let d = devices[currentDevice];
    if(d.status !== "Đang sử dụng") return;

    if(d.start) {
        let used = Date.now() - d.start;
        let history = JSON.parse(localStorage.getItem("history")) || [];
        history.push({ 
            device: d.name, 
            user: d.user, 
            time: new Date().toLocaleString(), 
            duration: formatTime(used) 
        });
        localStorage.setItem("history", JSON.stringify(history));
        db.ref('history').set(history);

        d.total += used; 
        d.start = null;
    }
    d.status = "Trống"; 
    d.user = "";
    save(); 
}

function errorDevice() {
    if(!currentDevice) return alert("⚠️ Vui lòng quét QR thiết bị!");
    if(confirm("Xác nhận báo cáo sự cố kỹ thuật cho máy này?")) {
        devices[currentDevice].status = "Bị hỏng";
        save(); 
    }
}

// ===== 5. BIỂU ĐỒ TRẠNG THÁI =====
function updateChart() {
    let u=0, f=0, b=0;
    Object.values(devices).forEach(d => { 
        if(d.status==="Đang sử dụng") u++; 
        else if(d.status==="Bị hỏng") b++; 
        else f++; 
    });
    
    let ctx = document.getElementById("chart");
    if(!ctx) return;

    if(chart) chart.destroy();
    chart = new Chart(ctx, {
        type: "doughnut",
        data: { 
            labels: ["Đang dùng","Trống","Bị hỏng"], 
            datasets: [{ 
                data: [u,f,b], 
                backgroundColor: ["#f1c40f", "#2ecc71", "#e74c3c"],
                borderWidth: 0
            }] 
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: 'white' } } }
        }
    });
}

function checkUrl() {
    let id = new URLSearchParams(window.location.search).get('id');
    if (id) { 
        currentDevice = id.toUpperCase(); 
        if(devices[currentDevice]) showDevice(currentDevice);
    }
}

// Cập nhật đồng hồ mỗi giây
setInterval(() => { 
    if (currentDevice && devices[currentDevice] && devices[currentDevice].status === "Đang sử dụng") {
        showDevice(currentDevice);
    }
}, 1000);

// Khởi chạy
checkUrl();
updateChart();

// ===== PHẦN MỞ RỘNG: HÀNG ĐỢI =====
let queues = JSON.parse(localStorage.getItem("queues")) || {};
db.ref('queues').on('value', (snapshot) => {
    if(snapshot.val()) {
        queues = snapshot.val();
        localStorage.setItem("queues", JSON.stringify(queues));
        if(currentDevice) showDevice(currentDevice);
    }
});

function saveQueue() { 
    localStorage.setItem("queues", JSON.stringify(queues)); 
    db.ref('queues').set(queues);
}

function renderQueueInfo(id) {
    let q = queues[id] || [];
    if(q.length > 0) {
        let qHtml = `<div style="margin-top:15px; padding:12px; background:rgba(0,242,254,0.05); border-radius:15px; border:1px dashed var(--primary-neon);">
            <p style="margin:0; font-size:0.85em; color:var(--primary-neon); font-weight:bold;">📋 DANH SÁCH CHỜ (${q.length}):</p>
            <p style="margin:5px 0 0 0; font-size:0.8em; color:rgba(255,255,255,0.8);">${q.map((item, index) => `${index+1}. ${item.userName}`).join(" | ")}</p>
        </div>`;
        const resultDiv = document.getElementById("result");
        if(resultDiv) resultDiv.innerHTML += qHtml;
    }
}

function joinQueue() {
    if(!currentDevice) return alert("⚠️ Hãy quét QR thiết bị!");
    let name = prompt("Nhập tên để đăng ký hàng đợi:");
    if(!name) return;
    if(!queues[currentDevice]) queues[currentDevice] = [];
    if(queues[currentDevice].some(q => q.userName === name)) return alert("❌ Bạn đã có tên trong danh sách chờ!");
    queues[currentDevice].push({ userName: name, time: new Date().toLocaleString() });
    saveQueue();
    alert("✅ Đăng ký hàng chờ thành công!");
}

function checkInFromQueue() {
    if(!currentDevice || !queues[currentDevice] || queues[currentDevice].length === 0) 
        return alert("⚠️ Không có ai trong danh sách chờ!");
    let nextUser = queues[currentDevice][0].userName;
    if(confirm(`Xác nhận quyền sử dụng cho: ${nextUser}?`)) {
        queues[currentDevice].shift();
        saveQueue();
        let d = devices[currentDevice];
        d.status = "Đang sử dụng"; d.user = nextUser; d.start = Date.now();
        save();
    }
}
