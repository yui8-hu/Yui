const fs = require('fs');

const ANTICALL_PATH = './data/anticall.json';

function readState() {
    try {
        if (!fs.existsSync(ANTICALL_PATH)) return { enabled: false };
        const raw = fs.readFileSync(ANTICALL_PATH, 'utf8');
        const data = JSON.parse(raw || '{}');
        return { enabled: !!data.enabled };
    } catch {
        return { enabled: false };
    }
}

function writeState(enabled) {
    try {
        if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
        fs.writeFileSync(ANTICALL_PATH, JSON.stringify({ enabled: !!enabled }, null, 2));
    } catch {}
}

async function anticallCommand(sock, chatId, message, args) {
    const state = readState();
    const sub = (args || '').trim().toLowerCase();

    if (!sub || (sub !== 'on' && sub !== 'off' && sub !== 'status' && sub !== 'تشغيل' && sub !== 'إيقاف' && sub !== 'ايقاف' && sub !== 'الحالة' && sub !== 'الحاله')) {
        const helpMsg = `𓍢ִ໋🌷͙֒  𝒀𝒖𝒊 𝒃𝒐𝒕 ☕︎\n\n` +
            `╭━━━ ⋆｡°✩🕯️✩°｡⋆ ━━━╮\n` +
            `  📞 *أمر منع المكالمات (Anticall)*\n` +
            `╰━━━ ⋆｡°✩🍵✩°｡⋆ ━━━╯\n\n` +
            `𓂃 ☕︎ • *.anticall on* (أو تشغيل)\n` +
            `   └ لتفعيل حظر المتصلين تلقائياً\n\n` +
            `𓂃 ☕︎ • *.anticall off* (أو ايقاف)\n` +
            `   └ لإلغاء تفعيل منع المكالمات\n\n` +
            `𓂃 ☕︎ • *.anticall status* (أو الحاله)\n` +
            `   └ لعرض حالة الميزة حالياً\n\n` +
            `─── ִ ࣪ ˖ ☕︎ ִ ׄ ───`;

        await sock.sendMessage(chatId, { text: helpMsg }, { quoted: message });
        return;
    }

    if (sub === 'status' || sub === 'الحالة' || sub === 'الحاله') {
        const statusText = state.enabled ? 'مُفعل ⚡︎' : 'معطل ☕︎';
        await sock.sendMessage(chatId, { 
            text: `╭─────── 🕯️ ───────╮\n  📞 منع المكالمات حالياً: *${statusText}*\n╰─────── 𝜗𝜚 ───────╯` 
        }, { quoted: message });
        return;
    }

    const enable = (sub === 'on' || sub === 'تشغيل');
    writeState(enable);
    
    const stateMessage = enable ? 'مفعل الآن (سيتم حظر المتصلين تلقائياً) ⚡︎' : 'معطل الآن ☕︎';
    await sock.sendMessage(chatId, { 
        text: `╭─────── ☕︎ ───────╮\n  📞 تم جعل منع المكالمات: *${stateMessage}*\n╰─────── 𝜗𝜚 ───────╯` 
    }, { quoted: message });
}

module.exports = { anticallCommand, readState };
    const enable = sub === 'on';
    writeState(enable);
    await sock.sendMessage(chatId, { text: `Anticall is now *${enable ? 'ENABLED' : 'DISABLED'}*.` }, { quoted: message });
}

module.exports = { anticallCommand, readState };


