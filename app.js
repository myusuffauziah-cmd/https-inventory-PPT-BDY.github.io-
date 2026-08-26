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

        const row = `
        <tr>
            <td>${b.item_code}</td>
            <td>${b.item_name}</td>
            <td>${b.gd_pos_bndrjaya_lmp}</td>
            <td><span class="status ${classStatus}">${status}</span></td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

// Fungsi tombol update database
async function updateDatabase() {
    alert("Update database dimulai... tunggu 10 detik");
    try {
        await fetch(`${API_URL}/refresh`);
        alert("Database berhasil diupdate!");
        loadStats(); // refresh angka
    } catch (err) {
        alert("Gagal update database");
        console.error(err);
    }
}

// Jalanin pas web dibuka
loadStats();
