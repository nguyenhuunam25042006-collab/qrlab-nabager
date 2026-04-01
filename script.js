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

// ===== PHẦN MỚI: KHO DỮ LIỆU CÔNG DỤNG & QUY TRÌNH (Dành cho gọi vốn UTT) =====
const deviceManuals = {
    "TB001": { usage: "Sấy khô cốt liệu, mẫu vật liệu và dụng cụ thí nghiệm ở nhiệt độ chuẩn.", manual: "Cài đặt 105-110°C, xếp mẫu đều, đóng chặt cửa." },
    "TB002": { usage: "Mô phỏng tác động tải trọng xe để đánh giá khả năng kháng lún mặt đường.", manual: "Lắp mẫu vào khuôn, cài nhiệt độ 60°C, thiết lập số chu kỳ chạy." },
    "TB003": { usage: "Xác định độ ổn định và độ dẻo Marshall của bê tông nhựa.", manual: "Ngâm mẫu 60°C (30-40p), đặt vào bộ gá nén, bấm START." },
    "TB004": { usage: "Chế tạo mẫu bê tông nhựa chuẩn bằng phương pháp đầm va đập.", manual: "Cho hỗn hợp vào khuôn, cài số chày đầm (50-75 lần), bấm máy." },
    "TB005": { usage: "Xác định tỷ lệ sáp (Parafin) để đánh giá độ giòn/mềm của nhựa đường.", manual: "Tuân thủ quy trình chiết tách nhiệt độ thấp theo tiêu chuẩn ngành." },
    "TB006": { usage: "Đo độ dẻo và khả năng kéo dài kết dính của nhựa khi chịu lực.", manual: "Đổ nhựa vào khuôn, đặt vào bể ổn nhiệt, cài tốc độ kéo chuẩn." },
    "TB007": { usage: "Đo độ nhớt để xác định nhiệt độ trộn và rải tối ưu ngoài công trường.", manual: "Lựa chọn kim đo phù hợp, cài đặt tốc độ quay và nhiệt độ thử." },
    "TB008": { usage: "Đánh giá mức độ lão hóa của nhựa đường dưới tác động nhiệt.", manual: "Cân mẫu trước/sau khi sấy trong bình xoay nhiệt độ cao." },
    "TB009": { usage: "Cắt mẫu bê tông lớn thành các mẫu thử chuẩn hình khối/trụ.", manual: "Cố định mẫu chặt, sử dụng nước làm mát lưỡi cắt liên tục." },
    "TB010": { usage: "Tạo môi trường nhiệt - ẩm tiêu chuẩn để mẫu bê tông thủy hóa hoàn toàn.", manual: "Kiểm tra mực nước và nhiệt độ bể bảo dưỡng ngày (27±2°C)." }
};

// --- CHÈN THÊM: LẮNG NGHE CÔNG DỤNG TỪ CLOUD ---
db.ref('deviceManuals').on('value', (snapshot) => {
    if(snapshot.val()) {
        Object.assign(deviceManuals, snapshot.val());
        if(currentDevice) showDevice(currentDevice);
    }
});
// ----------------------------------------------

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

// LẮNG NGHE DỮ LIỆU TỪ CLOUD
db.ref('devices').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        devices = data;
        localStorage.setItem("devices", JSON.stringify(devices));
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

// ===== 3. HIỂN THỊ THIẾT BỊ (CHÈN THÊM LOGIC ẢNH) =====
function showDevice(id) {
    let d = devices[id];
    if(!d) return;

    // --- CHÈN THÊM: ƯU TIÊN LẤY ẢNH TỪ CLOUD ---
    let imgSource = (d.image && d.image !== "") ? d.image : `images/${id}.jpg`;
    // ------------------------------------------

    let colorClass = d.status === "Đang sử dụng" ? "using" : (d.status === "Bị hỏng" ? "broken" : "free");
    let timeText = d.start ? "⏱ " + formatTime(Date.now() - d.start) : "🕒 " + formatTime(d.total || 0);

    const resultDiv = document.getElementById("result");
    if(!resultDiv) return;

    const info = deviceManuals[id] || { usage: "Đang cập nhật...", manual: "Liên hệ cán bộ phòng Lab." };

    resultDiv.innerHTML = `
        <div style="text-align:center; animation: fadeIn 0.5s ease;">
            <img src="${imgSource}" style="width:180px; height:180px; object-fit:cover; border-radius:20px; margin-bottom:10px; border: 2px solid var(--glass-border);" onerror="this.src='https://via.placeholder.com/150?text=No+Photo'">
            
            <h3 style="color: var(--primary-neon); margin: 10px 0;">${d.name}</h3>
            <span class="badge ${colorClass}">${d.status}</span>
            <p style="margin-top:15px; font-size: 0.9em; color: rgba(255,255,255,0.7);">👤 NGƯỜI DÙNG: <b style="color: white;">${d.user || "ĐANG TRỐNG"}</b></p>
            <p style="font-size:1.6em; font-weight:bold; color: var(--primary-neon); text-shadow: 0 0 10px rgba(0,242,254,0.5);">${timeText}</p>
            
            <div style="margin-top:20px; text-align:left; background:rgba(0,242,254,0.05); padding:15px; border-radius:15px; border:1px solid var(--glass-border); animation: fadeInUp 0.5s ease;">
                <h4 style="color:var(--primary-neon); margin: 0 0 5px 0; font-size: 13px;">📘 CÔNG DỤNG:</h4>
                <p style="font-size:12px; color:#ccc; margin-bottom: 10px;">${info.usage}</p>
                <h4 style="color:var(--primary-neon); margin: 0 0 5px 0; font-size: 13px;">🛠 QUY TRÌNH CHUẨN:</h4>
                <p style="font-size:12px; color:#ccc; line-height:1.4;">${info.manual}</p>
            </div>
        </div>`;
    
    renderQueueInfo(id);
}

// ===== 4. ĐIỀU KHIỂN VẬN HÀNH (GIỮ NGUYÊN) =====
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

// ===== 5. BIỂU ĐỒ TRẠNG THÁI (GIỮ NGUYÊN) =====
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
            responsive: true, maintainAspectRatio: false,
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

setInterval(() => { 
    if (currentDevice && devices[currentDevice] && devices[currentDevice].status === "Đang sử dụng") {
        showDevice(currentDevice);
    }
}, 1000);

checkUrl();
updateChart();

// ===== PHẦN MỞ RỘNG: LỊCH ĐĂNG KÝ (GIỮ NGUYÊN) =====
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
            <p style="margin:0; font-size:0.85em; color:var(--primary-neon); font-weight:bold;">📅 DANH SÁCH LỊCH ĐÃ ĐẶT (${q.length}):</p>
            <div style="margin-top:5px;">
                ${q.map((item, index) => `
                    <div style="font-size:0.8em; color:rgba(255,255,255,0.8); border-bottom:1px solid rgba(255,255,255,0.1); padding:5px 0;">
                        ${index+1}. <b>${item.userName}</b> <br>
                        ⏱ Lịch: <span style="color:#00f2fe;">${item.bookTime}</span> (Dùng: ${item.estimated})
                    </div>
                `).join("")}
            </div>
        </div>`;
        const resultDiv = document.getElementById("result");
        if(resultDiv) resultDiv.innerHTML += qHtml;
    }
}

function joinQueue() {
    if(!currentDevice) return alert("⚠️ Hãy quét QR thiết bị để đặt lịch!");
    let nameInput = document.getElementById("user-name");
    let name = (nameInput && nameInput.value) ? nameInput.value : prompt("Nhập tên để đặt lịch sử dụng:");
    if(!name) return;
    let dateTime = prompt("Nhập Ngày & Giờ muốn sử dụng (Ví dụ: 14:30 05/04/2026):", 
        new Date().getHours() + ":" + new Date().getMinutes() + " " + new Date().toLocaleDateString('vi-VN'));
    if(!dateTime) return;
    let duration = prompt("Bạn dự kiến sử dụng trong bao lâu? (VD: 30 phút, 1 tiếng...)", "1 tiếng");
    if(!duration) return;
    if(!queues[currentDevice]) queues[currentDevice] = [];
    if(queues[currentDevice].some(q => q.userName === name)) return alert("❌ Bạn đã có tên trong danh sách đăng ký của máy này!");
    queues[currentDevice].push({ 
        userName: name, 
        bookTime: dateTime,
        estimated: duration 
    });
    saveQueue();
    alert(`✅ Đã đặt lịch thành công cho: ${name} vào lúc ${dateTime}`);
    showDevice(currentDevice);
}

function checkInFromQueue() {
    if(!currentDevice || !queues[currentDevice] || queues[currentDevice].length === 0) 
        return alert("⚠️ Không có ai trong lịch đăng ký!");
    let nextUser = queues[currentDevice][0].userName;
    if(confirm(`Xác nhận quyền sử dụng cho: ${nextUser}?`)) {
        queues[currentDevice].shift();
        saveQueue();
        let d = devices[currentDevice];
        d.status = "Đang sử dụng"; d.user = nextUser; d.start = Date.now();
        save();
    }
}

// Khởi chạy
renderHistory();
renderBookingTable(); // Nếu bro có hàm này ở đâu đó
