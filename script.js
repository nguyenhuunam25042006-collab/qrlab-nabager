let scanner = null;
let currentDevice = "";
let chart = null;

// ===== 1. DỮ LIỆU 10 THIẾT BỊ =====
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

function save() { localStorage.setItem("devices", JSON.stringify(devices)); }
function formatTime(ms) { let s = Math.floor(ms/1000); return Math.floor(s/60) + "p " + (s % 60) + "s"; }

// ===== 2. HÀM QUÉT QR (ĐÃ THÊM TÍNH NĂNG NHẬP TAY KHI LỖI) =====
function startScan() {
    if(typeof Html5Qrcode === "undefined") return alert("❌ Chưa nạp thư viện QR");
    const reader = document.getElementById("reader");
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
                    console.log("Dữ liệu QR lạ:", rawText);
                    let manualId = prompt("❌ Không nhận diện được máy!\nVui lòng nhập ID thủ công (Ví dụ: TB001):");
                    if (manualId) {
                        foundId = manualId.toUpperCase().trim();
                    }
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
    }).catch(err => alert("❌ Không mở được camera: " + err));
}

// ===== 3. HIỂN THỊ THIẾT BỊ =====
function showDevice(id) {
    let d = devices[id];
    let color = d.status === "Đang sử dụng" ? "using" : (d.status === "Bị hỏng" ? "broken" : "free");
    let timeText = d.start ? "⏱ " + formatTime(Date.now() - d.start) : "🕒 " + formatTime(d.total || 0);

    document.getElementById("result").innerHTML = `
        <div style="text-align:center;">
            <img src="images/${id}.jpg" style="width:180px; height:180px; object-fit:cover; border-radius:20px; margin-bottom:10px;" onerror="this.src='https://via.placeholder.com/150?text=No+Photo'">
            <h3>${d.name}</h3>
            <span class="badge ${color}">${d.status}</span>
            <p>👤 ND: <b>${d.user || "Chưa có"}</b></p>
            <p style="font-size:1.4em; font-weight:bold; color:#4a6cf7;">${timeText}</p>
        </div>`;
    
    // Phần mở rộng cho Hàng đợi (Sẽ được gọi tự động)
    renderQueueInfo(id);
}

// ===== 4. ĐIỀU KHIỂN =====
function useDevice() {
    if(!currentDevice) return alert("⚠️ Hãy quét QR!");
    let nameInput = document.getElementById("user-name");
    let name = (nameInput && nameInput.value) ? nameInput.value : prompt("Nhập tên người dùng:");
    
    if(!name) return;
    
    let d = devices[currentDevice];
    if(d.status === "Đang sử dụng") return alert("❌ Máy này đang có người dùng!");
    
    d.status = "Đang sử dụng"; 
    d.user = name; 
    d.start = Date.now();
    save(); 
    showDevice(currentDevice); 
    updateChart();
}

function stopDevice() {
    if(!currentDevice) return;
    let d = devices[currentDevice];
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
        d.total += used; 
        d.start = null;
        alert("✅ Đã kết thúc! Thời gian dùng: " + formatTime(used));
    }
    d.status = "Trống"; 
    d.user = "";
    save(); 
    showDevice(currentDevice); 
    updateChart();
}

function errorDevice() {
    if(!currentDevice) return alert("⚠️ Quét QR trước!");
    if(confirm("Xác nhận báo hỏng thiết bị này?")) {
        devices[currentDevice].status = "Bị hỏng";
        save(); 
        showDevice(currentDevice); 
        updateChart();
    }
}

// ===== 5. BIỂU ĐỒ =====
function updateChart() {
    let u=0, f=0, b=0;
    Object.values(devices).forEach(d => { if(d.status==="Đang sử dụng") u++; else if(d.status==="Bị hỏng") b++; else f++; });
    if(chart) chart.destroy();
    let ctx = document.getElementById("chart");
    if(!ctx) return;
    chart = new Chart(ctx, {
        type: "doughnut",
        data: { 
            labels: ["Dùng","Trống","Hỏng"], 
            datasets: [{ data: [u,f,b], backgroundColor: ["#f1c40f", "#2ecc71", "#e74c3c"] }] 
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function checkUrl() {
    let id = new URLSearchParams(window.location.search).get('id');
    if (id && devices[id.toUpperCase()]) { 
        currentDevice = id.toUpperCase(); 
        showDevice(currentDevice); 
    }
}

setInterval(() => { 
    if (currentDevice && devices[currentDevice].start) showDevice(currentDevice); 
}, 1000);

checkUrl(); 
updateChart();

// ================================================================
// ===== PHẦN THÊM MỚI: TÍNH NĂNG 1 & 2 (KHÔNG SỬA CODE CŨ) =====
// ================================================================

let queues = JSON.parse(localStorage.getItem("queues")) || {};
function saveQueue() { localStorage.setItem("queues", JSON.stringify(queues)); }

// Hàm hiển thị danh sách chờ dưới thông tin thiết bị
function renderQueueInfo(id) {
    let q = queues[id] || [];
    if(q.length > 0) {
        let qHtml = `<div style="margin-top:10px; padding:10px; background:#f8f9fa; border-radius:10px; border:1px dashed #4a6cf7;">
            <p style="margin:0; font-size:0.9em; color:#4a6cf7; font-weight:bold;">📋 Danh sách chờ (${q.length}):</p>
            <p style="margin:5px 0 0 0; font-size:0.85em;">${q.map((item, index) => `${index+1}. ${item.userName}`).join(" | ")}</p>
        </div>`;
        document.getElementById("result").innerHTML += qHtml;
    }
}

// 1. Hàm Đặt chỗ (Join Queue)
function joinQueue() {
    if(!currentDevice) return alert("⚠️ Hãy quét QR thiết bị trước!");
    let name = prompt("Nhập tên của bạn để đăng ký hàng đợi:");
    if(!name) return;

    if(!queues[currentDevice]) queues[currentDevice] = [];
    if(queues[currentDevice].some(q => q.userName === name)) return alert("❌ Bạn đã có trong danh sách!");

    queues[currentDevice].push({ userName: name, time: new Date().toLocaleString() });
    saveQueue();
    alert("✅ Đã thêm vào hàng đợi!");
    showDevice(currentDevice);
}

// 2. Hàm Check-in cho người chờ
function checkInFromQueue() {
    if(!currentDevice || !queues[currentDevice] || queues[currentDevice].length === 0) 
        return alert("⚠️ Không có ai trong danh sách chờ!");

    let nextUser = queues[currentDevice][0].userName;
    if(confirm(`Xác nhận cho ${nextUser} bắt đầu sử dụng?`)) {
        queues[currentDevice].shift();
        saveQueue();
        
        // Ghi đè tạm thời để useDevice dùng tên này
        let d = devices[currentDevice];
        d.status = "Đang sử dụng"; d.user = nextUser; d.start = Date.now();
        save(); showDevice(currentDevice); updateChart();
    }
}

// 3. Hàm hiển thị Nhật ký (Logbook)
function showLogbook() {
    let history = JSON.parse(localStorage.getItem("history")) || [];
    if(history.length === 0) return alert("Chưa có nhật ký nào!");

    let rows = history.slice().reverse().map(h => `
        <tr style="border-bottom:1px solid #eee;">
            <td style="padding:8px;">${h.device}</td>
            <td style="padding:8px;">${h.user}</td>
            <td style="padding:8px;">${h.duration}</td>
        </tr>`).join("");

    document.getElementById("result").innerHTML = `
        <h3>Nhật ký Lab</h3>
        <table style="width:100%; border-collapse:collapse; font-size:0.8em; text-align:left;">
            <thead><tr style="background:#4a6cf7; color:#fff;"><th style="padding:8px;">Máy</th><th style="padding:8px;">Người dùng</th><th style="padding:8px;">Dùng</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>
        <button onclick="downloadCSV()" style="margin-top:10px; background:#27ae60; color:white; border:none; padding:10px; width:100%; border-radius:5px;">Xuất file Excel (CSV)</button>
        <button onclick="showDevice(currentDevice)" style="margin-top:5px; background:#95a5a6; color:white; border:none; padding:10px; width:100%; border-radius:5px;">Quay lại</button>
    `;
}

// 4. Hàm xuất CSV
function downloadCSV() {
    let history = JSON.parse(localStorage.getItem("history")) || [];
    let csv = "\uFEFFThiết bị,Người dùng,Thời gian,Thời lượng\n";
    history.forEach(h => { csv += `${h.device},${h.user},${h.time},${h.duration}\n`; });
    let blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "nhat_ky_lab.csv";
    link.click();
}
