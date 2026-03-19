// 1. Kiểm tra quyền admin
if(localStorage.getItem("role") !== "admin") {
    location.href = "./login.html";
}

// 2. Dữ liệu 10 thiết bị
let devices = JSON.parse(localStorage.getItem("devices")) || {
    "TB001": { name: "Tủ sấy", status: "Trống", total: 0 },
    "TB002": { name: "Thiết bị thí nghiệm hằn lún vết bánh xe", status: "Trống", total: 0 },
    "TB003": { name: "Thiết bị thí nghiệm Marshall tự động", status: "Trống", total: 0 },
    "TB004": { name: "Thiết bị đầm bê tông nhựa", status: "Trống", total: 0 },
    "TB005": { name: "Thiết bị xác định hàm lượng parafin trong nhựa", status: "Trống", total: 0 },
    "TB006": { name: "Thiết bị xác định độ kéo dài của nhựa", status: "Trống", total: 0 },
    "TB007": { name: "Thiết bị xác định độ nhớt Brookfield", status: "Trống", total: 0 },
    "TB008": { name: "Thiết bị xác định độ tổn thất khối lượng của nhựa đường", status: "Trống", total: 0 },
    "TB009": { name: "Máy cắt mẫu bê tông xi măng", status: "Trống", total: 0 },
    "TB010": { name: "Thiết bị bảo dưỡng mẫu bê tông xi măng", status: "Trống", total: 0 }
};

// 3. Định dạng thời gian
function formatTime(ms) {
    if(!ms) return "0p 0s";
    let s = Math.floor(ms/1000);
    return Math.floor(s/60) + "p " + (s % 60) + "s";
}

// 4. Hiển thị danh sách thiết bị
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
                <small>ND: ${d.user || "Trống"} | Tổng: ${formatTime(d.total)}</small><br>
                <button class="fix" onclick="fix('${id}')">✔ Reset máy</button>
            </div>
            <div class="device-media">
                <img src="images/${id}.jpg" class="device-img" onerror="this.src='https://via.placeholder.com/100?text=No+Photo'">
                <div id="qr-${id}" class="device-qr"></div>
            </div>
        `;
        listDiv.appendChild(devEl);

        // Tạo QR dẫn về index.html
        let qrUrl = `https://nguyenhuunam25042006-collab.github.io/qrlab-nabager/index.html?id=${id}`;
        new QRCode(document.getElementById(`qr-${id}`), { text: qrUrl, width: 100, height: 100 });
    });
}

// 5. HIỂN THỊ LỊCH SỬ (Phần quan trọng nhất bạn đang thiếu)
function renderHistory() {
    let history = JSON.parse(localStorage.getItem("history")) || [];
    let historyDiv = document.getElementById("history-list");
    if(!historyDiv) return;

    if(history.length === 0) {
        historyDiv.innerHTML = "Chưa có dữ liệu lịch sử.";
        return;
    }

    // Hiển thị 10 mục gần nhất, cái mới nhất nằm trên đầu
    historyDiv.innerHTML = history.slice(-10).reverse().map(h => `
        <div style="font-size:13px; border-bottom:1px solid #eee; padding:8px 0; color:#333;">
            <b style="color:#4a6cf7;">${h.device}</b> - 👤 ${h.user}<br>
            <small>⏱ ${h.duration} | 📅 ${h.time}</small>
        </div>
    `).join("");
}

// 6. Các hàm điều khiển
function fix(id) { 
    devices[id].status = "Trống"; 
    devices[id].user = ""; 
    devices[id].start = null; 
    save(); 
}

function save() { 
    localStorage.setItem("devices", JSON.stringify(devices)); 
    render(); 
    renderHistory(); // Cập nhật lại cả lịch sử khi có thay đổi
}

function resetAll() {
    if(confirm("Reset tất cả trạng thái và xóa lịch sử?")) {
        Object.keys(devices).forEach(id => { 
            devices[id].status = "Trống"; 
            devices[id].user = "";
            devices[id].total = 0; 
        });
        localStorage.removeItem("history"); // Xóa sạch lịch sử nếu muốn reset hoàn toàn
        save();
    }
}

function logout() { 
    localStorage.removeItem("role"); 
    location.href = "./login.html"; 
}

// 7. TỰ ĐỘNG CẬP NHẬT KHI CÓ THAY ĐỔI
window.addEventListener("storage", () => {
    devices = JSON.parse(localStorage.getItem("devices"));
    render();
    renderHistory();
});

// Tự refresh lịch sử mỗi 2 giây (để Laptop hiện kết quả từ Điện thoại ngay)
setInterval(renderHistory, 2000);

// Khởi chạy ban đầu
render();
renderHistory();
