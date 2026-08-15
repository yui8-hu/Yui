const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const webp = require('node-webpmux');
const crypto = require('crypto');

const ANIMU_BASE = 'https://api.some-random-api.com/animu';

function normalizeType(input) {
    const lower = (input || '').toLowerCase();
    if (lower === 'facepalm' || lower === 'face_palm' || lower === 'كف') return 'face-palm';
    if (lower === 'quote' || lower === 'animu-quote' || lower === 'اقتباس') return 'quote';
    if (lower === 'hug' || lower === 'حضن') return 'hug';
    if (lower === 'kiss' || lower === 'بوسة') return 'kiss';
    if (lower === 'pat' || lower === 'رأس') return 'pat';
    if (lower === 'cry' || lower === 'بكاء') return 'cry';
    if (lower === 'wink' || lower === 'غمزة') return 'wink';
    if (lower === 'poke' || lower === 'وخز') return 'poke';
    if (lower === 'nom' || lower === 'أكل') return 'nom';
    return lower;
}

async function sendAnimu(sock, chatId, message, type) {
    const endpoint = `${ANIMU_BASE}/${type}`;
    const res = await axios.get(endpoint);
    const data = res.data || {};

    // Helper to convert media buffer to sticker webp
    async function convertMediaToSticker(mediaBuffer, isAnimated) {
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

        const inputExt = isAnimated ? 'gif' : 'jpg';
        const input = path.join(tmpDir, `animu_${Date.now()}.${inputExt}`);
        const output = path.join(tmpDir, `animu_${Date.now()}.webp`);
        fs.writeFileSync(input, mediaBuffer);

        const ffmpegCmd = isAnimated 
            ? `ffmpeg -y -i "${input}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,fps=15" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 60 -compression_level 6 "${output}"`
            : `ffmpeg -y -i "${input}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${output}"`;

        await new Promise((resolve, reject) => {
            exec(ffmpegCmd, (err) => (err ? reject(err) : resolve()));
        });

        let webpBuffer = fs.readFileSync(output);

        // Add sticker metadata
        const img = new webp.Image();
        await img.load(webpBuffer);

        const json = {
            'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
            'sticker-pack-name': '𝑲.𝑵.𝑯 ┆ 𝑳𝑈𝑆𝑰𝐴',
            'sticker-pack-publisher': 'Lusia Bot',
            'emojis': ['🎌']
        };
        const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
        const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
        const exif = Buffer.concat([exifAttr, jsonBuffer]);
        exif.writeUIntLE(jsonBuffer.length, 14, 4);
        img.exif = exif;

        const finalBuffer = await img.save(null);

        try { fs.unlinkSync(input); } catch {}
        try { fs.unlinkSync(output); } catch {}
        return finalBuffer;
    }

    if (data.link) {
        const link = data.link;
        const lower = link.toLowerCase();
        const isGifLink = lower.endsWith('.gif');
        const isImageLink = lower.match(/\.(jpg|jpeg|png|webp)$/);

        // Convert all media (GIFs and images) to stickers
        if (isGifLink || isImageLink) {
            try {
                const resp = await axios.get(link, {
                    responseType: 'arraybuffer',
                    timeout: 15000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                const mediaBuf = Buffer.from(resp.data);
                const stickerBuf = await convertMediaToSticker(mediaBuf, isGifLink);
                await sock.sendMessage(
                    chatId,
                    { sticker: stickerBuf },
                    { quoted: message }
                );
                return;
            } catch (error) {
                console.error('Error converting media to sticker:', error);
            }
        }

        // Fallback to image if conversion fails
        try {
            await sock.sendMessage(
                chatId,
                { image: { url: link }, caption: `✨ أنمي: ${type}` },
                { quoted: message }
            );
            return;
        } catch {}
    }
    if (data.quote) {
        await sock.sendMessage(
            chatId,
            { text: `💬 *اقتباس أنمي:*\n\n"${data.quote}"` },
            { quoted: message }
        );
        return;
    }

    await sock.sendMessage(
        chatId,
        { text: '❌ فشل في جلب تفاعل الأنمي، حاول مرة أخرى.' },
        { quoted: message }
    );
}

async function animeCommand(sock, chatId, message, args) {
    const subArg = args && args[0] ? args[0] : '';
    const sub = normalizeType(subArg);

    const supported = [
        'nom', 'poke', 'cry', 'kiss', 'pat', 'hug', 'wink', 'face-palm', 'quote'
    ];

    try {
        if (!sub) {
            const helpMsg = `✨ *أنواع تفاعلات الأنمي المتاحة:*\n\n` +
                `• *.أنمي حضن* (hug)\n` +
                `• *.أنمي بوسة* (kiss)\n` +
                `• *.أنمي رأس* (pat)\n` +
                `• *.أنمي بكاء* (cry)\n` +
                `• *.أنمي غمزة* (wink)\n` +
                `• *.أنمي كف* (face-palm)\n` +
                `• *.أنمي اقتباس* (quote)\n` +
                `• *.أنمي أكل* (nom)\n` +
                `• *.أنمي وخز* (poke)\n\n` +
                `💡 *طريقة الاستخدام:* اكتب الأمر متبوعاً بالنوع، مثال:\n.أنمي حضن  أو  .animu hug`;

            await sock.sendMessage(chatId, { text: helpMsg }, { quoted: message });
            return;
        }

        if (!supported.includes(sub)) {
            await sock.sendMessage(chatId, { text: `❌ النوع غير مدعوم: ${sub}\nيرجى كتابة *.أنمي* لمعرفة الأنواع المتاحة.` }, { quoted: message });
            return;
        }

        await sendAnimu(sock, chatId, message, sub);
    } catch (err) {
        console.error('Error in animu command:', err);
        await sock.sendMessage(chatId, { text: '❌ حدث خطأ أثناء جلب ملصق الأنمي.' }, { quoted: message });
    }
}

module.exports = { animeCommand };
        const inputExt = isAnimated ? 'gif' : 'jpg';
        const input = path.join(tmpDir, `animu_${Date.now()}.${inputExt}`);
        const output = path.join(tmpDir, `animu_${Date.now()}.webp`);
        fs.writeFileSync(input, mediaBuffer);

        const ffmpegCmd = isAnimated 
            ? `ffmpeg -y -i "${input}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,fps=15" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 60 -compression_level 6 "${output}"`
            : `ffmpeg -y -i "${input}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${output}"`;

        await new Promise((resolve, reject) => {
            exec(ffmpegCmd, (err) => (err ? reject(err) : resolve()));
        });

        let webpBuffer = fs.readFileSync(output);

        // Add sticker metadata
        const img = new webp.Image();
        await img.load(webpBuffer);

        const json = {
            'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
            'sticker-pack-name': 'Anime Stickers',
            'emojis': ['🎌']
        };
        const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
        const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
        const exif = Buffer.concat([exifAttr, jsonBuffer]);
        exif.writeUIntLE(jsonBuffer.length, 14, 4);
        img.exif = exif;

        const finalBuffer = await img.save(null);

        try { fs.unlinkSync(input); } catch {}
        try { fs.unlinkSync(output); } catch {}
        return finalBuffer;
    }

    if (data.link) {
        const link = data.link;
        const lower = link.toLowerCase();
        const isGifLink = lower.endsWith('.gif');
        const isImageLink = lower.match(/\.(jpg|jpeg|png|webp)$/);

        // Convert all media (GIFs and images) to stickers
        if (isGifLink || isImageLink) {
            try {
                const resp = await axios.get(link, {
                    responseType: 'arraybuffer',
                    timeout: 15000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                const mediaBuf = Buffer.from(resp.data);
                const stickerBuf = await convertMediaToSticker(mediaBuf, isGifLink);
                await sock.sendMessage(
                    chatId,
                    { sticker: stickerBuf },
                    { quoted: message }
                );
                return;
            } catch (error) {
                console.error('Error converting media to sticker:', error);
            }
        }

        // Fallback to image if conversion fails
        try {
            await sock.sendMessage(
                chatId,
                { image: { url: link }, caption: `anime: ${type}` },
                { quoted: message }
            );
            return;
        } catch {}
    }
    if (data.quote) {
        await sock.sendMessage(
            chatId,
            { text: data.quote },
            { quoted: message }
        );
        return;
    }

    await sock.sendMessage(
        chatId,
        { text: '❌ Failed to fetch animu.' },
        { quoted: message }
    );
}

async function animeCommand(sock, chatId, message, args) {
    const subArg = args && args[0] ? args[0] : '';
    const sub = normalizeType(subArg);

    const supported = [
        'nom', 'poke', 'cry', 'kiss', 'pat', 'hug', 'wink', 'face-palm', 'quote'
    ];

    try {
        if (!sub) {
            // Fetch supported types from API for dynamic help
            try {
                const res = await axios.get(ANIMU_BASE);
                const apiTypes = res.data && res.data.types ? res.data.types.map(s => s.replace('/animu/', '')).join(', ') : supported.join(', ');
                await sock.sendMessage(chatId, { text: `Usage: .animu <type>\nTypes: ${apiTypes}` }, { quoted: message });
            } catch {
                await sock.sendMessage(chatId, { text: `Usage: .animu <type>\nTypes: ${supported.join(', ')}` }, { quoted: message });
            }
            return;
        }

        if (!supported.includes(sub)) {
            await sock.sendMessage(chatId, { text: `❌ Unsupported type: ${sub}. Try one of: ${supported.join(', ')}` }, { quoted: message });
            return;
        }

        await sendAnimu(sock, chatId, message, sub);
    } catch (err) {
        console.error('Error in animu command:', err);
        await sock.sendMessage(chatId, { text: '❌ An error occurred while fetching animu.' }, { quoted: message });
    }
}

module.exports = { animeCommand };


