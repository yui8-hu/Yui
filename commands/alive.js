const settings = require("../settings");
async function aliveCommand(sock, chatId, message) {
    try {
        const message1 = `*🤖 البوت يعمل بنجاح!🪐*\n\n` +
                       `*الإصدار:* ${settings.version}\n` +
                       `*الحالة:* متصل (Online)\n` +
                       `*الوضع:* عام (Public)\n\n` +
                       `*🌟 الميزات:* \n` +
                       `• إدارة المجموعات والجروبات\n` +
                       `• حماية طرد الروابط (Antilink)\n` +
                       `• ألعاب وتسلية\n` +
                       `• والمزيد من الأدوات!\n\n` +
                       `اكتبي *.menu* أو *.اوامر* لعرض القائمة الكاملة ✨`;

        await sock.sendMessage(chatId, {
            text: message1,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363161513685998@newsletter',
                    newsletterName: 'Lusia Bot',
                    serverMessageId: -1
                }
            }
        }, { quoted: message });
    } catch (error) {
        console.error('Error in alive command:', error);
        await sock.sendMessage(chatId, { text: 'البوت يعمل بنجاح وبشكل مستقر! ✨' }, { quoted: message });
    }
}

module.exports = aliveCommand;
