# WhatsApp Nutrition Bot 🍔📱  

WhatsApp Nutrition Bot adalah aplikasi berbasis WhatsApp yang memberikan informasi nutrisi dari makanan yang dimasukkan pengguna. Bot ini dirancang untuk membantu pengguna memantau asupan kalori dan nutrisi harian mereka dengan mudah.  

---

## Fitur ✨  
- **Input Makanan:** Masukkan daftar makanan melalui chat WhatsApp.  
- **Informasi Nutrisi:** Bot akan memberikan rincian kalori, porsi, protein, karbohidrat, lemak, gula, dan sodium untuk setiap makanan.  
- **Total Kalori:** Bot juga menghitung total kalori dari semua makanan yang disebutkan.  

---

## Contoh Penggunaan 🛠️  
<br>**Input pengguna:**
```es teh, nasi goreng```<br><br>
**Output bot:**  
```
Makanan: es teh
Kalori: 1 kcal
Porsi: 100 gram
Protein: 0 g
Karbohidrat: 0.3 g
Lemak: 0 g
Gula: 0 g
Sodium: 3 mg

Makanan: nasi goreng
Kalori: 174.5 kcal
Porsi: 100 gram
Protein: 4 g
Karbohidrat: 32.4 g
Lemak: 2.9 g
Gula: 0.6 g
Sodium: 393 mg

Total Kalori: 175.5 kcal
```

---

## Teknologi yang Digunakan 🚀  
- **[whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js):** Library untuk menghubungkan dan mengontrol WhatsApp melalui browser Web.  
- **[qrcode-terminal](https://github.com/gtanner/qrcode-terminal):** Digunakan untuk menampilkan QR code di terminal agar pengguna dapat memindai dan menghubungkan bot.  
- **[google-translate-api-x](https://www.npmjs.com/package/google-translate-api-x):** API untuk mendukung fitur terjemahan otomatis.  

---

## Cara Menggunakan 📋  
1. Clone repositori ini ke komputer Anda:  
   ```
   git clone https://github.com/indogegewepe/Bot-Whatsapp.git
2. Instal dependensi yang diperlukan:
   ```
   npm install
3. Jalankan aplikasi:
```npm start```

---

## Struktur Proyek 📁
```
whatsapp-nutrition-bot/  
├── src/  
│   ├── index.js           # Entry point aplikasi  
│   ├── bot.js             # Logika bot dan handler  
│   ├── nutrition.js       # Modul untuk menghitung nutrisi  
│   ├── translator.js      # Modul untuk dukungan terjemahan  
│   └── utils.js           # Fungsi utilitas  
├── data/  
│   └── foodDatabase.json  # Database nutrisi makanan  
├── .env                   # File konfigurasi environment (opsional)  
├── package.json           # Dependensi dan skrip aplikasi  
└── README.md              # Dokumentasi proyek  
```
---

# Kontribusi 🤝
Kontribusi sangat dihargai! Silakan buat pull request untuk perbaikan atau penambahan fitur baru.

# Lisensi 📄
Proyek ini dilisensikan di bawah MIT License.

# Kontak 📬
Jika Anda memiliki pertanyaan atau masukan, jangan ragu untuk menghubungi kami di bagasuwaidha007@gmail.com
