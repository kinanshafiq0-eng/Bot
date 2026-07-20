require('dotenv').config();
const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const { createCanvas } = require('canvas');

// إعداد البوت مع الصلاحيات اللازمة
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// دالة رسم عجلة الحظ
async function generateRouletteImage(players) {
    const width = 600;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 250;

    // ألوان القطع
    const colors = ['#95d524', '#26a69a', '#9c27b0', '#5d4037', '#ff9800', '#03a9f4'];
    const sliceAngle = (2 * Math.PI) / players.length;

    // رسم قطع العجلة
    for (let i = 0; i < players.length; i++) {
        const startAngle = i * sliceAngle;
        const endAngle = (i + 1) * sliceAngle;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();

        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();

        // رسم حدود بيضاء لكل قطعة
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // إضافة أسماء اللاعبين
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(players[i], radius / 1.5, 0);
        ctx.restore();
    }

    // الدائرة السوداء في المنتصف
    ctx.beginPath();
    ctx.arc(centerX, centerY, 70, 0, 2 * Math.PI);
    ctx.fillStyle = '#2c2f33';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // نص ROULETTE في المنتصف
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial';
    ctx.fillText('ROULETTE', centerX, centerY);

    // السهم الجانبي (المؤشر)
    ctx.beginPath();
    ctx.moveTo(centerX + radius + 5, centerY);
    ctx.lineTo(centerX + radius + 35, centerY - 15);
    ctx.lineTo(centerX + radius + 35, centerY + 15);
    ctx.closePath();
    ctx.fillStyle = '#e0e0e0';
    ctx.fill();

    return canvas.toBuffer();
}

// عندما يشتغل البوت
client.on('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}!`);
});

// استقبال الرسائل والأوامر
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content.startsWith('!roulette')) {
        const args = message.content.split(' ').slice(1);
        
        if (args.length < 2) {
            return message.reply("⚠️ يرجى إدخال اسمين على الأقل! مثال: `!roulette Ali Omar`");
        }

        const msg = await message.reply("🔄 جاري تجهيز العجلة...");

        try {
            const buffer = await generateRouletteImage(args);
            const attachment = new AttachmentBuilder(buffer, { name: 'roulette.png' });
            
            const winner = args[Math.floor(Math.random() * args.length)];

            await msg.delete();
            await message.reply({ content: `🎉 الفائز هو: **${winner}**!`, files: [attachment] });
        } catch (error) {
            console.error(error);
            await message.reply("❌ حدث خطأ أثناء رسم العجلة.");
        }
    }
});

// تسجيل الدخول باستخدام التوكن من المتغيرات البيئية
client.login(process.env.TOKEN);
