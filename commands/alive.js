const settings = require("../settings");

async function aliveCommand(sock, chatId, message) {
    try {
        const message1 = `𓍢ִ໋🌷͙֒  𝒀𝒖𝒊 𝒃𝒐𝒕 ☕︎\n\n` +
                       `╭━━━ ⋆｡°✩🕯️✩°｡⋆ ━━━╮\n` +
                       `  ✨ *البوت يعمل بنجاح وبشكل مستقر!*\n` +
                       `╰━━━ ⋆｡°✩🍵✩°｡⋆ ━━━╯\n\n` +
                       `𓂃 📜 • *الإصدار:* ${settings.version}\n` +
                       `𓂃 🥟 • *الحالة:* متصل (Online) ⚡︎\n` +
                       `𓂃 ☕︎ • *الوضع:* عام (Public)\n\n` +
                       `𓏲  ─────── الميزات ───────  𓏲\n` +
                       `• إدارة المجموعات والفعاليات 🍵\n` +
                       `• حماية الجروب وطرد الروابط 🕯️\n` +
                       `• ألعاب، تفاعل، وذكاء اصطناعي 𝜗𝜚\n` +
                       `• أدوات تنزيل وملصقات متنوعة 🎀\n\n` +
                       `─── ִ ࣪ ˖ ☕︎ ִ ׄ ───\n` +
                       `اكتبي *.الاوامر* أو *.قائمة* لعرض القائمة الكاملة ✨`;

        await sock.sendMessage(chatId, {
            text: message1,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363161513685998@newsletter',
                    newsletterName: '⎯⎯ 𝒀𝒖𝒊 𝒃𝒐𝒕 ☕︎',
                    serverMessageId: -1
                }
            }
        }, { quoted: message });
    } catch (error) {
        console.error('Error in alive command:', error);
        await sock.sendMessage(chatId, { 
            text: '╭─────── ☕︎ ───────╮\n  𝒀𝒖𝒊 𝒃𝒐𝒕 يعمل بنجاح وبشكل مستقر! ✨\n╰─────── 𝜗𝜚 ───────╯' 
        }, { quoted: message });
    }
}

module.exports = aliveCommand;
