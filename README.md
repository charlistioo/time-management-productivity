# Time Management for Productivity

Aplikasi web untuk membantu pengguna menargetkan task harian dan memantau berapa lama sebuah task benar-benar selesai. Bukan aplikasi alarm, melainkan **pelacak durasi task** dengan timer real-time, tiga jenis deadline, milestone, dan riwayat penyelesaian — agar pengguna dapat membuat perencanaan yang lebih realistis.

Project ini dikembangkan sebagai Capstone Project menggunakan IBM Bob.

---

## Fitur Utama

### Task
- Buat task dengan nama dan tiga jenis deadline yang dapat diatur bebas:
  - 🟢 **Target** — waktu ideal selesai
  - 🟡 **Keringanan** — toleransi tambahan waktu
  - 🔴 **Harus Kumpul** — batas waktu maksimal
- Tombol **Mulai** mencatat waktu mulai aktual secara real-time
- Timer berjalan menampilkan durasi elapsed sejak "Mulai" ditekan
- Tombol **Selesai** menghentikan timer, menghitung durasi, dan menentukan status
- Status otomatis dibandingkan terhadap tiga deadline:
  - ✓ **On Target** (hijau) — selesai sebelum atau tepat Target
  - ⚡ **Dalam Keringanan** (kuning) — selesai antara Target dan Keringanan
  - ✗ **Melewati Harus Kumpul** (merah) — selesai setelah Harus Kumpul
- Setiap penyelesaian dicatat dalam **riwayat task** (waktu mulai, waktu selesai, durasi, status)

### Milestone
- Tambahkan milestone per task, misalnya `"Ngoding 30 menit"`
- Catat penyelesaian milestone secara manual dengan input waktu mulai dan waktu selesai
- Riwayat penyelesaian milestone ditampilkan per milestone dengan status dan durasi

### UI & Aksesibilitas
- Jam real-time di header: angka besar dan tebal, ikon jam, label zona waktu (misal `WIB (UTC+7)`)
- Tampilan responsif mobile-first dengan palet biru, hitam, dan putih
- Kontras teks memenuhi WCAG AA (jam header kontras 8.6:1 ✓ WCAG AAA)
- Setiap input memiliki label yang terhubung
- Navigasi keyboard penuh (focus ring, Escape untuk menutup modal)
- Tidak ada error di console

### Persistensi
- Seluruh data (task, deadline, milestone, riwayat) disimpan di **localStorage**
- Data tetap tersedia setelah halaman dimuat ulang atau browser ditutup

---

## Teknologi

| Teknologi | Keterangan |
|---|---|
| HTML5 | Markup semantik dengan ARIA roles |
| [Tailwind CSS](https://tailwindcss.com) via CDN | Utility-first styling, mobile-first |
| `style.css` | Styling tambahan (scrollbar, animasi modal, clock widget) |
| Vanilla JavaScript (`script.js`) | Logika aplikasi, localStorage, event delegation |

Tidak membutuhkan build tool, bundler, atau dependensi npm.

---

## Struktur File

```
.
├── index.html   # Markup HTML — layout, form, modal, header clock
├── style.css    # Styling tambahan di luar Tailwind (animasi, scrollbar, clock widget)
├── script.js    # Logika utama: task, milestone, riwayat, timer, status, localStorage
└── README.md    # Dokumentasi project
```

---

## Cara Menjalankan

1. Unduh atau clone project ini.
2. Buka file `index.html` langsung di browser (double-click atau drag ke browser).

> Koneksi internet dibutuhkan untuk memuat Tailwind CSS dari CDN.

---

## Cara Menggunakan

### Membuat Task
1. Isi **Nama Task** di formulir "Buat Task Baru".
2. Atur satu atau lebih deadline: **Target**, **Keringanan**, **Harus Kumpul**.
3. Klik **+ Tambah Task**.

### Melacak Durasi Task
1. Di card task, tekan tombol hijau **▶ Mulai** — waktu mulai aktual dicatat otomatis dan timer mulai berjalan.
2. Kerjakan task seperti biasa.
3. Tekan tombol merah **■ Selesai** saat selesai — durasi dihitung dan status ditentukan otomatis.
4. Riwayat penyelesaian muncul di bawah tombol dengan warna status, durasi, waktu mulai, dan waktu selesai.

### Milestone
1. Klik **+ Tambah** di bagian Milestone dalam card task.
2. Isi nama milestone, lalu klik **Simpan**.
3. Klik **Catat** pada milestone untuk mencatat satu sesi penyelesaian (input waktu mulai & selesai).

---

## Struktur Data (localStorage)

Kunci: `tmp_tasks` — array JSON dari objek task.

```jsonc
{
  "id": "abc123",
  "name": "Kerjakan laporan akhir",
  "deadlineTarget": "2025-06-01T09:00:00.000Z",
  "deadlineGrace":  "2025-06-01T10:00:00.000Z",
  "deadlineHard":   "2025-06-01T12:00:00.000Z",
  "createdAt": "2025-05-30T08:00:00.000Z",
  "activeStartTime": null,        // ISO string saat Mulai ditekan, null = idle
  "records": [                    // riwayat penyelesaian task (Mulai→Selesai)
    {
      "id": "r1",
      "startTime": "2025-06-01T08:00:00.000Z",
      "endTime":   "2025-06-01T09:45:00.000Z",
      "duration":  "1j 45m 0d",
      "status":    "grace"        // on-target | grace | overdue
    }
  ],
  "milestones": [
    {
      "id": "m1",
      "name": "Ngoding 30 menit",
      "records": [
        {
          "id": "mr1",
          "startTime": "2025-06-01T08:00:00.000Z",
          "endTime":   "2025-06-01T08:32:00.000Z"
        }
      ]
    }
  ]
}
```

---

## Potensi Pengembangan

- Insight dari riwayat: rata-rata durasi per jenis task, tren ketepatan waktu
- Notifikasi browser saat task mendekati batas Harus Kumpul
- Ekspor riwayat ke CSV atau JSON
- Integrasi dengan Google Calendar atau Notion
- Rekomendasi deadline berdasarkan riwayat pengguna
- Mode gelap / terang yang dapat dipilih
