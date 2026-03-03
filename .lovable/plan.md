## Silsilah Keluarga - Platform Pohon Keluarga 🌿

### Tema & Desain

- **Palet warna hijau lembut & natural** — nuansa hijau sage, krem, cokelat muda yang hangat dan berkesan keluarga
- Layout dengan **sidebar navigasi**, **main canvas** untuk tree, dan **modal/panel** untuk detail anggota
- Desain clean, modern, mobile-friendly

---

### Tahap 1: Fondasi (yang akan dibangun sekarang)

#### 1. Autentikasi & Peran User

- Halaman **Login & Sign Up** dengan email atau akun google 
- Sistem **superadmin** yang bisa mengelola semua data
- User biasa hanya bisa mengedit data diri dan keluarga di bawah silsilahnya
- Profil user terhubung ke data anggota keluarga

#### 2. CRUD Anggota Keluarga

- **Tambah anggota**: nama lengkap, jenis kelamin, tempat/tanggal lahir, tanggal wafat (opsional), foto profil, alamat, no HP dan bio
- **Edit & Hapus** anggota dengan validasi hak akses
- **Halaman profil detail** setiap anggota menampilkan info lengkap

#### 3. Hubungan Keluarga (Relationship Logic)

- Hubungkan anak ke **ayah & ibu** (father_id, mother_id)
- Hubungkan **pasangan** — mendukung **multi-pasangan** (tabel relasi terpisah untuk spouse)
- **Deteksi saudara kandung** otomatis berdasarkan orang tua yang sama

#### 4. Visualisasi Pohon Silsilah

- **Tree chart vertikal** (top-down) yang interaktif — bisa di-zoom dan di-drag
- **Garis penghubung** otomatis untuk relasi orang tua-anak dan pasangan
- **Klik anggota** untuk fokus/re-center pohon ke orang tersebut
- **Tampilan publik** — tree bisa diakses tanpa login

#### 5. Pencarian

- **Search bar** untuk mencari anggota berdasarkan nama atau alamat

---

### Tahap 2: Fitur Lanjutan (setelah inti selesai)

- Filter berdasarkan cabang keluarga atau status hidup/meninggal
- Ekspor bagan silsilah ke PNG/JPG/PDF
- Upload & galeri foto per anggota
- Optimasi performa untuk ratusan anggota

---

### Backend (Lovable Cloud + Supabase)

- Database relasional untuk menyimpan data anggota & relasi
- Storage untuk foto profil
- Row-Level Security untuk kontrol akses per user
- Tabel peran user terpisah untuk superadmin