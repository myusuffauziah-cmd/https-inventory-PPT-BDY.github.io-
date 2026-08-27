const API_URL = "https://inventory-backend-pilar-production.up.railway.app";

// Fungsi load angka dashboard
async function loadStats() {
    try {
        const res = await fetch(`${API_URL}/api/stats`);
        const data = await res.json();
        
        document.getElementById("total").innerText = data.total;
        document.getElementById("total_qty").innerText = data.total_qty;
        document.getElementById("stok_tersedia").innerText = data.stok_tersedia;
        document.getElementById("stok_habis").innerText = data.stok_habis;
    } catch (err) {
        console.error("Gagal load stats:", err);
    }
}

// Fungsi cari barang
async function cariBarang() {
    const keyword = document.getElementById("keyword").value;
    if(keyword.trim() === "") return;

    try {
        const res = await fetch(`${API_URL}/api/cari?keyword=` + encodeURIComponent(keyword));
        const data = await res.json();
        tampilkanHasil(data);
    } catch (err) {
        console.error("Gagal cari:", err);
    }
}

// Fungsi tampilkan hasil ke tabel
function tampilkanHasil(barang) {
    const tbody = document.getElementById("hasil-tabel");
    tbody.innerHTML = "";

    barang.forEach(b => {
        let status = "CEK";
        let classStatus = "status-menipis";
        if(b.gd_pos_bndrjaya_lmp > 0) {
            status = "AMAN";
            classStatus = "status-aman";
        } else if(b.gd_pos_bndrjaya_lmp == 0) {
            status = "HABIS";
            classStatus = "status-habis";
        }

        const row =
