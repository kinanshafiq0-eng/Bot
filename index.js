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
    console.log(`✅ ProBot Games Bot Logged in as ${client.user.tag}!`);
    client.user.setActivity('!games للمساعدة', { type: 3 });
});

// قائمة ألعاب فكك
const fakkWords = [
    { word: 'مستشفى', scrambled: 'ف ش ت م س ي' },
    { word: 'برمجة', scrambled: 'ج م ر ب ض ة' },
    { word: 'تكنولوجيا', scrambled: 'ا ت ك و ن و ل ج ي ا' },
    { word: 'ديسكورد', scrambled: 'د ي س ك و ر د' },
    { word: 'استضافة', scrambled: 'ف ه ا ض ت ص ة' }
];

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    const prefix = '!';

    // 1. قائمة الألعاب (Help)
    if (message.content === prefix + 'games' || message.content === prefix + 'ألعاب') {
        const embed = new EmbedBuilder()
            .setTitle('🎮 نظام ألعاب برو بوت (ProBot Games)')
            .setDescription('أهلاً بك! إليك قائمة الألعاب المتاحة حالياً:')
            .setColor('#5865F2')
            .addFields(
                { name: '🔤 `!فكك`', value: 'لعبة تفكيك الكلمات وإعادة تركيبها.', inline: true },
                { name: '⚡ `!اسرع`', value: 'تحدي أسرع شخص يكتب الكلمة.', inline: true },
                { name: '🎯 `!روليت`', value: 'عجلة الحظ التفاعلية بأرقام واضحة.', inline: true }
            )
            .setFooter({ text: 'استمتع باللعب في السيرفر!' });

        return message.reply({ embeds: [embed] });
    }

    // 2. لعبة فكك
    if (message.content === prefix + 'فكك') {
        const randomItem = fakkWords[Math.floor(Math.random() * fakkWords.length)];
        
        const embed = new EmbedBuilder()
            .setTitle('🔤 لعبة فكك الكلمة')
            .setDescription(`فكك الكلمة التالية وأرسل الإجابة في الشات:\n\n**[ ${randomItem.scrambled} ]**\n\n⏳ لديك **20 ثانية** فقط!`)
            .setColor('#f1c40f');

        await message.reply({ embeds: [embed] });

        const filter = m => m.content.trim() === randomItem.word && !m.author.bot;
        const collector = message.channel.createMessageCollector({ filter, time: 20000, max: 1 });

        collector.on('collect', m => {
            m.reply(`🎉 كفو يا **${m.author.displayName}**! فككت الكلمة الصحيحة (**${randomItem.word}**) وأخذت النقطة! 🏆`);
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time' && collected.size === 0) {
                message.channel.send(`⏰ انتهى الوقت! الإجابة الصحيحة كانت: **${randomItem.word}**`);
            }
        });
    }

    // 3. لعبة أسرع كاتب
    if (message.content === prefix + 'اسرع' || message.content === prefix + 'سرعة') {
        const wordsList = ['برمجة', 'ديسكورد', 'استضافة', 'سيرفر', 'تطوير', 'تحدي'];
        const targetWord = wordsList[Math.floor(Math.random() * wordsList.length)];

        const embed = new EmbedBuilder()
            .setTitle('⚡ تحدي السرعة')
            .setDescription(`أسرع شخص يكتب هذه الكلمة في الشات:\n\n**` + targetWord + `**\n\n⏳ أسرع واحد يفوز!`)
            .setColor('#e74c3c');

        await message.reply({ embeds: [embed] });

        const filter = m => m.content.trim() === targetWord && !m.author.bot;
        const collector = message.channel.createMessageCollector({ filter, time: 15000, max: 1 });

        collector.on('collect', m => {
            m.reply(`🚀 مبروك يا **${m.author.displayName}**! كنت الأسرع وكتبت الكلمة أولاً! 🏆`);
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time' && collected.size === 0) {
                message.channel.send(`⏰ انتهى الوقت ولم يكتب أحد الكلمة! (${targetWord})`);
            }
        });
    }

    // 4. لعبة الروليت التفاعلية (بدون مشاكل رسومات)
    if (message.content === prefix + 'روليت' || message.content === prefix + 'roulette') {
        const playersMap = new Map();
        const MAX_PLAYERS = 15;
        const endTime = Math.floor(Date.now() / 1000) + 30;

        const embed = new EmbedBuilder()
            .setTitle('🎰 عجلة الحظ (Roulette)')
            .setDescription(`اضغط على زر **انضمام** للمشاركة في السحب وإعطائك رقماً!\n⏳ **تبدأ اللعبة تلقائياً:** <t:${endTime}:R>`)
            .setColor('#e53935')
            .addFields({ name: `👥 المشاركون (0/${MAX_PLAYERS}):`, value: 'لا يوجد مشاركين حتى الآن.' });

        const joinBtn = new ButtonBuilder().setCustomId('join').setLabel('انضمام 🟢').setStyle(ButtonStyle.Success);
        const leaveBtn = new ButtonBuilder().setCustomId('leave').setLabel('انسحاب 🔴').setStyle(ButtonStyle.Danger);
        const startBtn = new ButtonBuilder().setCustomId('start').setLabel('بدء الآن 🚀').setStyle(ButtonStyle.Primary);
        const cancelBtn = new ButtonBuilder().setCustomId('cancel').setLabel('إلغاء ❌').setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(joinBtn, leaveBtn, startBtn, cancelBtn);
        const gameMessage = await message.reply({ embeds: [embed], components: [row] });

        const collector = gameMessage.createMessageComponentCollector({ time: 30000 });

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
                await interaction.reply({ content: `✅ تم انضمامك بنجاح! رقمك: **#${playerObj.number}**`, ephemeral: true });

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
                
                try {
                    await gameMessage.edit({ content: '🎡 **جارِ تدوير العجلة واختيار الرقم الفائز...** ⏳', embeds: [], components: [] });
                    
                    for (let i = 0; i < 3; i++) {
                        const randomPreview = playersArray[Math.floor(Math.random() * playersArray.length)];
                        await gameMessage.edit({ content: `🎰 **العجلة تفحص الرقم: [ 🎲 #${randomPreview.number} ] ...**` });
                        await new Promise(res => setTimeout(res, 700));
                    }

                    const winnerIndex = Math.floor(Math.random() * playersArray.length);
                    const winnerObj = playersArray[winnerIndex];

                    const finalPlayersList = playersArray.map(p => p.number === winnerObj.number ? `🏆 **#${p.number} - ${p.name} (الفائز!)**` : `**#${p.number}** - ${p.name}`).join('\n');
                    
                    const finalEmbed = new EmbedBuilder()
                        .setTitle('🎰 نتائج السحب النهائي')
                        .setDescription(`🎉 الفائز هو صاحب الرقم **#${winnerObj.number}**\n👤 الاسم: **${winnerObj.name}** 🎯`)
                        .setColor('#ffd700')
                        .addFields({ name: `👥 قائمة المشاركين النهائية:`, value: finalPlayersList });

                    await gameMessage.edit({ 
                        content: `🎉 **انتهت الروليت بنجاح!**`, 
                        embeds: [finalEmbed],
                        components: []
                    });

                } catch (error) {
                    console.error(error);
                    await gameMessage.edit({ content: "❌ حدث خطأ أثناء السحب." });
                }

            } else if (reason === 'cancel') {
                await gameMessage.edit({ content: '❌ تم إلغاء اللعبة.', embeds: [], components: [] });
            }
        });
    }
});

client.login(process.env.TOKEN);
