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
const { createCanvas } = require('canvas');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// دالة رسم العجلة مع كتابة أسماء المشاركين بوضوح تام داخل صورة الروليت
async function generateRouletteImage(players, winnerIndex, rotationOffset = 0) {
    const width = 600;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 250;

    const colors = ['#e53935', '#212121', '#1565c0', '#2e7d32', '#6a1b9a', '#f57f17', '#00838f', '#ad1457']; 
    const sliceAngle = (2 * Math.PI) / players.length;

    const baseAngle = - (winnerIndex * sliceAngle + sliceAngle / 2);
    const offsetAngle = baseAngle + rotationOffset;

    // 1. رسم الشرائح والألوان
    for (let i = 0; i < players.length; i++) {
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

    // 2. كتابة أسماء المشاركين داخل الشرائح بخط واضح
    for (let i = 0; i < players.length; i++) {
        const startAngle = i * sliceAngle + offsetAngle;
        const endAngle = (i + 1) * sliceAngle + offsetAngle;
        const middleAngle = startAngle + (sliceAngle / 2);

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(middleAngle);

        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        
        // تعديل حجم الخط بناءً على عدد اللاعبين لكي يتناسب مع المساحة
        const fontSize = players.length > 10 ? 12 : 16;
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        
        // ظل خفيف للنص ليكون مقروءاً بوضوح تام فوق الألوان
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;

        let displayName = players[i];
        if (displayName.length > 12) {
            displayName = displayName.substring(0, 10) + '..';
        }
        
        ctx.fillText(displayName, radius - 35, 0);
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
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText('ROULETTE', centerX, centerY);

    // السهم الجانبي لتحديد الفائز
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
        const players = new Set();
        const MAX_PLAYERS = 15; // حد مناسب جداً لعرض الأسماء بوضوح داخل الصورة
        const endTime = Math.floor(Date.now() / 1000) + 30;

        const embed = new EmbedBuilder()
            .setTitle('🎰 عجلة الحظ (Roulette)')
            .setDescription(`اضغط على زر **انضمام** ليتم إضافة اسمك مباشرة على صورة العجلة!\n⏳ **تبدأ اللعبة تلقائياً:** <t:${endTime}:R>`)
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
            const playerName = interaction.user.displayName || interaction.user.username;

            if (interaction.customId === 'join') {
                if (players.size >= MAX_PLAYERS && !players.has(playerName)) {
                    return interaction.reply({ content: '⚠️ عذراً، العدد مكتمل (15 لاعب كحد أقصى)!', ephemeral: true });
                }
                players.add(playerName);
                await interaction.reply({ content: `✅ تم انضمامك وعرض اسمك على العجلة يا **${playerName}**!`, ephemeral: true });
            } else if (interaction.customId === 'leave') {
                if (players.has(playerName)) {
                    players.delete(playerName);
                    await interaction.reply({ content: '❌ لقد انسحبت من العجلة.', ephemeral: true });
                } else {
                    return interaction.reply({ content: '⚠️ أنت لست منضم أصلاً!', ephemeral: true });
                }
            } else if (interaction.customId === 'start') {
                if (interaction.user.id !== message.author.id) {
                    return interaction.reply({ content: '⚠️ صاحب الأمر فقط يمكنه بدء اللعبة!', ephemeral: true });
                }
                if (players.size < 2) {
                    return interaction.reply({ content: '⚠️ نحتاج إلى لاعبين (2) على الأقل للبدء!', ephemeral: true });
                }
                collector.stop('start');
                return;
            } else if (interaction.customId === 'cancel') {
                if (interaction.user.id !== message.author.id) {
                    return interaction.reply({ content: '⚠️ صاحب الأمر فقط يمكنه الإلغاء!', ephemeral: true });
                }
                collector.stop('cancel');
                return;
            }

            const playersArray = Array.from(players);
            const playersList = playersArray.length > 0 
                ? playersArray.map((p, idx) => `**${idx + 1}.** ${p}`).join('\n') 
                : 'لا يوجد مشاركين حتى الآن.';

            const updatedEmbed = EmbedBuilder.from(embed).setFields({ name: `👥 المشاركون (${players.size}/${MAX_PLAYERS}):`, value: playersList });
            await gameMessage.edit({ embeds: [updatedEmbed] });
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time' || reason === 'start') {
                if (players.size < 2) {
                    return gameMessage.edit({ content: '❌ تم إلغاء اللعبة لعدم وجود لاعبين كفاية.', embeds: [], components: [] });
                }

                const playersArray = Array.from(players);
                const winnerIndex = Math.floor(Math.random() * playersArray.length);
                const winner = playersArray[winnerIndex];

                try {
                    await gameMessage.edit({ content: '🎡 **جارِ تدوير العجلة وأسماء المشاركين تتحرك...**', embeds: [], components: [] });
                    
                    // تأثير حركة الدوران عبر عدة صور متتالية
                    const rotations = [Math.PI * 6, Math.PI * 4, Math.PI * 2, Math.PI];
                    for (let rot of rotations) {
                        const tempBuffer = await generateRouletteImage(playersArray, winnerIndex, rot);
                        await gameMessage.edit({
                            content: '🎡 **العجلة تلف بسرعة...**',
                            files: [new AttachmentBuilder(tempBuffer, { name: 'spinning.png' })]
                        });
                        await new Promise(res => setTimeout(res, 600));
                    }

                    // الصورة النهائية عند توقف السهم على الفائز
                    const finalBuffer = await generateRouletteImage(playersArray, winnerIndex, 0);
                    const finalAttachment = new AttachmentBuilder(finalBuffer, { name: 'roulette.png' });

                    await gameMessage.edit({ 
                        content: `🎉 **انتهت الروليت!**\n🎯 الفائز الذي استقر عليه السهم هو: **${winner}** 🏆 مبروك!`, 
                        files: [finalAttachment] 
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
