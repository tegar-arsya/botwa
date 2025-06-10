const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const axios = require("axios");
const googleTranslate = require("google-translate-api-x");
const admin = require("firebase-admin");
const serviceAccount = require("./firebase/bot-wa-681d9-firebase-adminsdk-fbsvc-c1ca2a53b2.json");

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();


const API_URL = "https://api.api-ninjas.com/v1/nutrition";
const API_KEY = "K0t2xp3G8xI/7vrP/CCUSg==5BbE3yTikCyMZ9Nv"; // Ganti dengan API key kamu
const client = new Client({
    authStrategy: new LocalAuth({ clientId: "whatsapp-calorie-bot" }),
});

const porsiWajar = {
    "es teh manis": 2,
    "bakwan": 2,
    "telur rebus": 3,
    "nasi putih": 2,
    "ayam goreng": 2,
    "indomie": 1,
    "es cincau": 2,
    "kopi susu": 2,
    "burger": 1,
    "pizza": 2,
    "sate ayam": 10,
};

const makananSehat = [
    "salad sayur",
    "buah segar",
    "sup ayam bening",
    "oatmeal",
    "ikan bakar",
    "tahu rebus",
    "tempe kukus",
    "smoothie buah tanpa gula",
];

async function getNutrition(query) {
    try {
        const response = await axios.get(`${API_URL}?query=${query}`, {
            headers: { "X-Api-Key": API_KEY },
        });

        if (response.status === 200 && response.data.length > 0) {
            return response.data;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error API:", error.response?.data || error.message);
        return null;
    }
}


async function translateToEnglish(text) {
    try {
        const res = await googleTranslate(text, { from: "id", to: "en" });
        return res.text;
    } catch (err) {
        return text;
    }
}

async function simpanLogMakanan(user, items) {
    const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
    const ref = db.collection("logs").doc(user).collection("logs").doc(today);

    const existingSnap = await ref.get();
    const existingItems = existingSnap.exists ? existingSnap.data().items || [] : [];

    await ref.set({
        timestamp: new Date(),
        items: [...existingItems, ...items],
    });
    
}


async function simpanLogMakanan(user, items) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const ref = db.collection("logs").doc(user).collection("logs").doc(today);
    const existingSnap = await ref.get();
    const existingItems = existingSnap.exists ? existingSnap.data().items || [] : [];

    await ref.set({
      timestamp: new Date(),
      items: [...existingItems, ...items],
    });

    console.log("✅ Data berhasil disimpan:", items);
  } catch (error) {
    console.error("❌ Gagal menyimpan ke Firestore:", error.message);
  }
}



function analisisKebiasaan(logItems) {
    const frekuensi = {};
    for (const item of logItems) {
        const nama = item.nama;
        frekuensi[nama] = (frekuensi[nama] || 0) + item.jumlah;
    }

    const makananSering = Object.entries(frekuensi)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([makanan]) => makanan);

    const saran = makananSehat.filter((m) => !makananSering.includes(m));
    return { makananSering, saran: saran.slice(0, 3) };
}

async function rekapMingguan(user) {
    const logsRef = db.collection("logs").doc(user).collection("logs");
    const snapshot = await logsRef.get();

    let total = {
        lemak: 0,
        gula: 0,
        sodium: 0,
        hari: 0,
    };

    let hariBermasalah = {
        sodium: 0,
        gula: 0,
        lemak: 0,
    };

    snapshot.forEach(doc => {
        const items = doc.data().items || [];
        const harian = {
            lemak: 0,
            gula: 0,
            sodium: 0,
        };

        items.forEach(item => {
            const data = item.nutrisi;
            if (data) {
                harian.lemak += data.lemak || 0;
                harian.gula += data.gula || 0;
                harian.sodium += data.sodium || 0;
            }
        });

        if (items.length > 0) {
            total.hari++;
            total.lemak += harian.lemak;
            total.gula += harian.gula;
            total.sodium += harian.sodium;

            if (harian.lemak > 70) hariBermasalah.lemak++;
            if (harian.gula > 50) hariBermasalah.gula++;
            if (harian.sodium > 2000) hariBermasalah.sodium++;
        }
    });

    const rerata = {
        lemak: total.lemak / total.hari,
        gula: total.gula / total.hari,
        sodium: total.sodium / total.hari,
    };

    return { total, rerata, hariBermasalah };
}

client.on("qr", (qr) => qrcode.generate(qr, { small: true }));
client.on("authenticated", () => console.log("Berhasil login."));
client.on("ready", () => console.log("Bot aktif."));
async function ambilLogMakanan(user) {
  const logsRef = db.collection("logs").doc(user).collection("logs");
  const snapshot = await logsRef.get();

  const semuaLog = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.items && Array.isArray(data.items)) {
      semuaLog.push(...data.items);
    }
  });

  return semuaLog;
}

client.on("message", async (message) => {
    const body = message.body.toLowerCase().trim();

    const pattern = /(\d+)\s*(?:porsi|buah|butir|gelas|sendok|tusuk)?\s*([a-zA-Z\s]+)/g;
    const matches = [...body.matchAll(pattern)];
if (body === "rekap mingguan") {
    const data = await rekapMingguan(message.from);
    const r = data.rerata;
    const b = data.hariBermasalah;
    const t = data.total;

    let hasil = `📅 *Rekap Mingguan Konsumsi Anda*\n`;
    hasil += `\n📌 *Total 7 Hari (dari ${t.hari} hari makan tercatat)*`;
    hasil += `\n- Lemak total: ${t.lemak.toFixed(1)} g`;
    hasil += `\n- Gula total: ${t.gula.toFixed(1)} g`;
    hasil += `\n- Sodium total: ${t.sodium.toFixed(0)} mg`;

    hasil += `\n\n📊 *Rata-rata Harian*`;
    hasil += `\n- Lemak: ${r.lemak.toFixed(1)} g / 70 g`;
    hasil += `\n- Gula: ${r.gula.toFixed(1)} g / 50 g`;
    hasil += `\n- Sodium: ${r.sodium.toFixed(0)} mg / 2000 mg`;

    hasil += `\n\n⚠️ *Hari dengan Konsumsi Berlebih*`;
    hasil += b.lemak > 0 ? `\n- Lemak tinggi di ${b.lemak} hari` : ``;
    hasil += b.gula > 0 ? `\n- Gula tinggi di ${b.gula} hari` : ``;
    hasil += b.sodium > 0 ? `\n- Sodium tinggi di ${b.sodium} hari` : ``;
    if (b.lemak <= 0 && b.gula <= 0 && b.sodium <= 0) {
        hasil += `\n- Pola makan Anda terjaga 🎉`;
    }

    // Ambil data makanan sering
    const logItems = await ambilLogMakanan(message.from);
    const kebiasaan = analisisKebiasaan(logItems);

    if (kebiasaan.makananSering.length > 0) {
        hasil += `\n\n🔁 *Kebiasaan Makanan*`;
        hasil += `\n- Anda sering mengonsumsi: ${kebiasaan.makananSering.join(", ")}`;
        hasil += `\n- Coba variasikan dengan: ${kebiasaan.saran.join(", ")}`;
    }

    hasil += `\n\n📝 Tips: Usahakan konsumsi lebih banyak sayur, buah, dan minum air putih.\nKetik *menu sehat* untuk ide makanan sehat.`;

    return message.reply(hasil);
}


    if (!matches.length) {
        return message.reply("⚠️ Format tidak dikenali. Contoh: *2 nasi putih dan 3 sate ayam*");
    }

    let responses = [];
    let logItems = [];

    let total = {
        lemak: 0,
        lemakJenuh: 0,
        karbo: 0,
        gula: 0,
        serat: 0,
        kolesterol: 0,
        sodium: 0,
        kalium: 0,
    };

    for (const match of matches) {
        const jumlah = parseInt(match[1]);
        const namaMakanan = match[2].trim().toLowerCase();
        const enFood = await translateToEnglish(namaMakanan);
        const nutrition = await getNutrition(enFood);

        if (nutrition && nutrition[0]) {
            const n = nutrition[0];

            const nut = {
                lemak: n.fat_total_g * jumlah,
                lemakJenuh: n.fat_saturated_g * jumlah,
                karbo: n.carbohydrates_total_g * jumlah,
                gula: n.sugar_g * jumlah,
                serat: n.fiber_g * jumlah,
                kolesterol: n.cholesterol_mg * jumlah,
                sodium: n.sodium_mg * jumlah,
                kalium: n.potassium_mg * jumlah,
            };

            for (const key in nut) total[key] += nut[key];

            const warning = porsiWajar[namaMakanan] && jumlah > porsiWajar[namaMakanan]
                ? `⚠️ Melebihi porsi wajar (${jumlah} > ${porsiWajar[namaMakanan]})\n`
                : "";

            responses.push(`
🍽 ${jumlah} x ${namaMakanan}
${warning}- Lemak: ${nut.lemak.toFixed(1)} g
- Lemak jenuh: ${nut.lemakJenuh.toFixed(1)} g
- Karbohidrat: ${nut.karbo.toFixed(1)} g
- Gula: ${nut.gula.toFixed(1)} g
- Serat: ${nut.serat.toFixed(1)} g
- Kolesterol: ${nut.kolesterol.toFixed(0)} mg
- Sodium: ${nut.sodium.toFixed(0)} mg
- Kalium: ${nut.kalium.toFixed(0)} mg
            `);

            logItems.push({
    nama: namaMakanan,
    jumlah,
    nutrisi: {
        lemak: nut.lemak,
        gula: nut.gula,
        sodium: nut.sodium,
    }
});

        } else {
            responses.push(`⚠️ Data untuk "${namaMakanan}" tidak ditemukan.`);
        }
    }

    // Simpan log
    await simpanLogMakanan(message.from, logItems);
    console.log("Menyimpan log untuk:", message.from, logItems);


    responses.push(`
📊 Total Nutrisi Hari Ini:
- Lemak: ${total.lemak.toFixed(1)} g
- Lemak jenuh: ${total.lemakJenuh.toFixed(1)} g
- Karbo: ${total.karbo.toFixed(1)} g
- Gula: ${total.gula.toFixed(1)} g
- Serat: ${total.serat.toFixed(1)} g
- Kolesterol: ${total.kolesterol.toFixed(0)} mg
- Sodium: ${total.sodium.toFixed(0)} mg
- Kalium: ${total.kalium.toFixed(0)} mg
    `);

    // Peringatan kelebihan
    const warningLimit = [];
    if (total.lemak > 70) warningLimit.push("lemak");
    if (total.gula > 50) warningLimit.push("gula");
    if (total.sodium > 2000) warningLimit.push("sodium");

    if (warningLimit.length) {
        responses.push(`⚠️ Anda melebihi batas ${warningLimit.join(", ")} hari ini. Cobalah makan lebih seimbang besok.`);
    }

    // Analisis kebiasaan
    const hist = await ambilLogMakanan(message.from);
    const { makananSering, saran } = analisisKebiasaan(hist);
    if (makananSering.length) {
        responses.push(`📈 Kamu sering makan: ${makananSering.join(", ")}`);
    }
    if (saran.length) {
        responses.push(`🧠 Coba variasi makanan sehat: ${saran.join(", ")}`);
    }

    
    message.reply(responses.join("\n"));
});

client.initialize();
