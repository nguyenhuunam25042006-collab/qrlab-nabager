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

                // Bước 1: Thử bóc tách ID từ Link hoặc nội dung QR
                if (rawText.includes("id=")) {
                    foundId = rawText.split("id=").pop().split("&")[0].toUpperCase();
                } else {
                    let match = rawText.match(/TB\d+/i);
                    foundId = match ? match[0].toUpperCase() : rawText.toUpperCase();
                }

                // Bước 2: NẾU QUÉT RA LINK LẠ (Như link rút gọn Me-QR)
                // Hoặc ID không tồn tại trong danh sách 10 máy
                if (!devices[foundId]) {
                    console.log("Dữ liệu QR lạ:", rawText);
                    let manualId = prompt("❌ Không nhận diện được máy!\nVui lòng nhập ID thủ công (Ví dụ: TB001):");
                    if (manualId) {
                        foundId = manualId.toUpperCase().trim();
                    }
                }

                // Bước 3: Kiểm tra và hiển thị
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

// Tự động nhận diện nếu link có ?id=TB...
function checkUrl() {
    let id = new URLSearchParams(window.location.search).get('id');
    if (id && devices[id.toUpperCase()]) { 
        currentDevice = id.toUpperCase(); 
        showDevice(currentDevice); 
    }
}

// Cập nhật đồng hồ nhảy giây
setInterval(() => { 
    if (currentDevice && devices[currentDevice].start) showDevice(currentDevice); 
}, 1000);

checkUrl(); 
updateChart(); 
