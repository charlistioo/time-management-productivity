# Time Management for Productivity

Aplikasi web sederhana untuk membantu pengguna menargetkan task harian dan memantau berapa lama sebuah task benar-benar selesai. Aplikasi ini bukan alarm, melainkan pelacak durasi task agar pengguna dapat membuat perencanaan yang lebih realistis.

Project ini dikembangkan sebagai Capstone Project menggunakan IBM Bob.

## Fitur Utama

- Task dengan tiga jenis deadline: Target, Keringanan, dan Harus Kumpul
- Tampilan tiga card (Target, Keringanan, Harus Kumpul) dalam satu kolom untuk setiap task
- Milestone per target, misalnya "Ngoding 30 menit"
- Riwayat penyelesaian yang mencatat waktu mulai dan waktu selesai
- Pesan status berwarna: hijau (On Target), kuning (Keringanan), merah (Harus Kumpul)
- Penyimpanan lokal menggunakan localStorage agar data tetap tersedia setelah halaman dimuat ulang

## Teknologi

- HTML5
- Tailwind CSS (melalui CDN)
- CSS tambahan (`style.css`)
- Vanilla JavaScript (`script.js`)

## Struktur File

.
├── index.html # Struktur halaman dan komponen utama
├── style.css # Styling tambahan di luar Tailwind
├── script.js # Logika task, milestone, riwayat, dan status
└── README.md # Dokumentasi project


## Cara Menjalankan

1. Unduh atau clone project ini.
2. Buka file `index.html` di browser.

Koneksi internet dibutuhkan untuk memuat Tailwind CSS dari CDN.

## Cara Menggunakan

1. Isi nama task, waktu mulai, dan waktu selesai yang ditargetkan.
2. Atur tiga jenis deadline: Target, Keringanan, dan Harus Kumpul.
3. Tambahkan milestone, misalnya "Ngoding 30 menit".
4. Saat milestone selesai, catat penyelesaiannya. Riwayat dan pesan status akan muncul.

Tidak ada fitur pause pada task. Pengguna bebas menentukan waktunya sendiri.

## Potensi Pengembangan

- Insight dari riwayat milestone, seperti rata-rata durasi per jenis task
- Notifikasi pengingat saat task mendekati batas Harus Kumpul
- Ekspor riwayat ke CSV atau integrasi dengan Google Calendar
- Rekomendasi deadline berdasarkan riwayat pengguna