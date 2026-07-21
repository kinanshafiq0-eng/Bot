require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    AttachmentBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ComponentType 
} = require('discord.js');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');

// إذا كان عندك ملف خط مرفق في المشروع، يمكنك تسجيله هكذا لضمان عدم ظهور المربعات:
// GlobalFonts.registerFromPath(path.join(__dirname, 'font.ttf'), 'CustomFont');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

async function generateRouletteImage(playersCount, winnerIndex, rotationOffset = 0) {
    const width = 600;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 250;

    const colors = ['#e53935', '#1e1e1e', '#1565c0', '#2e7d32', '#6a1b9a', '#f57f17']; 
    const sliceAngle = (2 * Math.PI) / playersCount;

    const baseAngle = - (winnerIndex * sliceAngle + sliceAngle / 2);
    const offsetAngle = baseAngle + rotationOffset;

    // 1. رسم الشرائح
    for (let i = 0; i < playersCount; i++) {
        const startAngle = i * sliceAngle + offsetAngle;
        const endAngle = (i + 1) * sliceAngle + offsetAngle;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();

        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();

        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
    }

    // 2. رسم الأرقام باستخدام خط قياسي آمن
    for (let i = 0; i < playersCount; i++) {
        const startAngle = i * sliceAngle + offsetAngle;
        const endAngle = (i + 1) * sliceAngle + offsetAngle;
        const middleAngle = startAngle + (sliceAngle / 2);

        const textRadius = radius * 0.65; 
        const textX = centerX + Math.cos(middleAngle) * textRadius;
        const textY = centerY + Math.sin(middleAngle) * textRadius;

        ctx.save();
        ctx.translate(textX, textY);
        // تدوير الرقم ليتبع زاوية الشريحة بشكل احترافي
        ctx.rotate(middleAngle + Math.PI / 2);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px sans-serif';
        
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 6;
        
        ctx.fillText(`${i + 1}`, 0, 0);
        ctx.restore();
    }

    // الدائرة الوسطى
    ctx.beginPath();
    ctx.arc(centerX, centerY, 60, 0, 2 * Math.PI);
    ctx.fillStyle = '#121212';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('SPIN', centerX, centerY);

    // السهم
    ctx.beginPath();
    ctx.moveTo(centerX + radius + 5, centerY);
    ctx.lineTo(centerX + radius + 35, centerY - 15);
    ctx.lineTo(centerX + radius + 35, centerY + 15);
    ctx.closePath();
    ctx.fillStyle = '#ffd700';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    return canvas.toBuffer('image/png');
}

client.on('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content === '!roulette') {
        const playersMap = new Map();
        const MAX_PLAYERS = 15;
        const endTime = Math.floor(Date.now() / 1000) + 30;

        const embed = new EmbedBuilder()
            .setTitle('🎰 عجلة الحظ (Roulette)')
            .setDescription(`اضغط على زر **انضمام** ليتم إعطاؤك رقماً على العجلة!\n⏳ **تبدأ اللعبة تلقائياً:** <t:${endTime}:R>`)
            .setColor('#e53935')
            .addFields({ name: `👥 المشاركون (0/${MAX_PLAYERS}):`, value: 'لا يوجد مشاركين حتى الآن.' });

        const joinBtn = new ButtonBuilder().setCustomId('join').setLabel('انضمام 🟢').setStyle(ButtonStyle.Success);
        const leaveBtn = new ButtonBuilder().setCustomId('leave').setLabel('انسحاب 🔴').setStyle(ButtonStyle.Danger);
        const startBtn = new ButtonBuilder().setCustomId('start').setLabel('بدء الآن 🚀').setStyle(ButtonStyle.Primary);
        const cancelBtn = new ButtonBuilder().setCustomId('cancel').setLabel('إلغاء ❌').setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(joinBtn, leaveBtn, startBtn, cancelBtn);
        const gameMessage = await message.reply({ embeds: [embed], components: [row] });

        const collector = gameMessage.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 });

        collector.on('collect', async interaction => {
            const userId = interaction.user.id;
            const playerName = interaction.user.displayName || interaction.user.username;

            if (interaction.customId === 'join') {
                if (playersMap.size >= MAX_PLAYERS && !playersMap.has(userId)) {
                    return interaction.reply({ content: '⚠️ عذراً، العدد مكتمل!', ephemeral: true });
                }

                if (!playersMap.has(userId)) {
                    const assignedNumber = playersMap.size + 1;
                    playersMap.set(userId, { name: playerName, number: assignedNumber });
                }

                const playerObj = playersMap.get(userId);
                await interaction.reply({ content: `✅ تم انضمامك! رقمك على العجلة: **#${playerObj.number}**`, ephemeral: true });

            } else if (interaction.customId === 'leave') {
                if (playersMap.has(userId)) {
                    playersMap.delete(userId);
                    let counter = 1;
                    for (let [id, data] of playersMap.entries()) {
                        data.number = counter++;
                    }
                    await interaction.reply({ content: '❌ لقد انسحبت وتم إعادة ترتيب الأرقام.', ephemeral: true });
                } else {
                    return interaction.reply({ content: '⚠️ أنت لست منضم أصلاً!', ephemeral: true });
                }
            } else if (interaction.customId === 'start') {
                if (userId !== message.author.id) {
                    return interaction.reply({ content: '⚠️ صاحب الأمر فقط يمكنه بدء اللعبة!', ephemeral: true });
                }
                if (playersMap.size < 2) {
                    return interaction.reply({ content: '⚠️ نحتاج إلى لاعبين (2) على الأقل للبدء!', ephemeral: true });
                }
                collector.stop('start');
                return;
            } else if (interaction.customId === 'cancel') {
                if (userId !== message.author.id) {
                    return interaction.reply({ content: '⚠️ صاحب الأمر فقط يمكنه الإلغاء!', ephemeral: true });
                }
                collector.stop('cancel');
                return;
            }

            const playersArray = Array.from(playersMap.values());
            const playersList = playersArray.length > 0 
                ? playersArray.map(p => `**#${p.number}** - ${p.name}`).join('\n') 
                : 'لا يوجد مشاركين حتى الآن.';

            const updatedEmbed = EmbedBuilder.from(embed).setFields({ name: `👥 المشاركون (${playersMap.size}/${MAX_PLAYERS}):`, value: playersList });
            await gameMessage.edit({ embeds: [updatedEmbed] });
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time' || reason === 'start') {
                if (playersMap.size < 2) {
                    return gameMessage.edit({ content: '❌ تم إلغاء اللعبة لعدم وجود لاعبين كفاية.', embeds: [], components: [] });
                }

                const playersArray = Array.from(playersMap.values());
                const winnerIndex = Math.floor(Math.random() * playersArray.length);
                const winnerObj = playersArray[winnerIndex];

                try {
                    await gameMessage.edit({ content: '🎡 **جارِ تدوير العجلة...**', embeds: [], components: [] });
                    
                    const rotations = [Math.PI * 6, Math.PI * 4, Math.PI * 2, Math.PI];
                    for (let rot of rotations) {
                        const tempBuffer = await generateRouletteImage(playersArray.length, winnerIndex, rot);
                        await gameMessage.edit({
                            content: '🎡 **العجلة تلف بسرعة...**',
                            files: [new AttachmentBuilder(tempBuffer, { name: 'spinning.png' })]
                        });
                        await new Promise(res => setTimeout(res, 600));
                    }

                    const finalBuffer = await generateRouletteImage(playersArray.length, winnerIndex, 0);
                    const finalAttachment = new AttachmentBuilder(finalBuffer, { name: 'roulette.png' });

                    const finalPlayersList = playersArray.map(p => p.number === winnerObj.number ? `🏆 **#${p.number} - ${p.name} (الفائز!)**` : `**#${p.number}** - ${p.name}`).join('\n');
                    
                    const finalEmbed = new EmbedBuilder()
                        .setTitle('🎰 نتائج عجلة الحظ')
                        .setDescription(`🎉 الفائز هو صاحب الرقم **#${winnerObj.number}**\n👤 الاسم: **${winnerObj.name}** 🎯`)
                        .setColor('#ffd700')
                        .addFields({ name: `👥 قائمة المشاركين النهائية:`, value: finalPlayersList });

                    await gameMessage.edit({ 
                        content: `🎉 **انتهت الروليت!**`, 
                        embeds: [finalEmbed],
                        files: [finalAttachment],
                        components: []
                    });

                } catch (error) {
                    console.error(error);
                    await gameMessage.edit({ content: "❌ حدث خطأ أثناء تدوير العجلة." });
                }

            } else if (reason === 'cancel') {
                await gameMessage.edit({ content: '❌ تم إلغاء اللعبة.', embeds: [], components: [] });
            }
        });
    }
});

client.login(process.env.TOKEN);
