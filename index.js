require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.on('ready', () => {
    console.log(`✅ Elimination Roulette Bot Logged in as ${client.user.tag}!`);
    client.user.setActivity('!روليت للإقصاء', { type: 3 });
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    const prefix = '!';

    if (message.content === prefix + 'روليت' || message.content === prefix + 'roulette') {
        const playersMap = new Map();
        const MAX_PLAYERS = 20;
        const durationSeconds = 30; // وقت التقديم (30 ثانية)
        const endTime = Math.floor(Date.now() / 1000) + durationSeconds;

        const embed = new EmbedBuilder()
            .setTitle('🔥 عجلة الطرد والإقصاء (Battle Royale)')
            .setDescription(`اضغط على زر **انضمام** للمشاركة!\nكل جولة سيتم طرد شخص عشوائياً حتى يبقى شخص واحد فقط.\n\n⏳ **تبدأ اللعبة تلقائياً بعد:** <t:${endTime}:R>`)
            .setColor('#e53935')
            .addFields({ name: `👥 المشاركون (0/${MAX_PLAYERS}):`, value: 'لا يوجد مشاركين حتى الآن.' });

        const joinBtn = new ButtonBuilder().setCustomId('join').setLabel('انضمام 🟢').setStyle(ButtonStyle.Success);
        const leaveBtn = new ButtonBuilder().setCustomId('leave').setLabel('انسحاب 🔴').setStyle(ButtonStyle.Danger);
        const startBtn = new ButtonBuilder().setCustomId('start').setLabel('بدء الآن 🚀').setStyle(ButtonStyle.Primary);
        const cancelBtn = new ButtonBuilder().setCustomId('cancel').setLabel('إلغاء ❌').setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(joinBtn, leaveBtn, startBtn, cancelBtn);
        const gameMessage = await message.reply({ embeds: [embed], components: [row] });

        const collector = gameMessage.createMessageComponentCollector({ time: durationSeconds * 1000 });

        collector.on('collect', async interaction => {
            const userId = interaction.user.id;
            const playerName = interaction.user.displayName || interaction.user.username;

            if (interaction.customId === 'join') {
                if (playersMap.size >= MAX_PLAYERS && !playersMap.has(userId)) {
                    return interaction.reply({ content: '⚠️ عذراً، العدد مكتمل!', ephemeral: true });
                }

                if (!playersMap.has(userId)) {
                    playersMap.set(userId, { id: userId, name: playerName });
                }

                await interaction.reply({ content: `✅ تم انضمامك بنجاح إلى المعركة!`, ephemeral: true });

            } else if (interaction.customId === 'leave') {
                if (playersMap.has(userId)) {
                    playersMap.delete(userId);
                    await interaction.reply({ content: '❌ لقد انسحبت من المعركة.', ephemeral: true });
                } else {
                    return interaction.reply({ content: '⚠️ أنت لست منضم أصلاً!', ephemeral: true });
                }
            } else if (interaction.customId === 'start') {
                if (userId !== message.author.id) {
                    return interaction.reply({ content: '⚠️ صاحب الأمر فقط يمكنه بدء اللعبة!', ephemeral: true });
                }
                if (playersMap.size < 3) {
                    return interaction.reply({ content: '⚠️ نحتاج إلى 3 لاعبين على الأقل لبدء لعبة الإقصاء!', ephemeral: true });
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
                ? playersArray.map(p => `• ${p.name}`).join('\n') 
                : 'لا يوجد مشاركين حتى الآن.';

            const updatedEmbed = EmbedBuilder.from(embed).setFields({ name: `👥 المشاركون (${playersMap.size}/${MAX_PLAYERS}):`, value: playersList });
            await gameMessage.edit({ embeds: [updatedEmbed] });
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time' || reason === 'start') {
                let activePlayers = Array.from(playersMap.values());

                if (activePlayers.length < 3) {
                    return gameMessage.edit({ content: '❌ تم إلغاء اللعبة لعدم وجود لاعبين كفاية (الحد الأدنى 3).', embeds: [], components: [] });
                }

                try {
                    await gameMessage.edit({ content: '🎡 **بدأت المعركة! جاري تدوير عجلة الإقصاء...** ⏳', embeds: [], components: [] });
                    await new Promise(res => setTimeout(res, 2000));

                    // حلقة الإقصاء التدرجي حتى يبقى لاعب واحد
                    while (activePlayers.length > 1) {
                        // اختيار شخص عشوائي ليتم طرده في هذه الجولة
                        const eliminatedIndex = Math.floor(Math.random() * activePlayers.length);
                        const eliminatedPlayer = activePlayers[eliminatedIndex];

                        // صورة متحركة تعبيرية للإقصاء (GIF جاهز من Tenor/Giphy)
                        const eliminationGifs = [
                            'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif',
                            'https://media.giphy.com/media/12XMGIW6H2uEzm/giphy.gif',
                            'https://media.giphy.com/media/8L0Pky6C83SzkzU55a/giphy.gif'
                        ];
                        const randomGif = eliminationGifs[Math.floor(Math.random() * eliminationGifs.length)];

                        const roundEmbed = new EmbedBuilder()
                            .setTitle('🎯 جولة إقصاء جديدة')
                            .setDescription(`⚠️ دارت العجلة وتم اختيار الطرد لـ:\n\n💥 **${eliminatedPlayer.name}** تم إقصاؤه من المعركة! ❌`)
                            .setImage(randomGif)
                            .setColor('#e74c3c')
                            .addFields({ name: `👥 الباقون في الساحة (${activePlayers.length - 1}):`, value: activePlayers.filter(p => p.id !== eliminatedPlayer.id).map(p => `• ${p.name}`).join('\n') });

                        await gameMessage.edit({ content: '⚡ **جاري فرز المطرودين...**', embeds: [roundEmbed] });
                        
                        // إزالة المطرود من القائمة
                        activePlayers.splice(eliminatedIndex, 1);

                        // انتظار 4 ثوانٍ بين كل جولة إقصاء لتشويق اللاعبين
                        await new Promise(res => setTimeout(res, 4000));
                    }

                    // اللاعب الأخير الباقي هو الفائز
                    const winner = activePlayers[0];
                    const winnerGif = 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif';

                    const finalEmbed = new EmbedBuilder()
                        .setTitle('🏆 انتهت المعركة وفاز البطل!')
                        .setDescription(`👑 الفائز الأخير الذي صمد حتى النهاية هو:\n\n🎉 **${winner.name}** 🎉\n\nمبروك عليك الفوز بالمركز الأول! 🥇`)
                        .setImage(winnerGif)
                        .setColor('#ffd700');

                    await gameMessage.edit({ 
                        content: `🎉 **انتهت اللعبة بنجاح!**`, 
                        embeds: [finalEmbed],
                        components: []
                    });

                } catch (error) {
                    console.error(error);
                    await gameMessage.edit({ content: "❌ حدث خطأ أثناء تنفيذ جولات الإقصاء." });
                }

            } else if (reason === 'cancel') {
                await gameMessage.edit({ content: '❌ تم إلغاء اللعبة بواسطة المنظم.', embeds: [], components: [] });
            }
        });
    }
});

client.login(process.env.TOKEN);
