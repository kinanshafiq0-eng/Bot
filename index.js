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

// دالة رسم العجلة
async function generateRouletteImage(players, winnerIndex) {
    const width = 600;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 250;

    // 🔴⚫ تعديل الألوان لتكون أحمر وأسود فقط
    const colors = ['#e53935', '#212121']; // أحمر كازينو وأسود داكن
    const sliceAngle = (2 * Math.PI) / players.length;

    // حساب زاوية الدوران لكي يشير السهم إلى الفائز
    const offsetAngle = - (winnerIndex * sliceAngle + sliceAngle / 2);

    for (let i = 0; i < players.length; i++) {
        const startAngle = i * sliceAngle + offsetAngle;
        const endAngle = (i + 1) * sliceAngle + offsetAngle;

        // رسم القطعة
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();

        // التبديل بين الأحمر والأسود
        // ملاحظة: إذا كان العدد فردياً، ستكون القطعة الأولى والأخيرة بنفس اللون، لتمييزها يمكن إضافة لون ثالث للصفر مستقبلاً
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();

        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // كتابة الأسماء على العجلة
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // لون النص أبيض ليبرز على الأحمر والأسود
        ctx.fillStyle = '#ffffff';
        
        // تصغير الخط إذا كان العدد كبيراً حتى لا تتداخل الأسماء
        const fontSize = players.length > 12 ? 14 : 20;
        ctx.font = `bold ${fontSize}px Arial`;
        
        // رسم الاسم داخل القطعة
        ctx.fillText(players[i], radius / 1.5, 0);
        ctx.restore();
    }

    // الدائرة الوسطى
    ctx.beginPath();
    ctx.arc(centerX, centerY, 70, 0, 2 * Math.PI);
    ctx.fillStyle = '#121212'; // لون أسود أغمق للمنتصف
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('ROULETTE', centerX, centerY);

    // السهم الجانبي
    ctx.beginPath();
    ctx.moveTo(centerX + radius + 5, centerY);
    ctx.lineTo(centerX + radius + 35, centerY - 15);
    ctx.lineTo(centerX + radius + 35, centerY + 15);
    ctx.closePath();
    ctx.fillStyle = '#e0e0e0';
    ctx.fill();

    return canvas.toBuffer();
}

client.on('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content === '!roulette') {
        const players = new Set();
        const MAX_PLAYERS = 20;
        
        const endTime = Math.floor(Date.now() / 1000) + 30;

        const embed = new EmbedBuilder()
            .setTitle('🎰 عجلة الحظ (Roulette)')
            .setDescription(`اضغط على الأزرار للانضمام!\n⏳ **تبدأ اللعبة تلقائياً:** <t:${endTime}:R>`)
            .setColor('#e53935') // تم تغيير لون الإيمبد للأحمر
            .addFields({ name: `👥 المشاركون (0/${MAX_PLAYERS}):`, value: 'لا يوجد مشاركين حتى الآن.' });

        const joinBtn = new ButtonBuilder().setCustomId('join').setLabel('انضمام').setStyle(ButtonStyle.Success);
        const leaveBtn = new ButtonBuilder().setCustomId('leave').setLabel('انسحاب').setStyle(ButtonStyle.Danger);
        const startBtn = new ButtonBuilder().setCustomId('start').setLabel('بدء الآن').setStyle(ButtonStyle.Primary);
        const cancelBtn = new ButtonBuilder().setCustomId('cancel').setLabel('إلغاء').setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(joinBtn, leaveBtn, startBtn, cancelBtn);

        const gameMessage = await message.reply({ embeds: [embed], components: [row] });

        const collector = gameMessage.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 });

        collector.on('collect', async interaction => {
            const playerName = interaction.user.displayName || interaction.user.username;

            if (interaction.customId === 'join') {
                if (players.size >= MAX_PLAYERS && !players.has(playerName)) {
                    return interaction.reply({ content: '⚠️ عذراً، العدد مكتمل (20 لاعب)!', ephemeral: true });
                }
                players.add(playerName);
                
            } else if (interaction.customId === 'leave') {
                players.delete(playerName);
                
            } else if (interaction.customId === 'start') {
                if (interaction.user.id !== message.author.id) {
                    return interaction.reply({ content: '⚠️ صاحب الأمر فقط يمكنه تخطي الوقت وبدء اللعبة!', ephemeral: true });
                }
                if (players.size < 2) {
                    return interaction.reply({ content: '⚠️ نحتاج إلى لاعبين (2) على الأقل للبدء!', ephemeral: true });
                }
                collector.stop('start');
                return;
                
            } else if (interaction.customId === 'cancel') {
                if (interaction.user.id !== message.author.id) {
                    return interaction.reply({ content: '⚠️ صاحب الأمر فقط يمكنه إلغاء اللعبة!', ephemeral: true });
                }
                collector.stop('cancel');
                return;
            }

            const playersList = players.size > 0 ? Array.from(players).join('\n') : 'لا يوجد مشاركين حتى الآن.';
            const updatedEmbed = EmbedBuilder.from(embed).setFields({ name: `👥 المشاركون (${players.size}/${MAX_PLAYERS}):`, value: playersList });
            
            await interaction.update({ embeds: [updatedEmbed] });
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time' || reason === 'start') {
                if (players.size < 2) {
                    return gameMessage.edit({ content: '❌ تم إلغاء اللعبة لعدم وجود عدد كافٍ من اللاعبين (أقل من 2).', embeds: [], components: [] });
                }

                await gameMessage.edit({ content: '🔄 جاري تدوير العجلة...', embeds: [], components: [] });
                
                const playersArray = Array.from(players);
                const winnerIndex = Math.floor(Math.random() * playersArray.length);
                const winner = playersArray[winnerIndex];

                try {
                    const buffer = await generateRouletteImage(playersArray, winnerIndex);
                    const attachment = new AttachmentBuilder(buffer, { name: 'roulette.png' });

                    await gameMessage.edit({ content: `🎉 الفائز هو: **${winner}**! 🎯`, files: [attachment] });
                } catch (error) {
                    console.error(error);
                    await gameMessage.edit({ content: "❌ حدث خطأ أثناء رسم العجلة." });
                }

            } else if (reason === 'cancel') {
                await gameMessage.edit({ content: '❌ تم إلغاء اللعبة من قبل صاحب الأمر.', embeds: [], components: [] });
            }
        });
    }
});

client.login(process.env.TOKEN);
