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
            .setTitle('🎰 عجلة الحظ التفاعلية (Roulette)')
            .setDescription(`اضغط على زر **انضمام** للمشاركة في السحب!\n⏳ **تبدأ اللعبة تلقائياً:** <t:${endTime}:R>`)
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
                    return interaction.reply({ content: '⚠️ عذراً، العدد مكتمل (20 لاعب)!', ephemeral: true });
                }
                players.add(playerName);
                await interaction.reply({ content: `✅ تم انضمامك بنجاح يا **${playerName}**!`, ephemeral: true });
            } else if (interaction.customId === 'leave') {
                if (players.has(playerName)) {
                    players.delete(playerName);
                    await interaction.reply({ content: '❌ لقد انسحبت من اللعبة.', ephemeral: true });
                } else {
                    await interaction.reply({ content: '⚠️ أنت لست منضم أصلاً!', ephemeral: true });
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
                    return gameMessage.edit({ content: '❌ تم إلغاء اللعبة لعدم وجود عدد كافٍ من اللاعبين (أقل من 2).', embeds: [], components: [] });
                }

                const playersArray = Array.from(players);
                
                try {
                    // تأثير حركة تشويقية بالرسائل (روليت نصية متحركة)
                    await gameMessage.edit({ content: '🎡 **جارِ تدوير عجلة الحظ واختيار الفائز...** ⏳', embeds: [], components: [] });
                    
                    for (let i = 0; i < 4; i++) {
                        const randomPreview = playersArray[Math.floor(Math.random() * playersArray.length)];
                        await gameMessage.edit({ content: `🎰 **العجلة تقترب من: [ 🎲 ${randomPreview} ] ...**` });
                        await new Promise(res => setTimeout(res, 800));
                    }

                    // اختيار الفائز الحقيقي بشكل عشوائي 100%
                    const winnerIndex = Math.floor(Math.random() * playersArray.length);
                    const winner = playersArray[winnerIndex];

                    // إعلان الفائز النهائي بوضوح تام
                    await gameMessage.edit({ 
                        content: `🎉 **انتهت الروليت بنجاح!**\n🏆 الفائز السعيد هو: **${winner}** 🎯 مبروك!`
                    });

                } catch (error) {
                    console.error(error);
                    await gameMessage.edit({ content: "❌ حدث خطأ غير متوقع أثناء السحب." });
                }

            } else if (reason === 'cancel') {
                await gameMessage.edit({ content: '❌ تم إلغاء اللعبة بواسطة المنظم.', embeds: [], components: [] });
            }
        });
    }
});

client.login(process.env.TOKEN);
