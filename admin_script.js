// ===== 0. PHẦN THÊM MỚI: CẤU HÌNH & KẾT NỐI CLOUD =====
const firebaseConfig = {
    databaseURL: "https://qrlab-c1704-default-rtdb.firebaseio.com"
};

// Khởi tạo Firebase nếu chưa có
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// KHO DỮ LIỆU CÔNG DỤNG (THÊM MỚI ĐỂ BÁO CÁO UTT)
const deviceManuals = {
    "TB001": { usage: "Sấy khô cốt liệu, mẫu vật liệu và dụng cụ thí nghiệm ở nhiệt độ chuẩn." },
    "TB002": { usage: "Mô phỏng tác động tải trọng xe để đánh giá khả năng kháng lún mặt đường." },
    "TB003": { usage: "Xác định độ ổn định và độ dẻo Marshall của bê tông nhựa." },
    "TB004": { usage: "Chế tạo mẫu bê tông nhựa chuẩn bằng phương pháp đầm va đập." },
    "TB005": { usage: "Xác định tỷ lệ sáp (Parafin) để đánh giá độ giòn/mềm của nhựa đường." },
    "TB006": { usage: "Đo độ dẻo và khả năng kéo dài kết dính của nhựa khi chịu lực." },
    "TB007": { usage: "Đo độ nhớt để xác định nhiệt độ trộn và rải tối ưu ngoài công trường." },
    "TB008": { usage: "Đánh giá mức độ lão hóa của nhựa đường dưới tác động nhiệt." },
    "TB009": { usage: "Cắt mẫu bê tông lớn thành các mẫu thử chuẩn hình khối/trụ." },
    "TB010": { usage: "Tạo môi trường nhiệt - ẩm tiêu chuẩn để mẫu bê tông thủy hóa hoàn toàn." }
};

// LẮNG NGHE BIẾN ĐỘNG TỪ USER (Tự động cập nhật khi điện thoại quét mã)
db.ref('devices').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        devices = data; // Ghi đè biến devices bằng dữ liệu Cloud
        render();       // Gọi hàm vẽ lại của bạn
    }
});

// Lắng nghe lịch sử từ Cloud
db.ref('history').on('value', (snapshot) => {
    const histData = snapshot.val();
    if (histData) {
        localStorage.setItem("history", JSON.stringify(histData));
        renderHistory(); // Gọi hàm hiển thị lịch sử của bạn
    }
});

// MỚI CẬP NHẬT: Lắng nghe lịch đặt trước (queues) từ Cloud để báo Admin ngay lập tức
db.ref('queues').on('value', (snapshot) => {
    const queueData = snapshot.val();
    if (queueData) {
        localStorage.setItem("queues", JSON.stringify(queueData));
        render(); // Vẽ lại để cập nhật danh sách đặt lịch
    }
});
// =======================================================

// 1. Kiểm tra quyền admin (GIỮ NGUYÊN)
if(localStorage.getItem("role") !== "admin") {
    location.href = "./login.html";
}

// 2. Dữ liệu 10 thiết bị (Khởi tạo ban đầu)
let devices = JSON.parse(localStorage.getItem("devices")) || {
    "TB001": { name: "Tủ sấy", status: "Trống", user: "", total: 0 },
    "TB002": { name: "Hằn lún bánh xe", status: "Trống", user: "", total: 0 },
    "TB003": { name: "Marshall", status: "Trống", user: "", total: 0 },
    "TB004": { name: "Đầm BTN", status: "Trống", user: "", total: 0 },
    "TB005": { name: "Parafin", status: "Trống", user: "", total: 0 },
    "TB006": { name: "Kéo dài nhựa", status: "Trống", user: "", total: 0 },
    "TB007": { name: "Brookfield", status: "Trống", user: "", total: 0 },
    "TB008": { name: "Tổn thất nhựa", status: "Trống", user: "", total: 0 },
    "TB009": { name: "Cắt bê tông", status: "Trống", user: "", total: 0 },
    "TB010": { name: "Bảo dưỡng bê tông", status: "Trống", user: "", total: 0 }
};

// 3. Định dạng thời gian (GIỮ NGUYÊN)
function formatTime(ms) {
    if(!ms) return "0p 0s";
    let s = Math.floor(ms/1000);
    return Math.floor(s/60) + "p " + (s % 60) + "s";
}

// 4. Hiển thị danh sách thiết bị (ĐÃ CẬP NHẬT LỊCH ĐẶT CHI TIẾT)
function render() {
    let searchInput = document.getElementById("search");
    let keyword = searchInput ? searchInput.value.toLowerCase() : "";
    let listDiv = document.getElementById("list");
    if(!listDiv) return;
    listDiv.innerHTML = "";

    // Lấy dữ liệu lịch đăng ký (queues) từ local (đã đồng bộ Cloud)
    let queues = JSON.parse(localStorage.getItem("queues")) || {};

    Object.entries(devices).forEach(([id, d]) => {
        if (!d.name.toLowerCase().includes(keyword) && !id.toLowerCase().includes(keyword)) return;

        let color = d.status === "Đang sử dụng" ? "using" : (d.status === "Bị hỏng" ? "broken" : "free");
        
        // CẬP NHẬT: Hiển thị chi tiết lịch đặt trước
        let q = queues[id] || [];
        let queueHtml = "";
        if(q.length > 0) {
            let listItems = q.slice(0, 2).map(item => 
                `<div style="font-size:10px; color:#e67e22; border-left:2px solid #f39c12; padding-left:5px; margin-top:3px;">
                    👤 ${item.userName}: <b>${item.bookTime}</b> (${item.estimated})
                </div>`
            ).join("");
            queueHtml = `<div style="margin-top:5px; background:rgba(243,156,18,0.05); padding:5px; border-radius:5px;">
                <small style="color:#f39c12; font-weight:bold;">📅 ĐẶT TRƯỚC (${q.length}):</small>
                ${listItems}
            </div>`;
        } else {
            queueHtml = `<br><small style="color:#888;">(Chưa có lịch đặt)</small>`;
        }

        let devEl = document.createElement("div");
        devEl.className = "device";
        devEl.innerHTML = `
            <div class="device-info">
                <b>${d.name}</b> (${id})
                ${queueHtml}
                <p style="margin:4px 0; font-size:11px; color:#888; line-height:1.2;">${deviceManuals[id]?.usage || ""}</p>
                <span class="badge ${color}">${d.status}</span><br>
                <small>ND: <b>${d.user || "Trống"}</b> | Tổng: ${formatTime(d.total)}</small><br>
                <button class="fix" onclick="fix('${id}')">✔ Reset máy</button>
            </div>
            <div class="device-media">
                <img src="images/${id}.jpg" class="device-img" onerror="this.src='https://via.placeholder.com/100?text=No+Photo'">
                <div id="qr-${id}" class="device-qr" onclick="zoomQR('${id}', '${d.name}')" title="Bấm để phóng to"></div>
            </div>
        `;
        listDiv.appendChild(devEl);

        let qrUrl = `https://nguyenhuunam25042006-collab.github.io/qrlab-nabager/index.html?id=${id}`;
        new QRCode(document.getElementById(`qr-${id}`), { text: qrUrl, width: 100, height: 100 });
    });
}

// 5. HIỂN THỊ LỊCH SỬ (GIỮ NGUYÊN)
function renderHistory() {
    let history = JSON.parse(localStorage.getItem("history")) || [];
    let historyDiv = document.getElementById("history-list");
    if(!historyDiv) return;

    if(history.length === 0) {
        historyDiv.innerHTML = "Chưa có dữ liệu lịch sử.";
        return;
    }

    historyDiv.innerHTML = history.slice(-10).reverse().map(h => `
        <div style="font-size:13px; border-bottom:1px solid #eee; padding:8px 0; color:#333;">
            <b style="color:#4a6cf7;">${h.device}</b> - 👤 ${h.user}<br>
            <small>⏱ ${h.duration} | 📅 ${h.time}</small>
        </div>
    `).join("");
}

// 6. PHÓNG TO QR (GIỮ NGUYÊN)
function zoomQR(id, name) {
    const modalName = document.getElementById("modal-name");
    const bigQrDiv = document.getElementById("big-qr");
    const modal = document.getElementById("qrModal");
    
    if(!modal || !bigQrDiv) return;

    modalName.innerText = name + " (" + id + ")";
    bigQrDiv.innerHTML = ""; 
    
    let qrUrl = `https://nguyenhuunam25042006-collab.github.io/qrlab-nabager/index.html?id=${id}`;
    new QRCode(bigQrDiv, { text: qrUrl, width: 280, height: 280 });
    
    modal.style.display = "flex";
}

function closeQR() {
    const modal = document.getElementById("qrModal");
    if(modal) modal.style.display = "none";
}

// 7. CÁC HÀM ĐIỀU KHIỂN
function fix(id) { 
    devices[id].status = "Trống"; 
    devices[id].user = ""; 
    devices[id].start = null; 
    save(); 
}

function save() { 
    localStorage.setItem("devices", JSON.stringify(devices)); 
    db.ref('devices').set(devices); 
    render(); 
    renderHistory();
}

function resetAll() {
    if(confirm("Reset tất cả trạng thái và xóa lịch sử?")) {
        Object.keys(devices).forEach(id => { 
            devices[id].status = "Trống"; 
            devices[id].user = "";
            devices[id].total = 0; 
        });
        localStorage.removeItem("history");
        db.ref('history').remove();
        save();
    }
}

function logout() { 
    localStorage.removeItem("role"); 
    location.href = "./login.html"; 
}

// 8. TỰ ĐỘNG CẬP NHẬT (GIỮ NGUYÊN)
window.addEventListener("storage", () => {
    devices = JSON.parse(localStorage.getItem("devices"));
    render();
    renderHistory();
});

setInterval(() => {
    renderHistory();
}, 2000);

// Khởi chạy
render();
renderHistory();
