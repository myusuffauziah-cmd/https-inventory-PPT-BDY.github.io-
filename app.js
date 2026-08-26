from flask import Flask, render_template, request, redirect
from config import DATABASE

import sqlite3
import subprocess
import sys
import os
import re

app = Flask(__name__)


# ==================================================
# KONEKSI SQLITE
# ==================================================

def get_db_connection():

    conn = sqlite3.connect(DATABASE)

    conn.row_factory = sqlite3.Row

    return conn


# ==================================================
# MENGAMBIL SELURUH KOLOM GUDANG
# ==================================================

def get_gudang_columns(conn):

    cursor = conn.execute("""

        PRAGMA table_info(stok)

    """)

    columns = []

    for row in cursor.fetchall():

        nama = row["name"]

        if nama.startswith("gd_"):

            columns.append(nama)

    return columns


# ==================================================
# UBAH NAMA GUDANG AGAR CANTIK
# ==================================================

def format_gudang(nama):

    nama = nama.replace("gd_", "")

    nama = nama.replace("_", " ")

    nama = nama.upper()

    return nama


# ==================================================
# DASHBOARD
# ==================================================

@app.route("/", methods=["GET"])
def dashboard():

    conn = get_db_connection()

    gudang_columns = get_gudang_columns(conn)
    # ==================================================
    # STATISTIK DASHBOARD
    # ==================================================

    total_barang = conn.execute("""

        SELECT COUNT(*)

        FROM stok

    """).fetchone()[0]

    # Nama kolom stok Bandar Jaya
    # SESUAIKAN jika nanti nama kolommu berbeda

    BJ_COLUMN = "gd_pos_bndrjaya_lmp"

    total_qty = conn.execute(f"""

        SELECT IFNULL(SUM({BJ_COLUMN}),0)

        FROM stok

    """).fetchone()[0]

    stok_tersedia = conn.execute(f"""

        SELECT COUNT(*)

        FROM stok

        WHERE {BJ_COLUMN} > 0

    """).fetchone()[0]

    stok_habis = conn.execute(f"""

        SELECT COUNT(*)

        FROM stok

        WHERE {BJ_COLUMN} <= 0

    """).fetchone()[0]

    # ==================================================
    # PENCARIAN
    # ==================================================

    keyword = request.args.get(
        "keyword",
        ""
    ).strip()

    barang = []

    if keyword != "":

        daftar = re.split(
            r'[\n\r,; ]+',
            keyword
        )

        daftar = [
            x.strip()
            for x in daftar
            if x.strip()
        ]

        # ==========================================
        # SATU PENCARIAN
        # ==========================================

        if len(daftar) == 1:

            cari = f"%{daftar[0]}%"

            sql = f"""

            SELECT *

            FROM stok

            WHERE

                item_code LIKE ?

                OR item_name LIKE ?

            ORDER BY item_name

            """

            rows = conn.execute(
                sql,
                (
                    cari,
                    cari
                )
            ).fetchall()

        # ==========================================
        # BANYAK PART NUMBER
        # ==========================================

        else:

            placeholder = ",".join(
                ["?"] * len(daftar)
            )

            sql = f"""

            SELECT *

            FROM stok

            WHERE item_code IN ({placeholder})

            ORDER BY item_name

            """

            rows = conn.execute(
                sql,
                daftar
            ).fetchall()

        # ==========================================
        # OLAH HASIL
        # ==========================================

        for row in rows:

            item = dict(row)

            gudang_tersedia = []

            # jika stok BJ habis
            if item[BJ_COLUMN] <= 0:

                for gudang in gudang_columns:

                    if gudang == BJ_COLUMN:
                        continue

                    if item[gudang] > 0:

                        gudang_tersedia.append({

                            "nama": format_gudang(gudang),

                            "qty": item[gudang]

                        })

            item["gudang_lain"] = gudang_tersedia

            barang.append(item)

    conn.close()

    # ==================================================
    # DEBUG
    # ==================================================

    print()

    print("="*60)

    print("TOTAL ITEM :", total_barang)

    print("TOTAL QTY  :", total_qty)

    print("STOK ADA   :", stok_tersedia)

    print("STOK HABIS :", stok_habis)

    print("KEYWORD    :", keyword)

    print("HASIL      :", len(barang))

    print("="*60)

    print()
    # ==================================================
    # RENDER HTML
    # ==================================================

    return render_template(

        "dashboard.html",

        total=total_barang,

        total_qty=total_qty,

        stok_tersedia=stok_tersedia,

        stok_habis=stok_habis,

        barang=barang,

        keyword=keyword

    )


# ==================================================
# REFRESH DATABASE
# ==================================================

@app.route("/refresh")
def refresh():

    BASE_DIR = os.path.dirname(
        os.path.abspath(__file__)
    )

    import_file = os.path.join(
        BASE_DIR,
        "import_excel.py"
    )

    print()
    print("=" * 60)
    print("UPDATE DATABASE DIMULAI")
    print("=" * 60)

    try:

        subprocess.run(

            [sys.executable, import_file],

            check=True

        )

        print("DATABASE BERHASIL DIUPDATE")

    except Exception as e:

        print("ERROR :", e)

    print("=" * 60)

    return redirect("/")


# ==================================================
# TEST DATABASE
# ==================================================

@app.route("/database")
def database():

    conn = get_db_connection()

    cursor = conn.execute(

        "PRAGMA table_info(stok)"

    )

    columns = []

    for row in cursor.fetchall():

        columns.append(row["name"])

    conn.close()

    return {

        "jumlah_kolom": len(columns),

        "kolom": columns

    }


# ==================================================
# TEST SATU ITEM
# ==================================================

@app.route("/sample")
def sample():

    conn = get_db_connection()

    data = conn.execute("""

        SELECT *

        FROM stok

        LIMIT 1

    """).fetchone()

    conn.close()

    if data:

        return dict(data)

    return {}


# ==================================================
# JALANKAN FLASK
# ==================================================

if __name__ == "__main__":

    app.run(

        host="0.0.0.0",

        port=5000,

        debug=False

    )
