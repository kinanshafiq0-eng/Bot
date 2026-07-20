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

// إعداد البوت
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// دالة رسم عجلة الحظ (نفس الدالة السابقة بدون تغيير)
async function generateRouletteImage(players) {
    const width = 600;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 250;

    const colors = ['#95d524', '#26a69a', '#9c27b0', '#5d4037', '#ff9800', '#03a9f4'];
    const sliceAngle = (2 * Math.PI) / players.length;

    for (let i = 0; i < players.length; i++) {
        const startAngle = i * sliceAngle;
        const endAngle = (i + 1) * sliceAngle;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();

        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();

        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

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

    ctx.beginPath();
    ctx.arc(centerX, centerY, 70, 0, 2 * Math.PI);
    ctx.fillStyle = '#2c2f33';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial';
    ctx.fillText('ROULETTE', centerX, centerY);

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

    // تعديل الأمر ليعمل بدون الحاجة لكتابة الأسماء جنبه
    if (message.content === '!roulette') {
        
        // استخدام Set لضمان عدم تكرار أسماء نفس الشخص إذا ضغط مرتين
        const players = new Set();

        // إعداد رسالة الإيمبد
        const embed = new EmbedBuilder()
            .setTitle('🎰 عجلة الحظ (Roulette)')
            .setDescription('اضغط على الأزرار بالأسفل للانضمام أو الانسحاب من السحب!')
            .setColor('#2c2f33')
            .addFields({ name: '👥 المشاركون (0):', value: 'لا يوجد مشاركين حتى الآن.' });

        // إعداد الأزرار
        const joinBtn = new ButtonBuilder().setCustomId('join').setLabel('انضمام').setStyle(ButtonStyle.Success);
        const leaveBtn = new ButtonBuilder().setCustomId('leave').setLabel('انسحاب').setStyle(ButtonStyle.Danger);
        const startBtn = new ButtonBuilder().setCustomId('start').setLabel('اختيار عشوائي').setStyle(ButtonStyle.Primary);
        const cancelBtn = new ButtonBuilder().setCustomId('cancel').setLabel('إلغاء').setStyle(ButtonStyle.Secondary);

        // وضع الأزرار في صف واحد
        const row = new ActionRowBuilder().addComponents(joinBtn, leaveBtn, startBtn, cancelBtn);

        // إرسال الرسالة
        const gameMessage = await message.reply({ embeds: [embed], components: [row] });

        // إنشاء مراقب (Collector) لانتظار ضغطات الأزرار لمدة دقيقتين (120 ثانية)
        const collector = gameMessage.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120000 });

        collector.on('collect', async interaction => {
            
            if (interaction.customId === 'join') {
                players.add(interaction.user.displayName || interaction.user.username);
                
            } else if (interaction.customId === 'leave') {
                players.delete(interaction.user.displayName || interaction.user.username);
                
            } else if (interaction.customId === 'start') {
                // التأكد أن صاحب الأمر فقط هو من يمكنه بدء اللعبة
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
                    return interaction.reply({ content: '⚠️ صاحب الأمر فقط يمكنه إلغاء اللعبة!', ephemeral: true });
                }
                collector.stop('cancel');
                return;
            }

            // تحديث الإيمبد بأسماء المشاركين الجديدة
            const playersList = players.size > 0 ? Array.from(players).join('\n') : 'لا يوجد مشاركين حتى الآن.';
            const updatedEmbed = EmbedBuilder.from(embed).setFields({ name: `👥 المشاركون (${players.size}):`, value: playersList });
            
            await interaction.update({ embeds: [updatedEmbed] });
        });

        // عندما ينتهي الوقت أو يتم إيقاف المراقب (بدء أو إلغاء)
        collector.on('end', async (collected, reason) => {
            if (reason === 'start') {
                await gameMessage.edit({ content: '🔄 جاري تدوير العجلة...', embeds: [], components: [] });
                
                const playersArray = Array.from(players);
                try {
                    const buffer = await generateRouletteImage(playersArray);
                    const attachment = new AttachmentBuilder(buffer, { name: 'roulette.png' });
                    const winner = playersArray[Math.floor(Math.random() * playersArray.length)];

                    await gameMessage.edit({ content: `🎉 الفائز هو: **${winner}**!`, files: [attachment] });
                } catch (error) {
                    console.error(error);
                    await gameMessage.edit({ content: "❌ حدث خطأ أثناء رسم العجلة." });
                }
            } else if (reason === 'cancel') {
                await gameMessage.edit({ content: '❌ تم إلغاء اللعبة.', embeds: [], components: [] });
            } else {
                // إذا انتهت الـ 120 ثانية ولم يقم أحد بالبدء
                await gameMessage.edit({ content: '⏳ انتهى وقت الانضمام (دقيقتين).', components: [] });
            }
        });
    }
});

// تسجيل الدخول باستخدام التوكن من المتغيرات البيئية
client.login(process.env.TOKEN);
