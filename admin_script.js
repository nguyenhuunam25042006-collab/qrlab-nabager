// ===== 0. PHẦN THÊM MỚI: CẤU HÌNH & KẾT NỐI CLOUD =====
const firebaseConfig = {
    databaseURL: "https://qrlab-c1704-default-rtdb.firebaseio.com"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// LẮNG NGHE DỮ LIỆU CÔNG DỤNG TỪ CLOUD (MỚI: Để Admin sửa được trên web)
let deviceManuals = {};
db.ref('deviceManuals').on('value', (snapshot) => {
    if (snapshot.val()) {
        deviceManuals = snapshot.val();
        render(); 
    }
});

// LẮNG NGHE BIẾN ĐỘNG TỪ USER
db.ref('devices').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        devices = data; 
        render(); 
        updateAdminStats(); // Cập nhật biểu đồ thống kê
    }
});

db.ref('history').on('value', (snapshot) => {
    const histData = snapshot.val();
    if (histData) {
        localStorage.setItem("history", JSON.stringify(histData));
        renderHistory(); 
    }
});

db.ref('queues').on('value', (snapshot) => {
    const queueData = snapshot.val();
    if (queueData) {
        localStorage.setItem("queues", JSON.stringify(queueData));
        render(); 
        renderBookingTable(); 
    }
});

// =======================================================

if(localStorage.getItem("role") !== "admin") {
    location.href = "./login.html";
}

let devices = {};
let adminChart = null; // Biến lưu trữ biểu đồ

function formatTime(ms) {
    if(!ms) return "0p 0s";
    let s = Math.floor(ms/1000);
    return Math.floor(s/60) + "p " + (s % 60) + "s";
}

// 4. HIỂN THỊ DANH SÁCH THIẾT BỊ
function render() {
    let searchInput = document.getElementById("search");
    let keyword = searchInput ? searchInput.value.toLowerCase() : "";
    let listDiv = document.getElementById("list");
    if(!listDiv) return;
    listDiv.innerHTML = "";

    let queues = JSON.parse(localStorage.getItem("queues")) || {};

    Object.entries(devices).forEach(([id, d]) => {
        if (!d.name.toLowerCase().includes(keyword) && !id.toLowerCase().includes(keyword)) return;

        let color = d.status === "Đang sử dụng" ? "using" : (d.status === "Bị hỏng" ? "broken" : "free");
        
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
                <p style="margin:4px 0; font-size:11px; color:#888; line-height:1.2;">${deviceManuals[id]?.usage || "Chưa cập nhật công dụng..."}</p>
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

// HÀM MỚI 1: CẬP NHẬT THÔNG TIN THIẾT BỊ (KHÔNG CẦN CODE)
function updateDeviceSystem() {
    const id = document.getElementById("new-id").value.trim().toUpperCase();
    const name = document.getElementById("new-name").value.trim();
    const usage = document.getElementById("new-usage").value.trim();
    const manual = document.getElementById("new-manual").value.trim();

    if (!id || !name) return alert("⚠️ Vui lòng nhập ID và Tên máy!");

    const updates = {};
    updates['/devices/' + id] = { 
        name: name, 
        status: devices[id]?.status || "Trống", 
        user: "", 
        total: devices[id]?.total || 0 
    };
    updates['/deviceManuals/' + id] = { 
        usage: usage || "Đang cập nhật...", 
        manual: manual || "Liên hệ cán bộ phòng Lab." 
    };

    db.ref().update(updates).then(() => {
        alert("✅ Đã cập nhật hệ thống cho: " + name);
        ["new-id", "new-name", "new-usage", "new-manual"].forEach(k => document.getElementById(k).value = "");
    });
}

// HÀM MỚI 2: THỐNG KÊ BIỂU ĐỒ TRẠNG THÁI
function updateAdminStats() {
    let u=0, f=0, b=0;
    Object.values(devices).forEach(d => { 
        if(d.status==="Đang sử dụng") u++; else if(d.status==="Bị hỏng") b++; else f++; 
    });
    
    let statsDiv = document.getElementById("quick-stats");
    if(statsDiv) {
        statsDiv.innerHTML = `
            • Hiệu suất: <b style="color:#2ecc71;">${Math.round((u/Object.keys(devices).length)*100) || 0}%</b><br>
            • Đang dùng: <b style="color:#f1c40f;">${u} máy</b><br>
            • Sẵn sàng: <b style="color:#00f2fe;">${f} máy</b>
        `;
    }

    const ctx = document.getElementById('adminChart');
    if (!ctx) return;
    if (adminChart) adminChart.destroy();
    adminChart = new Chart(ctx, {
        type: 'doughnut',
        data: { datasets: [{ data: [u, f, b], backgroundColor: ['#f1c40f', '#2ecc71', '#e74c3c'], borderWidth: 0 }] },
        options: { cutout: '75%', plugins: { legend: { display: false } } }
    });
}

function renderHistory() {
    let history = JSON.parse(localStorage.getItem("history")) || [];
    let historyDiv = document.getElementById("history-list");
    if(!historyDiv) return;
    if(history.length === 0) { historyDiv.innerHTML = "Chưa có dữ liệu."; return; }
    historyDiv.innerHTML = history.slice(-10).reverse().map(h => `
        <div style="font-size:13px; border-bottom:1px solid #eee; padding:8px 0; color:#333;">
            <b style="color:#4a6cf7;">${h.device}</b> - 👤 ${h.user}<br>
            <small>⏱ ${h.duration} | 📅 ${h.time}</small>
        </div>
    `).join("");
}

function renderBookingTable() {
    let queues = JSON.parse(localStorage.getItem("queues")) || {};
    let tableBody = document.getElementById("booking-table-content");
    if (!tableBody) return;
    let allBookings = [];
    Object.entries(queues).forEach(([deviceId, list]) => {
        list.forEach(item => {
            allBookings.push({
                deviceName: devices[deviceId]?.name || deviceId,
                userName: item.userName,
                bookTime: item.bookTime,
                estimated: item.estimated
            });
        });
    });
    if (allBookings.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='4' style='text-align:center;'>Trống</td></tr>";
        return;
    }
    tableBody.innerHTML = allBookings.map(b => `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); font-size:13px;">
            <td style="padding:10px; color:#f39c12;">${b.deviceName}</td>
            <td style="padding:10px;">${b.userName}</td>
            <td style="padding:10px; color:#2ecc71;">${b.bookTime}</td>
            <td style="padding:10px;">${b.estimated}</td>
        </tr>
    `).join("");
}

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

function fix(id) { 
    devices[id].status = "Trống"; 
    devices[id].user = ""; 
    save(); 
}

function save() { 
    localStorage.setItem("devices", JSON.stringify(devices)); 
    db.ref('devices').set(devices); 
}

function resetAll() {
    if(confirm("Xác nhận reset toàn bộ hệ thống?")) {
        Object.keys(devices).forEach(id => { 
            devices[id].status = "Trống"; devices[id].user = ""; devices[id].total = 0; 
        });
        db.ref('devices').set(devices);
        db.ref('history').remove();
        db.ref('queues').remove();
    }
}

function logout() { 
    localStorage.removeItem("role"); 
    location.href = "./login.html"; 
}

window.addEventListener("storage", () => {
    render();
    renderHistory();
    renderBookingTable();
});

setInterval(() => { renderHistory(); }, 2000);

render();
renderHistory();
renderBookingTable();
