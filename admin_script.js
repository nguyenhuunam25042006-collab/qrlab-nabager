// ===== 0. PHẦN THÊM MỚI: CẤU HÌNH & KẾT NỐI CLOUD =====
const firebaseConfig = {
    databaseURL: "https://qrlab-c1704-default-rtdb.firebaseio.com"
};

// Khởi tạo Firebase nếu chưa có
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

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

// 4. Hiển thị danh sách thiết bị (GIỮ NGUYÊN)
function render() {
    let searchInput = document.getElementById("search");
    let keyword = searchInput ? searchInput.value.toLowerCase() : "";
    let listDiv = document.getElementById("list");
    if(!listDiv) return;
    listDiv.innerHTML = "";

    Object.entries(devices).forEach(([id, d]) => {
        if (!d.name.toLowerCase().includes(keyword) && !id.toLowerCase().includes(keyword)) return;

        let color = d.status === "Đang sử dụng" ? "using" : (d.status === "Bị hỏng" ? "broken" : "free");

        let devEl = document.createElement("div");
        devEl.className = "device";
        devEl.innerHTML = `
            <div class="device-info">
                <b>${d.name}</b> (${id})<br>
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

// 7. CÁC HÀM ĐIỀU KHIỂN (THÊM LỆNH ĐẨY CLOUD VÀO SAVE)
function fix(id) { 
    devices[id].status = "Trống"; 
    devices[id].user = ""; 
    devices[id].start = null; 
    save(); 
}

function save() { 
    localStorage.setItem("devices", JSON.stringify(devices)); 
    // THÊM: Đồng bộ lên Cloud để User cũng thấy máy đã Reset
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
        // THÊM: Xóa lịch sử trên Cloud
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
