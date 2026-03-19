// Kiểm tra quyền admin
if(localStorage.getItem("role") !== "admin") {
    location.href = "./login.html";
}

// Dữ liệu 10 thiết bị
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

function formatTime(ms) {
    if(!ms) return "0p 0s";
    let s = Math.floor(ms/1000);
    return Math.floor(s/60) + "p " + (s % 60) + "s";
}

function render() {
    let keyword = document.getElementById("search").value.toLowerCase();
    let listDiv = document.getElementById("list");
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

function fix(id) { 
    devices[id].status = "Trống"; 
    devices[id].user = ""; 
    devices[id].start = null; 
    save(); 
}

function save() { 
    localStorage.setItem("devices", JSON.stringify(devices)); 
    render(); 
}

function resetAll() {
    if(confirm("Reset tất cả?")) {
        Object.keys(devices).forEach(id => { devices[id].status = "Trống"; devices[id].total = 0; });
        save();
    }
}

function logout() { localStorage.removeItem("role"); location.href = "./login.html"; }

// Khởi chạy
render();
