# Profil untuk Dosen

Template situs profil dosen — mengikuti gaya `contoh-web-profile-1.jpg` (hero foto gelap,
aksen tosca, grid fitur, kartu). Fitur diadaptasi dari proyek Profil Prof. Andi Sukri
Syamsuri sehingga sudah menyertakan **admin CMS**, **ruang tulisan/blog**, dan
**sinkron Google Scholar**.

## Fitur

- Halaman **Beranda** (`index.html`): hero + fokus/keahlian + tentang + perjalanan +
  pendidikan + karya ilmiah + kontak.
- Halaman **Ruang Tulisan** (`tulisan.html`): pencarian + filter kategori.
- Halaman **Baca Artikel** (`artikel.html?slug=…`): satu tulisan penuh + byline.
- **Panel Admin** (`admin.html`): edit semua konten profil, kelola tulisan, sinkron
  Scholar, ganti password.
- API JSON tanpa dependensi (Node.js `http` bawaan).

## Menjalankan

Prasyarat: **Node.js ≥ 18**.

- Klik dua kali `Jalankan Server.bat`, atau
- Jalankan di terminal:

```powershell
node server.js
```

Alamat:

- Situs   : http://localhost:5533
- Tulisan : http://localhost:5533/tulisan.html
- Admin   : http://localhost:5533/admin.html

## Password Admin

Password default: **`admin123`** — segera ganti melalui panel admin
(`admin.html → 🔒 Keamanan → Ganti Password`). File konfigurasi tersimpan di
`data/admin.config.json` (masuk `.gitignore`, jangan di-commit).

## Mengisi Konten

Semua konten profil (nama, biografi, kartu fokus, timeline, pendidikan, statistik
Scholar, tulisan) dapat diubah melalui **halaman Admin**. Data tersimpan di:

- `data/content.json` — konten profil
- `data/articles.json` — daftar tulisan/blog

Foto profil dan sampul tulisan diunggah ke folder `uploads/`.

## Akses dari HP

Klik dua kali `Buka Akses HP.bat` (butuh UAC) — akan menambahkan aturan firewall
port 5533 lalu menjalankan server. Buka alamat `http://<IP-komputer>:5533` di HP
yang berada di jaringan Wi-Fi yang sama.

## Struktur File

```
Profil untuk Dosen/
├─ index.html          Beranda
├─ tulisan.html        Daftar tulisan
├─ artikel.html        Baca satu tulisan
├─ admin.html          Panel admin
├─ style.css           Tema situs (tosca + dark hero)
├─ admin.css           Tema panel admin
├─ main.js             Renderer beranda
├─ tulisan.js          Daftar & pencarian
├─ artikel.js          Pembaca artikel
├─ admin.js            Panel admin (schema-driven)
├─ server.js           Server Node.js + API
├─ package.json
├─ railway.json        Konfigurasi deploy Railway (opsional)
├─ Jalankan Server.bat
├─ Buka Akses HP.bat
├─ data/
│  ├─ content.json     Konten profil
│  └─ articles.json    Daftar tulisan
└─ uploads/            Foto profil & sampul tulisan
```

## Kredit Foto Hero

Foto latar hero default menggunakan gambar dari Unsplash (dipanggil via URL langsung).
Ganti dengan foto sendiri dengan cara mengunggah **Foto Profil** di admin — hero akan
otomatis menggunakan foto tersebut sebagai latar.

## Deploy Railway (opsional)

1. Buat repo Git, push seluruh isi folder ini.
2. Di Railway: **New Project → Deploy from GitHub repo**.
3. Set variabel lingkungan (opsional untuk persistensi Volume):
   - `DATA_DIR=/data`
   - `UPLOADS_DIR=/data/uploads`
4. Attach Volume ke path `/data`.
5. Deploy. Data awal (`content.json`, `articles.json`) akan otomatis disalin dari
   folder `data/` saat volume masih kosong.

## Deploy Coolify

Proyek ini sudah menyertakan `Dockerfile` dan `.dockerignore`, siap dideploy di Coolify.

1. Push seluruh folder ini ke repositori Git (GitHub / GitLab / Gitea).
2. Di dashboard Coolify: **+ New → Application → Public / Private Repository** →
   pilih repo Anda, branch `main`.
3. Build Pack: **Dockerfile** (biasanya terdeteksi otomatis).
4. **Port**: `5533` (dan Coolify akan otomatis membuat domain HTTPS).
5. **Environment Variables**:
   - `PORT=5533`
   - `DATA_DIR=/data`
   - `UPLOADS_DIR=/data/uploads`
6. **Persistent Storage** (Volumes) → tambah 1 volume:
   - Mount Path: `/data`
   - Nama bebas, mis. `profil-dosen-data`
7. Klik **Deploy**. Saat pertama kali jalan, `content.json`, `articles.json`, dan
   foto bawaan di `uploads/` akan disalin ke volume `/data` secara otomatis.
8. Setelah live, buka `https://domain-anda/admin.html` dan **segera ganti password
   admin** (default `admin123`).

Karena data pengguna (profil, tulisan, foto galeri, password) disimpan di volume
`/data`, deploy ulang / update aplikasi tidak akan menghapus konten Anda.

