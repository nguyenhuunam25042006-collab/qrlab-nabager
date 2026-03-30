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

// ===== 2. HÀM QUÉT QR (CÔNG NGHỆ) =====
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

// ===== 3. HIỂN THỊ THIẾT BỊ (CYBER STYLE) =====
function showDevice(id) {
    let d = devices[id];
    let colorClass = d.status === "Đang sử dụng" ? "using" : (d.status === "Bị hỏng" ? "broken" : "free");
    let timeText = d.start ? "⏱ " + formatTime(Date.now() - d.start) : "🕒 " + formatTime(d.total || 0);

    document.getElementById("result").innerHTML = `
        <div style="text-align:center; animation: fadeIn 0.5s ease;">
            <img src="images/${id}.jpg" style="width:180px; height:180px; object-fit:cover; border-radius:20px; margin-bottom:10px; border: 2px solid var(--glass-border);" onerror="this.src='https://via.placeholder.com/150?text=No+Photo'">
            <h3 style="color: var(--primary-neon); margin: 10px 0;">${d.name}</h3>
            <span class="badge ${colorClass}">${d.status}</span>
            <p style="margin-top:15px; font-size: 0.9em; color: rgba(255,255,255,0.7);">👤 OPERATOR: <b style="color: white;">${d.user || "VACANT"}</b></p>
            <p style="font-size:1.6em; font-weight:bold; color: var(--primary-neon); text-shadow: 0 0 10px rgba(0,242,254,0.5);">${timeText}</p>
        </div>`;
    
    renderQueueInfo(id);
}

// ===== 4. ĐIỀU KHIỂN =====
function useDevice() {
    if(!currentDevice) return alert("⚠️ Quét mã QR trước!");
    let nameInput = document.getElementById("user-name");
    let name = (nameInput && nameInput.value) ? nameInput.value : prompt("Nhập định danh người dùng:");
    
    if(!name) return;
    
    let d = devices[currentDevice];
    if(d.status === "Đang sử dụng") return alert("❌ Thiết bị đang trong phiên vận hành!");
    
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
    }
    d.status = "Trống"; 
    d.user = "";
    save(); 
    showDevice(currentDevice); 
    updateChart();
}

function errorDevice() {
    if(!currentDevice) return alert("⚠️ Quét QR mã máy!");
    if(confirm("Xác nhận báo cáo sự cố kỹ thuật?")) {
        devices[currentDevice].status = "Bị hỏng";
        save(); 
        showDevice(currentDevice); 
        updateChart();
    }
}

// ===== 5. BIỂU ĐỒ (NEON) =====
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
            datasets: [{ 
                data: [u,f,b], 
                backgroundColor: ["#f1c40f", "#2ecc71", "#e74c3c"],
                borderWidth: 0,
                hoverOffset: 10
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
// ===== PHẦN MỞ RỘNG: HÀNG ĐỢI & NHẬT KÝ (GIAO DIỆN MỚI) =====
// ================================================================

let queues = JSON.parse(localStorage.getItem("queues")) || {};
function saveQueue() { localStorage.setItem("queues", JSON.stringify(queues)); }

function renderQueueInfo(id) {
    let q = queues[id] || [];
    if(q.length > 0) {
        let qHtml = `<div style="margin-top:15px; padding:12px; background:rgba(0,242,254,0.05); border-radius:15px; border:1px dashed var(--primary-neon);">
            <p style="margin:0; font-size:0.85em; color:var(--primary-neon); font-weight:bold;">📋 QUEUE LIST (${q.length}):</p>
            <p style="margin:5px 0 0 0; font-size:0.8em; color:rgba(255,255,255,0.8);">${q.map((item, index) => `${index+1}. ${item.userName}`).join(" | ")}</p>
        </div>`;
        document.getElementById("result").innerHTML += qHtml;
    }
}

function joinQueue() {
    if(!currentDevice) return alert("⚠️ Hãy quét QR thiết bị!");
    let name = prompt("Nhập định danh để đăng ký hàng chờ:");
    if(!name) return;
    if(!queues[currentDevice]) queues[currentDevice] = [];
    if(queues[currentDevice].some(q => q.userName === name)) return alert("❌ Định danh đã tồn tại trong hàng chờ!");
    queues[currentDevice].push({ userName: name, time: new Date().toLocaleString() });
    saveQueue();
    alert("✅ Đăng ký hàng chờ thành công!");
    showDevice(currentDevice);
}

function checkInFromQueue() {
    if(!currentDevice || !queues[currentDevice] || queues[currentDevice].length === 0) 
        return alert("⚠️ Không có dữ liệu hàng chờ!");
    let nextUser = queues[currentDevice][0].userName;
    if(confirm(`Xác nhận quyền vận hành cho: ${nextUser}?`)) {
        queues[currentDevice].shift();
        saveQueue();
        let d = devices[currentDevice];
        d.status = "Đang sử dụng"; d.user = nextUser; d.start = Date.now();
        save(); showDevice(currentDevice); updateChart();
    }
}

function showLogbook() {
    let history = JSON.parse(localStorage.getItem("history")) || [];
    if(history.length === 0) return alert("Nhật ký trống!");

    let rows = history.slice().reverse().map(h => `
        <tr style="border-bottom:1px solid var(--glass-border);">
            <td style="padding:10px;">${h.device}</td>
            <td style="padding:10px;">${h.user}</td>
            <td style="padding:10px; color:var(--primary-neon);">${h.duration}</td>
        </tr>`).join("");

    document.getElementById("result").innerHTML = `
        <h3 style="color:var(--primary-neon); text-transform:uppercase; letter-spacing:2px;">LAB LOGBOOK</h3>
        <div style="max-height: 250px; overflow-y: auto;">
            <table style="width:100%; border-collapse:collapse; font-size:0.8em; text-align:left; color: white;">
                <thead><tr style="background:rgba(255,255,255,0.1); color:var(--primary-neon);"><th style="padding:10px;">UNIT</th><th style="padding:10px;">USER</th><th style="padding:10px;">TIME</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
        <button onclick="downloadCSV()" style="margin-top:15px; background:var(--primary-neon); color:black; border:none; padding:12px; width:100%; border-radius:12px; font-weight:bold;">📥 EXPORT EXCEL (CSV)</button>
        <button onclick="showDevice(currentDevice)" style="margin-top:10px; background:transparent; border:1px solid var(--glass-border); color:white; padding:10px; width:100%; border-radius:12px;">⬅ RETURN</button>
    `;
}

function downloadCSV() {
    let history = JSON.parse(localStorage.getItem("history")) || [];
    let csv = "\uFEFFThiết bị,Người dùng,Thời gian,Thời lượng\n";
    history.forEach(h => { csv += `${h.device},${h.user},${h.time},${h.duration}\n`; });
    let blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "LAB_LOGBOOK.csv";
    link.click();
}
