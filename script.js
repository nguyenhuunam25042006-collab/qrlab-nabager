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

// ===== 2. CÔNG CỤ LƯU & THỜI GIAN =====
function save(){
    localStorage.setItem("devices", JSON.stringify(devices));
}

function formatTime(ms){
    let s = Math.floor(ms/1000);
    let m = Math.floor(s/60);
    return m + "p " + (s % 60) + "s";
}

// ===== 3. HÀM QUÉT QR (ĐỌC ĐƯỢC MỌI LOẠI MÃ) =====
function startScan(){
    if(typeof Html5Qrcode === "undefined"){
        alert("❌ Lỗi: Chưa nạp thư viện quét QR!");
        return;
    }

    const reader = document.getElementById("reader");
    reader.innerHTML = "";

    if(scanner){
        scanner.stop().then(()=>scanner.clear()).catch(()=>{});
    }

    scanner = new Html5Qrcode("reader");

    Html5Qrcode.getCameras().then(cameras=>{
        if(!cameras.length){ alert("❌ Không tìm thấy camera!"); return; }
        
        let cam = cameras[cameras.length - 1].id;
        scanner.start(cam, {fps:10, qrbox:250}, (text)=>{
            scanner.stop().then(()=>{
                scanner.clear();
                
                let rawText = text.trim();
                let foundId = "";

                // --- CHIẾN THUẬT NHẬN DIỆN "3 TRONG 1" ---
                
                // 1. Nếu là QR từ Admin (Chứa link có ?id=TB...)
                if (rawText.includes("id=")) {
                    foundId = rawText.split("id=").pop().split("&")[0].toUpperCase();
                } 
                // 2. Nếu là QR từ Link ngoài hoặc Văn bản (Tìm cụm TB + số bất kỳ đâu)
                else {
                    let match = rawText.match(/TB\d+/i);
                    if (match) {
                        foundId = match[0].toUpperCase();
                    } 
                    // 3. Nếu là văn bản thuần không có chữ TB (Ví dụ quét mã chỉ có "001")
                    else {
                        foundId = rawText.toUpperCase();
                        // Tự thêm "TB" nếu người dùng quét mã chỉ có số
                        if(!foundId.startsWith("TB") && foundId.length <= 3) {
                            foundId = "TB" + foundId.padStart(3, '0');
                        }
                    }
                }

                // Kiểm tra ID có tồn tại trong hệ thống không
                if (devices[foundId]) {
                    currentDevice = foundId;
                    if (navigator.vibrate) navigator.vibrate(200); // Rung nhẹ khi nhận diện xong
                    showDevice(currentDevice);
                    updateChart();
                } else {
                    alert("❌ Thiết bị " + foundId + " không tồn tại trong hệ thống!");
                }

            }).catch(()=>{});
        }, (err)=>{});
    }).catch(()=>{ alert("❌ Lỗi: Không thể truy cập camera!"); });
}

// ===== 4. HIỂN THỊ THÔNG TIN THIẾT BỊ =====
function showDevice(id){
    const resultDiv = document.getElementById("result");
    if(!resultDiv) return;

    let d = devices[id];
    let color = d.status === "Đang sử dụng" ? "using" : (d.status === "Bị hỏng" ? "broken" : "free");
    let timeText = d.start ? "⏱ Đang dùng: " + formatTime(Date.now() - d.start) : "🕒 Tổng: " + formatTime(d.total || 0);

    resultDiv.innerHTML = `
        <div class="result-box" style="text-align:center; animation: fadeIn 0.5s;">
            <img src="images/${id}.jpg" style="width:180px; height:180px; object-fit:cover; border-radius:20px; border:3px solid #eee; margin-bottom:10px;" 
                 onerror="this.src='https://via.placeholder.com/150?text=Chưa+Có+Ảnh'">
            <h3 style="margin:5px 0; color:#333;">${d.name}</h3>
            <p style="color:#888; margin:0;">Mã số: ${id}</p>
            <span class="badge ${color}">${d.status}</span>
            <p style="margin:10px 0 5px 0;">👤 ND: <b>${d.user || "Chưa có"}</b></p>
            <p style="font-size:1.4em; font-weight:bold; color:#4a6cf7; margin:0;">${timeText}</p>
        </div>
    `;
}

// ===== 5. ĐIỀU KHIỂN SỬ DỤNG =====
function useDevice(){
    if(!currentDevice) return alert("⚠️ Hãy quét mã QR trước!");
    if(devices[currentDevice].status === "Đang sử dụng") return alert("⚠️ Thiết bị này đang được dùng!");

    let name = prompt("Vui lòng nhập tên người sử dụng:");
    if(!name) return;

    let d = devices[currentDevice];
    d.status = "Đang sử dụng";
    d.user = name;
    d.start = Date.now();
    save();
    showDevice(currentDevice);
    updateChart();
}

function stopDevice(){
    if(!currentDevice) return;
    let d = devices[currentDevice];
    if(d.start){
        let used = Date.now() - d.start;
        let history = JSON.parse(localStorage.getItem("history")) || [];
        history.push({
            device: d.name, user: d.user,
            time: new Date().toLocaleString(),
            duration: formatTime(used)
        });
        localStorage.setItem("history", JSON.stringify(history));
        d.total += used;
        d.start = null;
    }
    d.status = "Trống"; d.user = "";
    save();
    showDevice(currentDevice);
    updateChart();
}

function errorDevice(){
    if(!currentDevice) return alert("⚠️ Hãy quét mã QR trước!");
    if(confirm("Xác nhận thiết bị này đang gặp sự cố/hỏng?")){
        devices[currentDevice].status = "Bị hỏng";
        save();
        showDevice(currentDevice);
        updateChart();
    }
}

// ===== 6. CẬP NHẬT BIỂU ĐỒ =====
function updateChart(){
    let u=0, f=0, b=0;
    Object.values(devices).forEach(d => {
        if(d.status==="Đang sử dụng") u++;
        else if(d.status==="Bị hỏng") b++;
        else f++;
    });

    const ctx = document.getElementById("chart");
    if(!ctx) return;
    if(chart) chart.destroy();
    chart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Đang dùng", "Trống", "Hỏng"],
            datasets: [{ 
                data: [u,f,b], 
                backgroundColor: ["#f1c40f", "#2ecc71", "#e74c3c"],
                borderWidth: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// Tự động nhận diện khi vào từ link QR Admin
function checkUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id && devices[id.toUpperCase()]) {
        currentDevice = id.toUpperCase();
        showDevice(currentDevice);
    }
}

// Cập nhật đồng hồ thời gian thực
setInterval(() => { if (currentDevice && devices[currentDevice].start) showDevice(currentDevice); }, 1000);

// ===== KHỞI CHẠY =====
checkUrl();
updateChart();
