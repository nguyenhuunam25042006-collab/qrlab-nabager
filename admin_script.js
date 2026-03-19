// ===== 1. DATA (Khởi tạo 10 thiết bị) =====
let devices = JSON.parse(localStorage.getItem("devices")) || {
    "TB001": { name: "Tủ sấy", status: "Trống", user: "", total: 0 },
    "TB002": { name: "Thiết bị thí nghiệm hằn lún vết bánh xe", status: "Trống", user: "", total: 0 },
    "TB003": { name: "Thiết bị thí nghiệm Marshall tự động", status: "Trống", user: "", total: 0 },
    "TB004": { name: "Thiết bị đầm bê tông nhựa", status: "Trống", user: "", total: 0 },
    "TB005": { name: "Thiết bị xác định hàm lượng parafin trong nhựa", status: "Trống", user: "", total: 0 },
    "TB006": { name: "Thiết bị xác định độ kéo dài của nhựa", status: "Trống", user: "", total: 0 },
    "TB007": { name: "Thiết bị xác định độ nhớt Brookfield", status: "Trống", user: "", total: 0 },
    "TB008": { name: "Thiết bị xác định độ tổn thất khối lượng của nhựa đường", status: "Trống", user: "", total: 0 },
    "TB009": { name: "Máy cắt mẫu bê tông xi măng", status: "Trống", user: "", total: 0 },
    "TB010": { name: "Thiết bị bảo dưỡng mẫu bê tông xi măng", status: "Trống", user: "", total: 0 }
};

// Lưu lại ngay lần đầu để đồng bộ
localStorage.setItem("devices", JSON.stringify(devices));

// ===== 2. FORMAT TIME =====
function formatTime(ms){
    if(!ms) return "0p 0s";
    let s = Math.floor(ms/1000);
    let m = Math.floor(s/60);
    return m + "p " + (s % 60) + "s";
}

// ===== 3. RENDER (Hiển thị danh sách kèm Ảnh & QR) =====
function render() {
    let keyword = document.getElementById("search").value.toLowerCase();
    let listDiv = document.getElementById("list");
    listDiv.innerHTML = "";

    Object.entries(devices).forEach(([id, d]) => {
        // Lọc tìm kiếm
        if (!d.name.toLowerCase().includes(keyword) && !id.toLowerCase().includes(keyword)) return;

        let color = d.status === "Đang sử dụng" ? "using" : (d.status === "Bị hỏng" ? "broken" : "free");

        let devEl = document.createElement("div");
        devEl.className = "device";
        devEl.innerHTML = `
            <div class="device-info">
                <b style="font-size:16px;">${d.name}</b> <span style="color:#666;">(${id})</span><br>
                <span class="badge ${color}">${d.status}</span><br>
                👤 Người dùng: ${d.user || "Trống"}<br>
                ⏱ Tổng: ${formatTime(d.total)}<br>
                <button class="fix" onclick="fix('${id}')">✔ Đặt về Trống</button>
                <button class="delete" onclick="removeDevice('${id}')">❌ Xóa</button>
            </div>
            <div class="device-media" style="text-align:center;">
                <img src="images/${id}.jpg" class="device-img" onerror="this.src='https://via.placeholder.com/100?text=No+Img'">
                <div id="qr-${id}" class="device-qr" style="margin-top:5px;"></div>
            </div>
        `;
        listDiv.appendChild(devEl);

        // TẠO MÃ QR TỰ ĐỘNG (Dẫn link về trang index của bạn)
        let qrUrl = `https://nguyenhuunam25042006-collab.github.io/qrlab-nabager/index.html?id=${id}`;
        new QRCode(document.getElementById(`qr-${id}`), {
            text: qrUrl,
            width: 90,
            height: 90
        });
    });
}

// ===== 4. CÁC HÀM ĐIỀU KHIỂN =====
function save() {
    localStorage.setItem("devices", JSON.stringify(devices));
    render();
    renderHistory();
}

function fix(id) {
    devices[id].status = "Trống";
    devices[id].user = "";
    devices[id].start = null;
    save();
}

function removeDevice(id) {
    if(confirm("Xóa thiết bị này?")) {
        delete devices[id];
        save();
    }
}

function resetAll() {
    if(confirm("Reset tất cả thiết bị về trạng thái Trống?")) {
        Object.keys(devices).forEach(id => {
            devices[id].status = "Trống";
            devices[id].user = "";
            devices[id].total = 0;
        });
        save();
    }
}

function logout() {
    localStorage.removeItem("role");
    location.href = "./login.html";
}

// ===== 5. LỊCH SỬ =====
function renderHistory() {
    let history = JSON.parse(localStorage.getItem("history")) || [];
    let html = history.slice(-5).reverse().map(h => `
        <div style="font-size:12px; border-bottom:1px solid #eee; padding:5px 0; color:#333;">
            <b>${h.device}</b> - ${h.user}<br>⏱ ${h.duration} (${h.time})
        </div>
    `).join("") || "Chưa có dữ liệu";
    document.getElementById("history").innerHTML = html;
}

// Theo dõi thay đổi từ các tab khác (ví dụ trang User cập nhật máy)
window.addEventListener("storage", () => {
    devices = JSON.parse(localStorage.getItem("devices"));
    render();
    renderHistory();
});

// Khởi chạy
render();
renderHistory();
