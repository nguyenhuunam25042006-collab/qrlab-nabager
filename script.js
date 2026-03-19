// ===== 0. CẤU HÌNH FIREBASE CỦA NAM (DÙNG CHO TRÌNH DUYỆT) =====
const firebaseConfig = {
    apiKey: "AIzaSyADJ5ugzW6ttbiUymfEkjBCJ-6Cd5UaCNc",
    authDomain: "qrlab-c1704.firebaseapp.com",
    databaseURL: "https://qrlab-c1704-default-rtdb.firebaseio.com",
    projectId: "qrlab-c1704",
    storageBucket: "qrlab-c1704.firebasestorage.app",
    messagingSenderId: "307225910652",
    appId: "1:307225910652:web:364021a27bd2798ba618f9"
};

// Khởi tạo Firebase đúng kiểu dành cho script ngoài
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

let scanner = null;
let currentDevice = "";
let chart = null;

// ===== 1. DỮ LIỆU 10 THIẾT BỊ (ĐỒNG BỘ TỪ CLOUD) =====
let devices = {}; 

// Lắng nghe dữ liệu từ Firebase thay vì localStorage
db.ref('devices').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        devices = data;
        if (currentDevice) showDevice(currentDevice);
        updateChart();
    }
});

function save() { 
    // Lưu lên Firebase Cloud
    db.ref('devices').set(devices); 
}

function formatTime(ms) { 
    let s = Math.floor(ms/1000); 
    return Math.floor(s/60) + "p " + (s % 60) + "s"; 
}

// ===== 2. HÀM QUÉT QR (GIỮ NGUYÊN 100% LOGIC CỦA NAM) =====
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
                    if (navigator.vibrate) navigator.vibrate(200); // Rung khi quét trúng
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
    if(!d) return;
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
    save(); // Lưu lên Cloud ngay
}

function stopDevice() {
    if(!currentDevice) return;
    let d = devices[currentDevice];
    if(d.start) {
        let used = Date.now() - d.start;
        // Đẩy lịch sử lên Firebase Cloud
        db.ref('history').push({ 
            device: d.name, 
            user: d.user, 
            time: new Date().toLocaleString(), 
            duration: formatTime(used) 
        });
        d.total = (d.total || 0) + used; 
        d.start = null;
        alert("✅ Đã kết thúc! Thời gian dùng: " + formatTime(used));
    }
    d.status = "Trống"; 
    d.user = "";
    save(); 
}

function errorDevice() {
    if(!currentDevice) return alert("⚠️ Quét QR trước!");
    if(confirm("Xác nhận báo hỏng thiết bị này?")) {
        devices[currentDevice].status = "Bị hỏng";
        save(); 
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
    if (id) { 
        currentDevice = id.toUpperCase(); 
        // Đợi dữ liệu tải từ Firebase xong mới hiện
        db.ref('devices/' + currentDevice).once('value', (snap) => {
            if(snap.exists()) showDevice(currentDevice);
        });
    }
}

// Cập nhật đồng hồ nhảy giây
setInterval(() => { 
    if (currentDevice && devices[currentDevice] && devices[currentDevice].start) showDevice(currentDevice); 
}, 1000);

checkUrl();
