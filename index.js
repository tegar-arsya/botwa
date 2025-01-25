const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const googleTranslate = require('google-translate-api-x');

const API_URL = 'https://api.calorieninjas.com/v1/nutrition';
const API_KEY = 'Apf+3I3XIK8jktayRo+qgw==II11Jahw6B5M38s9';

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'whatsapp-calorie-bot',
    }),
});

async function getNutrition(query) {
    try {
        const response = await axios.get(`${API_URL}?query=${query}`, {
            headers: { 'X-Api-Key': API_KEY },
        });

        if (response.status === 200 && response.data.items.length > 0) {
            return response.data.items;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error saat mengakses API:', error.message);
        return null;
    }
}

async function translateToEnglish(text) {
    try {
        const res = await googleTranslate(text, { from: 'id', to: 'en' });
        return res.text;
    } catch (error) {
        console.error('Terjemahan gagal:', error);
        return text;
    }
}

client.on('qr', (qr) => {
    console.log('QR code terdeteksi, silakan scan di WhatsApp.');
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
    console.log('WhatsApp berhasil terautentikasi!');
});

client.on('auth_failure', (msg) => {
    console.error('Autentikasi gagal:', msg);
});

client.on('ready', () => {
    console.log('Bot siap digunakan!');
});

client.on('message', async (message) => {
    const rawQuery = message.body.toLowerCase().trim();

    // Bersihkan input dari kata-kata seperti "berapa total"
    const cleanedQuery = rawQuery.replace(/berapa\s+total/i, '').trim();
    const foodItems = cleanedQuery
        .replace('saya makan', '')
        .split(/\s*(?:dan|dengan|,)\s*/)
        .map(item => item.trim())
        .filter(item => item.length > 0);

    let totalCalories = 0;
    let responses = [];

    for (const food of foodItems) {
        const translatedFood = await translateToEnglish(food);
        const nutritionData = await getNutrition(translatedFood);

        if (nutritionData && nutritionData[0]) {
            const itemData = nutritionData[0];
            totalCalories += itemData.calories;
            responses.push(`
Makanan: ${food}
Kalori: ${itemData.calories} kcal
Porsi: ${itemData.serving_size_g} gram
Protein: ${itemData.protein_g} g
Karbohidrat: ${itemData.carbohydrates_total_g} g
Lemak: ${itemData.fat_total_g} g
Gula: ${itemData.sugar_g} g
Sodium: ${itemData.sodium_mg} mg
            `);
        } else {
            responses.push(`Makanan: ${food} tidak ditemukan.`);
        }
    }

    // Tambahkan informasi total kalori jika ada makanan yang berhasil ditemukan
    if (totalCalories > 0) {
        responses.push(`
-------------------------------------
Total Kalori: ${totalCalories.toFixed(1)} kcal
-------------------------------------
        `);
    }

    const reply = responses.join('\n');
    message.reply(reply);
});

client.initialize();
