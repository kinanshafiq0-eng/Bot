require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ComponentType 
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

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
            .setColor('#e53935')
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

            const playersList = players.size > 0 ? Array.from(players).join('\n') : 'لا يوجد مشاركين حتى الآن.';
            const updatedEmbed = EmbedBuilder.from(embed).setFields({ name: `👥 المشاركون (${players.size}/${MAX_PLAYERS}):`, value: playersList });
            await interaction.update({ embeds: [updatedEmbed] });
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time' || reason === 'start') {
                if (players.size < 2) {
                    return gameMessage.edit({ content: '❌ تم إلغاء اللعبة لعدم وجود عدد كافٍ من اللاعبين.', embeds: [], components: [] });
                }

                const playersArray = Array.from(players);
                const winnerIndex = Math.floor(Math.random() * playersArray.length);
                const winner = playersArray[winnerIndex];

                try {
                    await gameMessage.edit({ content: '🎡 **جارِ تدوير عجلة الحظ الحقيقية...** ⏳', embeds: [], components: [] });
                    
                    // تأثير الحركة عبر تغيير الأسماء بسرعة لتعطي إيحاء الدوران
                    for (let i = 0; i < 5; i++) {
                        const randomPlayer = playersArray[Math.floor(Math.random() * playersArray.length)];
                        await gameMessage.edit({ content: `🎰 **العجلة تقترب من: [ ${randomPlayer} ] ...**` });
                        await new Promise(res => setTimeout(res, 700));
                    }

                    // إعلان الفائز النهائي بوضوح تام وبدون أي أخطاء
                    await gameMessage.edit({ 
                        content: `🎉 **انتهت الروليت! الفائز السعيد هو:**\n🏆 **${winner}** 🎯`
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
