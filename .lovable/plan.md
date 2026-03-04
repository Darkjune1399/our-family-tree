

## Plan: 4 Fitur Baru untuk Pohon Silsilah

### 1. Klik Node untuk Re-center (Fokus pada Anggota)
**File:** `src/components/tree/FamilyTreeCanvas.tsx`

- Saat klik node anggota, selain menampilkan popup detail, animasikan transform agar node tersebut berada di tengah viewport
- Tambahkan fungsi `focusOnMember(x, y, width)` yang menghitung transform baru sehingga node terpusat
- Gunakan smooth transition via CSS `transition` pada group transform atau state update bertahap

### 2. Halaman Profil Detail Anggota
**File baru:** `src/pages/MemberProfile.tsx`
**Route baru di:** `src/App.tsx` → `/member/:id`

- Halaman full-page yang menampilkan semua info anggota: foto, nama, gender, tanggal/tempat lahir & wafat, alamat, HP, bio
- Tampilkan daftar pasangan (dari tabel marriages) dan anak-anak (dari father_id/mother_id)
- Tampilkan orang tua (father_id, mother_id) dengan link ke profil mereka
- Tombol "Lihat di Pohon" yang navigasi ke `/tree?focus=<member_id>`
- Update popup detail di FamilyTreeCanvas untuk menambahkan link "Lihat Profil Lengkap" ke halaman ini

### 3. Export Data Keluarga ke PDF
**File baru:** `src/components/tree/ExportPdfButton.tsx`
**Dependency:** Tidak perlu library tambahan — gunakan browser `window.print()` dengan print-friendly layout, atau generate PDF via canvas/SVG serialization

- Tambahkan tombol "Export PDF" di header halaman `/tree`
- Pendekatan: serialize SVG pohon ke canvas via `foreignObject` atau `html2canvas`, lalu convert ke PDF blob menggunakan built-in atau lightweight approach
- Alternatif lebih sederhana: buat halaman print-friendly `/tree/print` yang me-render pohon secara statis, lalu trigger `window.print()`
- Juga export daftar anggota sebagai tabel dalam PDF

### 4. Filter Tree Berdasarkan Cabang Keluarga
**File:** `src/pages/Index.tsx` dan `src/components/tree/FamilyTreeCanvas.tsx`

- Tambahkan dropdown filter di header halaman `/tree` yang menampilkan daftar root ancestors
- Saat dipilih, hanya tampilkan subtree dari root ancestor tersebut
- Filter bekerja di level `trees` array — cukup filter array sebelum passing ke `FamilyTreeCanvas`

---

### Urutan Implementasi
1. Re-center on click (perubahan kecil di FamilyTreeCanvas)
2. Filter cabang keluarga (perubahan di Index.tsx + small dropdown)
3. Halaman profil detail (halaman baru + route)
4. Export PDF (komponen baru + integrasi)

### Catatan Teknis
- Untuk PDF export, akan menggunakan pendekatan `window.print()` dengan CSS `@media print` sebagai solusi tanpa dependency tambahan
- Semua fitur ini tidak memerlukan perubahan database

