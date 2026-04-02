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

// KHỞI TẠO DỮ LIỆU (Tránh lỗi chia cho 0 khi chưa tải xong data)
let devices = JSON.parse(localStorage.getItem("devices")) || {};
let adminChart = null; 

function formatTime(ms) {
    if(!ms) return "0p 0s";
    let s = Math.floor(ms/1000);
    return Math.floor(s/60) + "p " + (s % 60) + "s";
}

// --- LOGIC GIAO DIỆN MỚI (SIDEBAR & TABS) ---
function openTab(evt, tabName) {
    const contents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < contents.length; i++) contents[i].classList.remove("active");

    const buttons = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < buttons.length; i++) buttons[i].classList.remove("active");

    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
    
    if(tabName === 'tab-dashboard') {
        // Cần chút delay để Tab kịp hiện ra trước khi vẽ Chart
        setTimeout(updateAdminStats, 100);
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const mainContent = document.getElementById("main-content");
    sidebar.classList.toggle("collapsed");
    mainContent.classList.toggle("expanded");
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
        
        let imgSource = (d.image && d.image !== "") ? d.image : `images/${id}.jpg`;

        let devEl = document.createElement("div");
        devEl.className = "device";
        devEl.innerHTML = `
            <div class="device-info">
                <b>${d.name}</b> (${id})
                ${q.length > 0 ? `<br><small style="color:#f39c12;">📅 Đợi: ${q.length} người</small>` : ""}
                <p style="margin:4px 0; font-size:11px; color:#888; line-height:1.2;">${deviceManuals[id]?.usage || "Chưa cập nhật công dụng..."}</p>
                <span class="badge ${color}">${d.status}</span><br>
                <small>ND: <b>${d.user || "Trống"}</b> | Tổng: ${formatTime(d.total)}</small><br>
                <button class="fix" onclick="fix('${id}')">✔ Reset máy</button>
            </div>
            <div class="device-media">
                <img src="${imgSource}" class="device-img" onerror="this.src='https://via.placeholder.com/100?text=No+Photo'">
                <div id="qr-${id}" class="device-qr" onclick="zoomQR('${id}', '${d.name}')" title="Bấm để phóng to"></div>
            </div>
        `;
        listDiv.appendChild(devEl);

        let qrUrl = `https://nguyenhuunam25042006-collab.github.io/qrlab-nabager/index.html?id=${id}`;
        new QRCode(document.getElementById(`qr-${id}`), { text: qrUrl, width: 90, height: 90 });
    });
}

// HÀM MỚI 1: CẬP NHẬT THÔNG TIN THIẾT BỊ (HỖ TRỢ ẢNH)
function updateDeviceSystem() {
    const id = document.getElementById("new-id").value.trim().toUpperCase();
    const name = document.getElementById("new-name").value.trim();
    const usage = document.getElementById("new-usage").value.trim();
    const manual = document.getElementById("new-manual").value.trim();
    const imgUrl = document.getElementById("new-image") ? document.getElementById("new-image").value.trim() : "";

    if (!id || !name) return alert("⚠️ Vui lòng nhập ID và Tên máy!");

    const updates = {};
    updates['/devices/' + id] = { 
        name: name, 
        status: devices[id]?.status || "Trống", 
        user: "", 
        total: devices[id]?.total || 0,
        image: imgUrl || "" 
    };
    updates['/deviceManuals/' + id] = { 
        usage: usage || "Đang cập nhật...", 
        manual: manual || "Liên hệ cán bộ phòng Lab." 
    };

    db.ref().update(updates).then(() => {
        alert("✅ Đã cập nhật hệ thống cho: " + name);
        ["new-id", "new-name", "new-usage", "new-manual", "new-image"].forEach(k => {
            if(document.getElementById(k)) document.getElementById(k).value = "";
        });
    });
}

// HÀM MỚI 2: THỐNG KÊ BIỂU ĐỒ TRẠNG THÁI (FIX LỖI CHIA CHO 0)
function updateAdminStats() {
    let u=0, f=0, b=0;
    let deviceCount = Object.keys(devices).length;
    if (deviceCount === 0) return;

    Object.values(devices).forEach(d => { 
        if(d.status==="Đang sử dụng") u++; else if(d.status==="Bị hỏng") b++; else f++; 
    });
    
    let statsDiv = document.getElementById("quick-stats");
    if(statsDiv) {
        statsDiv.innerHTML = `
            • Hiệu suất Lab: <b style="color:#2ecc71;">${Math.round((u/deviceCount)*100) || 0}%</b><br>
            • Đang vận hành: <b style="color:#f1c40f;">${u} máy</b><br>
            • Sẵn sàng phục vụ: <b style="color:#00f2fe;">${f} máy</b>
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
        <div style="font-size:13px; border-bottom:1px solid rgba(255,255,255,0.05); padding:8px 0;">
            <b style="color:#2ecc71;">${h.device}</b> - 👤 ${h.user}<br>
            <small>⏱ ${h.duration} | 📅 ${h.time}</small>
        </div>
    `).join("");
}

// === PHẦN ĐẮP THÊM: DUYỆT & TỪ CHỐI LỊCH ===
function approveBooking(id, index) {
    let q = JSON.parse(localStorage.getItem("queues"));
    if(confirm("Duyệt cho sinh viên này sử dụng máy?")) {
        q[id][index].status = "Đã duyệt";
        db.ref('queues').set(q);
    }
}

function rejectBooking(id, index) {
    let q = JSON.parse(localStorage.getItem("queues"));
    if(confirm("Từ chối yêu cầu đặt lịch này?")) {
        q[id].splice(index, 1);
        db.ref('queues').set(q);
    }
}

function renderBookingTable() {
    let queues = JSON.parse(localStorage.getItem("queues")) || {};
    let tableBody = document.getElementById("booking-table-content");
    if (!tableBody) return;
    let html = "";
    Object.entries(queues).forEach(([deviceId, list]) => {
        list.forEach((item, index) => {
            let actionButtons = (item.status === "Chờ duyệt" || !item.status) ? 
                `<button onclick="approveBooking('${deviceId}', ${index})" style="background:#27ae60; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; font-size:11px;">Duyệt</button>
                 <button onclick="rejectBooking('${deviceId}', ${index})" style="background:#e74c3c; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; font-size:11px; margin-left:4px;">Hủy</button>` : 
                `<b style="color:#2ecc71;">${item.status}</b>`;

            html += `<tr>
                <td style="color:#f39c12;">${devices[deviceId]?.name || deviceId}</td>
                <td>${item.userName}</td>
                <td style="color:#2ecc71;">${item.bookTime}</td>
                <td>${item.estimated}</td>
                <td>${actionButtons}</td>
            </tr>`;
        });
    });

    if (html === "") {
        tableBody.innerHTML = "<tr><td colspan='5' style='text-align:center; color:#888;'>Trống</td></tr>";
    } else {
        tableBody.innerHTML = html;
    }
}
// =========================================

function zoomQR(id, name) {
    const modalName = document.getElementById("modal-name");
    const bigQrDiv = document.getElementById("big-qr");
    const modal = document.getElementById("qrModal");
    if(!modal || !bigQrDiv) return;
    modalName.innerText = name;
    bigQrDiv.innerHTML = ""; 
    let qrUrl = `https://nguyenhuunam25042006-collab.github.io/qrlab-nabager/index.html?id=${id}`;
    new QRCode(bigQrDiv, { text: qrUrl, width: 250, height: 250 });
    modal.style.display = "flex";
}

function closeQR() {
    const modal = document.getElementById("qrModal");
    if(modal) modal.style.display = "none";
}

function fix(id) { 
    devices[id].status = "Trống"; devices[id].user = ""; save(); 
}

function save() { 
    localStorage.setItem("devices", JSON.stringify(devices)); 
    db.ref('devices').set(devices); 
}

function resetAll() {
    if(confirm("Xác nhận reset toàn bộ hệ thống? Việc này sẽ xóa sạch nhật ký!")) {
        // 1. Reset trạng thái máy cục bộ
        Object.keys(devices).forEach(id => { 
            devices[id].status = "Trống"; devices[id].user = ""; devices[id].total = 0; 
        });

        // 2. XÓA LOCALSTORAGE (Để xóa sạch nhật ký hiện tại trên trình duyệt)
        localStorage.removeItem("history");
        localStorage.removeItem("queues");

        // 3. Đẩy lên Firebase Cloud
        db.ref('devices').set(devices);
        db.ref('history').remove();
        db.ref('queues').remove();

        // 4. Vẽ lại giao diện ngay để thấy kết quả
        render();
        renderHistory();
        renderBookingTable();
        updateAdminStats();
    }
}

function logout() { 
    localStorage.removeItem("role"); 
    location.href = "./login.html"; 
}

function exportFullHistory() {
    let history = JSON.parse(localStorage.getItem("history")) || [];
    if(history.length === 0) return alert("Không có nhật ký!");
    let csv = "\uFEFFThiết bị,Người dùng,Thời gian sử dụng,Ngày tháng\n";
    history.forEach(h => { csv += `${h.device},${h.user},${h.duration},${h.time}\n`; });
    let blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Nhat_Ky_Lab.csv`;
    link.click();
}

window.addEventListener("storage", (e) => { 
    if (e.key === "devices" || e.key === "history" || e.key === "queues") {
        render(); renderHistory(); renderBookingTable(); 
    }
});

// Khởi chạy
render(); renderHistory(); renderBookingTable();
