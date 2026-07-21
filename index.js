require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ComponentType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

client.on('ready', () => {
    console.log(`✅ Multi-Games Tournament Bot Logged in as ${client.user.tag}!`);
    client.user.setActivity('!ألعاب', { type: 3 });
});

// دوال مساعدة عامة
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function checkWinner(board) {
    const winConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    for (let condition of winConditions) {
        const [a, b, c] = condition;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    if (board.every(cell => cell !== null)) return 'tie';
    return null;
}

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    const prefix = '!';

    // 1. قائمة الألعاب
    if (message.content === prefix + 'ألعاب' || message.content === prefix + 'games') {
        const embed = new EmbedBuilder()
            .setTitle('🎮 قائمة ألعاب البطولات والإقصاء الشاملة')
            .setDescription('أهلاً بك! إليك الألعاب المتاحة حالياً:')
            .setColor('#5865F2')
            .addFields(
                { name: '🎯 `!روليت`', value: 'لعبة الإقصاء التدريجي بصور متحركة حتى يبقى فائز واحد.', inline: true },
                { name: '❌⭕ `!بطولة_اكس_او`', value: 'بطولة تكس أو بنظام خروج المغلوب حتى تتويج البطل.', inline: true },
                { name: '🕵️‍♂️ `!مافيا`', value: 'لعبة المافيا والقرية الممتعة (تحتاج 4 لاعبين).', inline: true },
                { name: '🪑 `!كراسي`', value: 'لعبة الكراسي الموسيقية الحماسية وسرعة رد الفعل.', inline: true },
                { name: '✊ `!حجرة`', value: 'لعبة حجرة ورقة مقص التفاعلية السريعة ضد البوت.', inline: true },
                { name: '🫣 `!اختباء`', value: 'لعبة الاختباء وتفجير الصناديق الـ 25.', inline: true },
                { name: '📝 `!ريبيكا`', value: 'لعبة (حرف، حيوان، نبات، جماد، بلاد) الكلاسيكية الشهيرة!', inline: true }
            );
        return message.reply({ embeds: [embed] });
    }

    // 2. لعبة الروليت / الإقصاء التدريجي
    if (message.content === prefix + 'روليت' || message.content === prefix + 'roulette') {
        const playersMap = new Map();
        const MAX_PLAYERS = 20;
        const durationSeconds = 30;
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

                    while (activePlayers.length > 1) {
                        const eliminatedIndex = Math.floor(Math.random() * activePlayers.length);
                        const eliminatedPlayer = activePlayers[eliminatedIndex];

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
                        activePlayers.splice(eliminatedIndex, 1);
                        await new Promise(res => setTimeout(res, 4000));
                    }

                    const winner = activePlayers[0];
                    const winnerGif = 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif';

                    const finalEmbed = new EmbedBuilder()
                        .setTitle('🏆 انتهت المعركة وفاز البطل!')
                        .setDescription(`👑 الفائز الأخير الذي صمد حتى النهاية هو:\n\n🎉 **${winner.name}** 🎉\n\nمبروك عليك الفوز بالمركز الأول! 🥇`)
                        .setImage(winnerGif)
                        .setColor('#ffd700');

                    await gameMessage.edit({ content: `🎉 **انتهت اللعبة بنجاح!**`, embeds: [finalEmbed], components: [] });

                } catch (error) {
                    console.error(error);
                    await gameMessage.edit({ content: "❌ حدث خطأ أثناء تنفيذ جولات الإقصاء." });
                }

            } else if (reason === 'cancel') {
                await gameMessage.edit({ content: '❌ تم إلغاء اللعبة بواسطة المنظم.', embeds: [], components: [] });
            }
        });
    }

    // 3. بطولة تكس أو (Tic-Tac-Toe Tournament)
    if (message.content === prefix + 'بطولة_اكس_او' || message.content === prefix + 'ttt') {
        const playersMap = new Map();
        const MAX_PLAYERS = 8;
        const durationSeconds = 30;
        const endTime = Math.floor(Date.now() / 1000) + durationSeconds;

        const embed = new EmbedBuilder()
            .setTitle('❌⭕ بطولة تكس أو (Tic-Tac-Toe Tournament)')
            .setDescription(`اضغط على زر **انضمام** للمشاركة في البطولة!\nالفائزون يواجهون بعضهم حتى يبقى بطل واحد.\n\n⏳ **تبدأ البطولة تلقائياً بعد:** <t:${endTime}:R>`)
            .setColor('#3498db')
            .addFields({ name: `👥 المشاركون (0/${MAX_PLAYERS}):`, value: 'لا يوجد مشاركين حتى الآن.' });

        const joinBtn = new ButtonBuilder().setCustomId('join').setLabel('انضمام 🟢').setStyle(ButtonStyle.Success);
        const leaveBtn = new ButtonBuilder().setCustomId('leave').setLabel('انسحاب 🔴').setStyle(ButtonStyle.Danger);
        const startBtn = new ButtonBuilder().setCustomId('start').setLabel('بدء الآن 🚀').setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(joinBtn, leaveBtn, startBtn);
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
                await interaction.reply({ content: `✅ تم انضمامك للبطولة بنجاح!`, ephemeral: true });
            } else if (interaction.customId === 'leave') {
                if (playersMap.has(userId)) {
                    playersMap.delete(userId);
                    await interaction.reply({ content: '❌ لقد انسحبت من البطولة.', ephemeral: true });
                } else {
                    return interaction.reply({ content: '⚠️ أنت لست منضم أصلاً!', ephemeral: true });
                }
            } else if (interaction.customId === 'start') {
                if (userId !== message.author.id) {
                    return interaction.reply({ content: '⚠️ صاحب الأمر فقط يمكنه بدء البطولة!', ephemeral: true });
                }
                if (playersMap.size < 2) {
                    return interaction.reply({ content: '⚠️ نحتاج إلى لاعبين (2) على الأقل لبدء البطولة!', ephemeral: true });
                }
                collector.stop('start');
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
                let currentRoundPlayers = Array.from(playersMap.values());

                if (currentRoundPlayers.length < 2) {
                    return gameMessage.edit({ content: '❌ تم إلغاء البطولة لعدم وجود لاعبين كفاية.', embeds: [], components: [] });
                }

                let roundNum = 1;

                try {
                    while (currentRoundPlayers.length > 1) {
                        shuffle(currentRoundPlayers);
                        let nextRoundWinners = [];

                        const roundEmbed = new EmbedBuilder()
                            .setTitle(`🏆 الجولة رقم ${roundNum} من البطولة`)
                            .setDescription(`جاري خوض المباريات بين اللاعبين... ⏳`)
                            .setColor('#e67e22');

                        await gameMessage.edit({ embeds: [roundEmbed], components: [] });
                        await new Promise(res => setTimeout(res, 2000));

                        for (let i = 0; i < currentRoundPlayers.length; i += 2) {
                            if (i + 1 >= currentRoundPlayers.length) {
                                nextRoundWinners.push(currentRoundPlayers[i]);
                                await message.channel.send(`✨ اللاعب **${currentRoundPlayers[i].name}** صعد تلقائياً لعدم وجود خصم له في هذه الجولة!`);
                                continue;
                            }

                            const p1 = currentRoundPlayers[i];
                            const p2 = currentRoundPlayers[i + 1];

                            let board = Array(9).fill(null);
                            let turn = p1.id;

                            const renderRows = () => {
                                let rows = [];
                                for (let r = 0; r < 3; r++) {
                                    let rowComponents = [];
                                    for (let c = 0; c < 3; c++) {
                                        let index = r * 3 + c;
                                        let label = '➖';
                                        let style = ButtonStyle.Secondary;
                                        if (board[index] === 'X') { label = '❌'; style = ButtonStyle.Danger; }
                                        else if (board[index] === 'O') { label = '⭕'; style = ButtonStyle.Primary; }

                                        rowComponents.push(
                                            new ButtonBuilder()
                                                .setCustomId(`cell_${index}`)
                                                .setLabel(label)
                                                .setStyle(style)
                                                .setDisabled(board[index] !== null)
                                        );
                                    }
                                    rows.push(new ActionRowBuilder().addComponents(rowComponents));
                                }
                                return rows;
                            };

                            const matchEmbed = new EmbedBuilder()
                                .setTitle(`⚔️ مواجهة مباشرة: ${p1.name} (❌) ضد ${p2.name} (⭕)`)
                                .setDescription(`الدور الآن للاعب: <@${turn}>`)
                                .setColor('#9b59b6');

                            const matchMsg = await message.channel.send({ embeds: [matchEmbed], components: renderRows() });
                            const matchFilter = iAction => [p1.id, p2.id].includes(iAction.user.id);
                            const matchCollector = matchMsg.createMessageComponentCollector({ filter: matchFilter, time: 60000 });

                            let winner = null;

                            await new Promise(resolve => {
                                matchCollector.on('collect', async iAction => {
                                    if (iAction.user.id !== turn) {
                                        return iAction.reply({ content: '⚠️ ليس دورك الآن!', ephemeral: true });
                                    }

                                    const cellIndex = parseInt(iAction.customId.split('_')[1]);
                                    board[cellIndex] = turn === p1.id ? 'X' : 'O';

                                    let resCheck = checkWinner(board);
                                    if (resCheck) {
                                        if (resCheck === 'X') winner = p1;
                                        else if (resCheck === 'O') winner = p2;
                                        else winner = 'tie';

                                        matchCollector.stop('finished');
                                    } else {
                                        turn = turn === p1.id ? p2.id : p1.id;
                                        await iAction.update({
                                            embeds: [new EmbedBuilder().setTitle(`⚔️ مواجهة: ${p1.name} (❌) ضد ${p2.name} (⭕)`).setDescription(`الدور الآن للاعب: <@${turn}>`).setColor('#9b59b6')],
                                            components: renderRows()
                                        });
                                    }
                                });

                                matchCollector.on('end', async (_, reason) => {
                                    if (reason === 'time' && !winner) {
                                        winner = Math.random() < 0.5 ? p1 : p2;
                                    }
                                    if (winner === 'tie') {
                                        winner = Math.random() < 0.5 ? p1 : p2;
                                    }

                                    await matchMsg.edit({
                                        content: `🎉 **انتهت المباراة بفوز اللاعب: ${winner.name}** 🏆`,
                                        components: []
                                    }).catch(() => {});

                                    nextRoundWinners.push(winner);
                                    resolve();
                                });
                            });
                        }

                        currentRoundPlayers = nextRoundWinners;
                        roundNum++;
                        await new Promise(res => setTimeout(res, 3000));
                    }

                    const champion = currentRoundPlayers[0];
                    const finalEmbed = new EmbedBuilder()
                        .setTitle('👑 بطل البطولة الأوحد!')
                        .setDescription(`🎉 مبروك بطل البطولة:\n\n✨ **${champion.name}** ✨\n\nصمد حتى النهاية وفاز بكل المواجهات! 🏆🥇`)
                        .setColor('#ffd700');

                    await gameMessage.edit({ content: `🏆 **انتهت البطولة وتتويج البطل!**`, embeds: [finalEmbed], components: [] });

                } catch (error) {
                    console.error(error);
                    await gameMessage.edit({ content: "❌ حدث خطأ أثناء تشغيل جولات البطولة." });
                }

            } else {
                await gameMessage.edit({ content: '❌ تم إلغاء البطولة.', embeds: [], components: [] });
            }
        });
    }

    // 4. لعبة المافيا (Mafia Game)
    if (message.content === prefix + 'مافيا' || message.content === prefix + 'mafia') {
        const playersMap = new Map();
        const MAX_PLAYERS = 10;
        const durationSeconds = 30;
        const endTime = Math.floor(Date.now() / 1000) + durationSeconds;

        const embed = new EmbedBuilder()
            .setTitle('🕵️‍♂️ لعبة المافيا (Mafia Game)')
            .setDescription(`اضغط على زر **انضمام** للمشاركة في اللعبة!\n(تحتاج إلى 4 لاعبين على الأقل للبدء).\n\n⏳ **تبدأ اللعبة تلقائياً بعد:** <t:${endTime}:R>`)
            .setColor('#2c3e50')
            .addFields({ name: `👥 المشاركون (0/${MAX_PLAYERS}):`, value: 'لا يوجد مشاركين حتى الآن.' });

        const joinBtn = new ButtonBuilder().setCustomId('join').setLabel('انضمام 🟢').setStyle(ButtonStyle.Success);
        const leaveBtn = new ButtonBuilder().setCustomId('leave').setLabel('انسحاب 🔴').setStyle(ButtonStyle.Danger);
        const startBtn = new ButtonBuilder().setCustomId('start').setLabel('بدء الآن 🚀').setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(joinBtn, leaveBtn, startBtn);
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
                    playersMap.set(userId, { id: userId, name: playerName, alive: true, role: 'قروي' });
                }
                await interaction.reply({ content: `✅ تم انضمامك للعبة المافيا بنجاح!`, ephemeral: true });
            } else if (interaction.customId === 'leave') {
                if (playersMap.has(userId)) {
                    playersMap.delete(userId);
                    await interaction.reply({ content: '❌ لقد انسحبت من اللعبة.', ephemeral: true });
                } else {
                    return interaction.reply({ content: '⚠️ أنت لست منضم أصلاً!', ephemeral: true });
                }
            } else if (interaction.customId === 'start') {
                if (userId !== message.author.id) {
                    return interaction.reply({ content: '⚠️ صاحب الأمر فقط يمكنه بدء اللعبة!', ephemeral: true });
                }
                if (playersMap.size < 4) {
                    return interaction.reply({ content: '⚠️ نحتاج إلى 4 لاعبين على الأقل لبدء لعبة المافيا!', ephemeral: true });
                }
                collector.stop('start');
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
                let playersArr = Array.from(playersMap.values());

                if (playersArr.length < 4) {
                    return gameMessage.edit({ content: '❌ تم إلغاء لعبة المافيا لعدم وجود لاعبين كفاية (الحد الأدنى 4).', embeds: [], components: [] });
                }

                shuffle(playersArr);
                playersArr[0].role = 'مافيا';
                if (playersArr.length >= 6) playersArr[1].role = 'مافيا';
                
                let copAssigned = false;
                let doctorAssigned = false;

                playersArr.forEach(p => {
                    if (p.role !== 'مافيا') {
                        if (!copAssigned) { p.role = 'شرطي'; copAssigned = true; }
                        else if (!doctorAssigned) { p.role = 'طبيب'; doctorAssigned = true; }
                        else { p.role = 'قروي'; }
                    }
                });

                for (let p of playersArr) {
                    try {
                        let userObj = await client.users.fetch(p.id);
                        await userObj.send(`🕵️‍♂️ **دورك في لعبة المافيا هو:** \` ${p.role.toUpperCase()} \`\nاحرص على ألا تخبر أحداً!`);
                    } catch (e) {
                        console.log(`Could not DM user ${p.name}`);
                    }
                }

                await gameMessage.edit({ 
                    content: `🕵️‍♂️ **تم توزيع الأدوار في الخاص! بدأت لعبة المافيا...** 🌙`, 
                    embeds: [new EmbedBuilder().setTitle('🌙 حل الظلام على القرية').setDescription('المافيا يستعدون للتحرك...').setColor('#111111')], 
                    components: [] 
                });

                let gameRunning = true;
                let roundCount = 1;

                while (gameRunning) {
                    let aliveMafia = playersArr.filter(p => p.alive && p.role === 'مافيا');
                    let aliveVillagers = playersArr.filter(p => p.alive && p.role !== 'مافيا');

                    if (aliveMafia.length === 0) {
                        await message.channel.send(`🎉 **فاز القرويون والأبرياء!** تم القضاء على جميع أفراد المافيا بنجاح! 🏆`);
                        break;
                    }
                    if (aliveMafia.length >= aliveVillagers.length) {
                        await message.channel.send(`🦹‍♂️ **فازت المافيا!** لقد سيطروا على القرية بالكامل! 💀`);
                        break;
                    }

                    const nightEmbed = new EmbedBuilder()
                        .setTitle(`🌙 الليلة رقم ${roundCount}`)
                        .setDescription('القرية نائمة الآن... المافيا والطبيب يقومون بمهامهم.')
                        .setColor('#000000');
                    await message.channel.send({ embeds: [nightEmbed] });

                    let mafiaTarget = null;
                    let doctorSave = null;

                    for (let mPlayer of aliveMafia) {
                        try {
                            let mUser = await client.users.fetch(mPlayer.id);
                            let aliveTargets = playersArr.filter(p => p.alive && p.role !== 'مافيا');
                            if (aliveTargets.length === 0) break;

                            let buttons = aliveTargets.map((t) => 
                                new ButtonBuilder().setCustomId(`kill_${t.id}`).setLabel(t.name).setStyle(ButtonStyle.Danger)
                            );
                            let row = new ActionRowBuilder().addComponents(buttons.slice(0, 5));

                            let msg = await mUser.send({ content: '🦹‍♂️ **اختر شخصاً لقتله هذه الليلة:**', components: [row] });
                            let collectedVote = await msg.awaitMessageComponent({ componentType: ComponentType.Button, time: 20000 }).catch(() => null);
                            
                            if (collectedVote) {
                                let targetId = collectedVote.customId.split('_')[1];
                                mafiaTarget = playersArr.find(p => p.id === targetId);
                                await collectedVote.update({ content: `✅ تم اختيار الهدف: **${mafiaTarget.name}**`, components: [] });
                            }
                        } catch (err) {
                            console.log('Mafia vote error');
                        }
                    }

                    let doctor = playersArr.find(p => p.alive && p.role === 'طبيب');
                    if (doctor) {
                        try {
                            let dUser = await client.users.fetch(doctor.id);
                            let aliveAll = playersArr.filter(p => p.alive);
                            let buttons = aliveAll.map((t) => 
                                new ButtonBuilder().setCustomId(`save_${t.id}`).setLabel(t.name).setStyle(ButtonStyle.Success)
                            );
                            let row = new ActionRowBuilder().addComponents(buttons.slice(0, 5));

                            let msg = await dUser.send({ content: '💉 **اختر شخصاً لحمايته هذه الليلة:**', components: [row] });
                            let collectedSave = await msg.awaitMessageComponent({ componentType: ComponentType.Button, time: 20000 }).catch(() => null);

                            if (collectedSave) {
                                let saveId = collectedSave.customId.split('_')[1];
                                doctorSave = playersArr.find(p => p.id === saveId);
                                await collectedSave.update({ content: `✅ تم حماية الشخص: **${doctorSave.name}**`, components: [] });
                            }
                        } catch (err) {
                            console.log('Doctor save error');
                        }
                    }

                    await new Promise(res => setTimeout(res, 3000));

                    let killedPlayer = null;
                    if (mafiaTarget) {
                        if (!doctorSave || doctorSave.id !== mafiaTarget.id) {
                            mafiaTarget.alive = false;
                            killedPlayer = mafiaTarget;
                        }
                    }

                    const dayEmbed = new EmbedBuilder()
                        .setTitle(`☀️ شروق الشمس - اليوم ${roundCount}`)
                        .setDescription(killedPlayer ? `💥 استيقظت القرية على خبر شؤم! لقد تم العثور على جثة **${killedPlayer.name}** قتيلاً الليلة الماضية!` : `✨ ليلة هادئة! لم يتم تسجيل أي جرائم قتل الليلة الماضية.`)
                        .setColor('#f1c40f')
                        .addFields({ name: '👥 الناجون في القرية:', value: playersArr.filter(p => p.alive).map(p => `• ${p.name}`).join('\n') });

                    await message.channel.send({ embeds: [dayEmbed] });

                    aliveMafia = playersArr.filter(p => p.alive && p.role === 'مافيا');
                    aliveVillagers = playersArr.filter(p => p.alive && p.role !== 'مافيا');

                    if (aliveMafia.length === 0) {
                        await message.channel.send(`🎉 **فاز القرويون والأبرياء!** تم القضاء على جميع أفراد المافيا بنجاح! 🏆`);
                        break;
                    }
                    if (aliveMafia.length >= aliveVillagers.length) {
                        await message.channel.send(`🦹‍♂️ **فازت المافيا!** لقد سيطروا على القرية بالكامل! 💀`);
                        break;
                    }

                    let aliveList = playersArr.filter(p => p.alive);
                    let voteButtons = aliveList.map(p => new ButtonBuilder().setCustomId(`vote_${p.id}`).setLabel(p.name).setStyle(ButtonStyle.Primary));
                    let voteRow = new ActionRowBuilder().addComponents(voteButtons.slice(0, 5));

                    let voteMsg = await message.channel.send({ 
                        content: `⚖️ **وقت المحاكمة والتصويت!** من تشتبه بأنه مافيا وتطردونه؟ (لديك 30 ثانية)`, 
                        components: [voteRow] 
                    });

                    let votesMap = new Map();
                    let voteCollector = voteMsg.createMessageComponentCollector({ time: 30000 });

                    voteCollector.on('collect', async i => {
                        if (!playersArr.some(p => p.id === i.user.id && p.alive)) {
                            return i.reply({ content: '⚠️ أنت ميت أو لست مشاركاً، لا يمكنك التصويت!', ephemeral: true });
                        }
                        let targetId = i.customId.split('_')[1];
                        votesMap.set(i.user.id, targetId);
                        await i.reply({ content: `✅ تم تسجيل صوتك بنجاح.`, ephemeral: true });
                    });

                    await new Promise(res => setTimeout(res, 30000));

                    let countVotes = {};
                    votesMap.forEach(targetId => {
                        countVotes[targetId] = (countVotes[targetId] || 0) + 1;
                    });

                    let mostVotedId = null;
                    let maxVotes = 0;
                    for (let id in countVotes) {
                        if (countVotes[id] > maxVotes) {
                            maxVotes = countVotes[id];
                            mostVotedId = id;
                        }
                    }

                    if (mostVotedId) {
                        let executedPlayer = playersArr.find(p => p.id === mostVotedId);
                        executedPlayer.alive = false;
                        await message.channel.send(`⚖️ **انتهت وقت التصويت!** قررت القرية إعدام **${executedPlayer.name}** بالشنق.\nوهو كان: \` ${executedPlayer.role.toUpperCase()} \``);
                    } else {
                        await message.channel.send(`⚖️ **انتهت وقت التصويت!** لم يتفق أحد على إعدام أي شخص اليوم.`);
                    }

                    roundCount++;
                    await new Promise(res => setTimeout(res, 4000));
                }

            } else {
                await gameMessage.edit({ content: '❌ تم إلغاء لعبة المافيا.', embeds: [], components: [] });
            }
        });
    }

    // 5. لعبة الكراسي الموسيقية (Musical Chairs Game)
    if (message.content === prefix + 'كراسي' || message.content === prefix + 'chairs') {
        const playersMap = new Map();
        const MAX_PLAYERS = 15;
        const durationSeconds = 30;
        const endTime = Math.floor(Date.now() / 1000) + durationSeconds;

        const embed = new EmbedBuilder()
            .setTitle('🪑 لعبة الكراسي الموسيقية الحماسية')
            .setDescription(`اضغط على زر **انضمام** للمشاركة!\nعند توقف الموسيقى، أسرع بالجلوس على الكرسي وإلا ستخسر.\n\n⏳ **تبدأ اللعبة تلقائياً بعد:** <t:${endTime}:R>`)
            .setColor('#e67e22')
            .addFields({ name: `👥 المشاركون (0/${MAX_PLAYERS}):`, value: 'لا يوجد مشاركين حتى الآن.' });

        const joinBtn = new ButtonBuilder().setCustomId('join').setLabel('انضمام 🟢').setStyle(ButtonStyle.Success);
        const leaveBtn = new ButtonBuilder().setCustomId('leave').setLabel('انسحاب 🔴').setStyle(ButtonStyle.Danger);
        const startBtn = new ButtonBuilder().setCustomId('start').setLabel('بدء الآن 🚀').setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(joinBtn, leaveBtn, startBtn);
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
                await interaction.reply({ content: `✅ تم انضمامك للعبة الكراسي بنجاح!`, ephemeral: true });
            } else if (interaction.customId === 'leave') {
                if (playersMap.has(userId)) {
                    playersMap.delete(userId);
                    await interaction.reply({ content: '❌ لقد انسحبت من اللعبة.', ephemeral: true });
                } else {
                    return interaction.reply({ content: '⚠️ أنت لست منضم أصلاً!', ephemeral: true });
                }
            } else if (interaction.customId === 'start') {
                if (userId !== message.author.id) {
                    return interaction.reply({ content: '⚠️ صاحب الأمر فقط يمكنه بدء اللعبة!', ephemeral: true });
                }
                if (playersMap.size < 3) {
                    return interaction.reply({ content: '⚠️ نحتاج إلى 3 لاعبين على الأقل لبدء لعبة الكراسي!', ephemeral: true });
                }
                collector.stop('start');
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
                    return gameMessage.edit({ content: '❌ تم إلغاء لعبة الكراسي لعدم وجود لاعبين كفاية (الحد الأدنى 3).', embeds: [], components: [] });
                }

                try {
                    await gameMessage.edit({ content: '🎶 **بدأت الموسيقى تعمل... الكل يرقص حول الكراسي!** 💃🕺', embeds: [], components: [] });
                    await new Promise(res => setTimeout(res, 3000));

                    while (activePlayers.length > 1) {
                        let chairsCount = activePlayers.length - 1;

                        const musicEmbed = new EmbedBuilder()
                            .setTitle('🎶 توقفت الموسيقى! اسرع واجلس!')
                            .setDescription(`🪑 الكراسي المتاحة في هذه الجولة: **${chairsCount}** فقط!\nاضغط على الزر أدناه بأسرع ما يمكن لتضمن مقعدك!`)
                            .setColor('#e67e22')
                            .addFields({ name: `👥 المتنافسون (${activePlayers.length}):`, value: activePlayers.map(p => `• ${p.name}`).join('\n') });

                        const sitBtn = new ButtonBuilder().setCustomId('sit').setLabel('اجلس بسرعة! 🪑').setStyle(ButtonStyle.Success);
                        const sitRow = new ActionRowBuilder().addComponents(sitBtn);

                        let roundMsg = await message.channel.send({ embeds: [musicEmbed], components: [sitRow] });

                        let seatedPlayers = new Set();
                        let sitCollector = roundMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 7000 });

                        sitCollector.on('collect', async i => {
                            if (!activePlayers.some(p => p.id === i.user.id)) {
                                return i.reply({ content: '⚠️ أنت لست مشاركاً في هذه الجولة!', ephemeral: true });
                            }
                            if (seatedPlayers.has(i.user.id)) {
                                return i.reply({ content: '⚠️ لقد جلست مسبقاً!', ephemeral: true });
                            }

                            if (seatedPlayers.size < chairsCount) {
                                seatedPlayers.add(i.user.id);
                                await i.reply({ content: '✅ ممتاز! لقد حصلت على كرسي وتأهلت للجولة القادمة.', ephemeral: true });
                            } else {
                                await i.reply({ content: '❌ للأسف! اكتمل عدد الكراسي ولم تجد مقعداً!', ephemeral: true });
                            }
                        });

                        await new Promise(res => setTimeout(res, 7000));

                        let eliminatedPlayer = null;
                        let nextActive = [];

                        for (let p of activePlayers) {
                            if (seatedPlayers.has(p.id) && nextActive.length < chairsCount) {
                                nextActive.push(p);
                            } else {
                                if (!eliminatedPlayer) {
                                    eliminatedPlayer = p;
                                } else {
                                    nextActive.push(p);
                                }
                            }
                        }

                        if (!eliminatedPlayer) {
                            eliminatedPlayer = activePlayers[activePlayers.length - 1];
                            nextActive = nextActive.slice(0, chairsCount);
                        }

                        activePlayers = nextActive;

                        await roundMsg.edit({
                            content: `💥 **انتهت الجولة!** لم يجد **${eliminatedPlayer.name}** كرسياً وتم إقصاؤه! ❌`,
                            components: []
                        }).catch(() => {});

                        await new Promise(res => setTimeout(res, 4000));
                    }

                    const winner = activePlayers[0];
                    const finalEmbed = new EmbedBuilder()
                        .setTitle('👑 بطل لعبة الكراسي الموسيقية!')
                        .setDescription(`🎉 الفائز الأخير الذي حصل على الكرسي الأخير هو:\n\n✨ **${winner.name}** ✨\n\nمبروك الفوز بالمركز الأول! 🥇🪑`)
                        .setColor('#ffd700');

                    await gameMessage.edit({ content: `🎉 **انتهت اللعبة بنجاح!**`, embeds: [finalEmbed], components: [] });

                } catch (error) {
                    console.error(error);
                    await gameMessage.edit({ content: "❌ حدث خطأ أثناء تشغيل لعبة الكراسي." });
                }

            } else if (reason === 'cancel') {
                await gameMessage.edit({ content: '❌ تم إلغاء لعبة الكراسي.', embeds: [], components: [] });
            }
        });
    }

    // 6. لعبة حجرة ورقة مقص (Rock Paper Scissors Game)
    if (message.content === prefix + 'حجرة' || message.content === prefix + 'rps') {
        const embed = new EmbedBuilder()
            .setTitle('✊ لعبة حجرة، ورقة، مقص (Rock Paper Scissors)')
            .setDescription('اختر إحدى الأدوات أدناه لمواجهة البوت مباشرة! (لديك 20 ثانية)')
            .setColor('#1abc9c');

        const rockBtn = new ButtonBuilder().setCustomId('rock').setLabel('حجرة 🪨').setStyle(ButtonStyle.Primary);
        const paperBtn = new ButtonBuilder().setCustomId('paper').setLabel('ورقة 📄').setStyle(ButtonStyle.Success);
        const scissorsBtn = new ButtonBuilder().setCustomId('scissors').setLabel('مقص ✂️').setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(rockBtn, paperBtn, scissorsBtn);
        const gameMessage = await message.reply({ embeds: [embed], components: [row] });

        const filter = i => i.user.id === message.author.id;
        const collector = gameMessage.createMessageComponentCollector({ filter, time: 20000, max: 1 });

        collector.on('collect', async interaction => {
            const userChoice = interaction.customId;
            const choices = ['rock', 'paper', 'scissors'];
            const botChoice = choices[Math.floor(Math.random() * choices.length)];

            const emojis = {
                rock: 'حجرة 🪨',
                paper: 'ورقة 📄',
                scissors: 'مقص ✂️'
            };

            let resultMsg = '';
            let color = '#3498db';

            if (userChoice === botChoice) {
                resultMsg = '🤝 **تعادل!** لقد اخترتم نفس الشيء.';
                color = '#f1c40f';
            } else if (
                (userChoice === 'rock' && botChoice === 'scissors') ||
                (userChoice === 'paper' && botChoice === 'rock') ||
                (userChoice === 'scissors' && botChoice === 'paper')
            ) {
                resultMsg = '🎉 **مبروك، لقد فزت على البوت!** 🏆';
                color = '#2ecc71';
            } else {
                resultMsg = '😢 **حظاً أوفر، لقد فاز البوت عليك!** 🤖';
                color = '#e74c3c';
            }

            const resultEmbed = new EmbedBuilder()
                .setTitle('✊ نتيجة لعبة حجرة، ورقة، مقص')
                .setDescription(resultMsg)
                .setColor(color)
                .addFields(
                    { name: '👤 اختيارك:', value: emojis[userChoice], inline: true },
                    { name: '🤖 اختيار البوت:', value: emojis[botChoice], inline: true }
                );

            await interaction.update({ embeds: [resultEmbed], components: [] });
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time' && collected.size === 0) {
                await gameMessage.edit({ content: '⏱️ انتهى الوقت ولم تقم بالخيار المطلوب!', embeds: [], components: [] }).catch(() => {});
            }
        });
    }

    // 7. لعبة الاختباء وتفجير الصناديق الـ 25 (Hide and Seek Game)
    if (message.content === prefix + 'اختباء' || message.content === prefix + 'hide') {
        const playersMap = new Map();
        const MAX_PLAYERS = 15;
        const durationSeconds = 30;
        const endTime = Math.floor(Date.now() / 1000) + durationSeconds;

        const embed = new EmbedBuilder()
            .setTitle('🫣 لعبة الاختباء وتفجير الصناديق (25 صندوقاً)')
            .setDescription(`اضغط على زر **انضمام** للمشاركة!\nكل لاعب سيختار صندوقاً سرياً من بين 25 صندوقاً للاختباء فيه.\nالبوت سيبدأ بتفجير الصناديق عشوائياً، ومن يختبئ في صندوق يتم تفجيره سيخرج من اللعبة!\n\n⏳ **تبدأ اللعبة تلقائياً بعد:** <t:${endTime}:R>`)
            .setColor('#8e44ad')
            .addFields({ name: `👥 المشاركون (0/${MAX_PLAYERS}):`, value: 'لا يوجد مشاركين حتى الآن.' });

        const joinBtn = new ButtonBuilder().setCustomId('join').setLabel('انضمام 🟢').setStyle(ButtonStyle.Success);
        const leaveBtn = new ButtonBuilder().setCustomId('leave').setLabel('انسحاب 🔴').setStyle(ButtonStyle.Danger);
        const startBtn = new ButtonBuilder().setCustomId('start').setLabel('بدء الآن 🚀').setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(joinBtn, leaveBtn, startBtn);
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
                    playersMap.set(userId, { id: userId, name: playerName, alive: true, hidingSpot: null });
                }
                await interaction.reply({ content: `✅ تم انضمامك للعبة الاختباء بنجاح!`, ephemeral: true });
            } else if (interaction.customId === 'leave') {
                if (playersMap.has(userId)) {
                    playersMap.delete(userId);
                    await interaction.reply({ content: '❌ لقد انسحبت من اللعبة.', ephemeral: true });
                } else {
                    return interaction.reply({ content: '⚠️ أنت لست منضم أصلاً!', ephemeral: true });
                }
            } else if (interaction.customId === 'start') {
                if (userId !== message.author.id) {
                    return interaction.reply({ content: '⚠️ صاحب الأمر فقط يمكنه بدء اللعبة!', ephemeral: true });
                }
                if (playersMap.size < 2) {
                    return interaction.reply({ content: '⚠️ نحتاج إلى لاعبين (2) على الأقل لبدء اللعبة!', ephemeral: true });
                }
                collector.stop('start');
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
                let playersArr = Array.from(playersMap.values());

                if (playersArr.length < 2) {
                    return gameMessage.edit({ content: '❌ تم إلغاء اللعبة لعدم وجود لاعبين كفاية (الحد الأدنى 2).', embeds: [], components: [] });
                }

                try {
                    const startEmbed = new EmbedBuilder()
                        .setTitle('🫣 مرحلة الاختباء (25 صندوقاً)')
                        .setDescription(`📦 تم تجهيز 25 صندوقاً سرياً في الخريطة!\nتفقد رسائلك الخاصة (الـ DM) لاختيار رقم الصندوق الذي ستختبئ فيه (من 1 إلى 25).\n\n⏳ **لديك 25 ثانية للاختيار!**`)
                        .setColor('#9b59b6');

                    await gameMessage.edit({ content: `🎮 **انطلقت مرحلة الاختباء!**`, embeds: [startEmbed], components: [] });

                    const renderBoxesRows = (disabledBoxes = []) => {
                        let rows = [];
                        for (let r = 0; r < 5; r++) {
                            let rowComponents = [];
                            for (let c = 0; c < 5; c++) {
                                let boxNum = r * 5 + c + 1;
                                let isExploded = disabledBoxes.includes(boxNum);
                                rowComponents.push(
                                    new ButtonBuilder()
                                        .setCustomId(`box_${boxNum}`)
                                        .setLabel(isExploded ? '💥' : `${boxNum}`)
                                        .setStyle(isExploded ? ButtonStyle.Danger : ButtonStyle.Secondary)
                                        .setDisabled(isExploded)
                                );
                            }
                            rows.push(new ActionRowBuilder().addComponents(rowComponents));
                        }
                        return rows;
                    };

                    for (let player of playersArr) {
                        try {
                            let userObj = await client.users.fetch(player.id);
                            let boxMsg = await userObj.send({ 
                                content: '🫣 **اختر صندوقاً رقمياً من 1 إلى 25 لتختبئ فيه:**', 
                                components: renderBoxesRows() 
                            });

                            let choiceCollector = boxMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 25000 });
                            let chosen = false;

                            choiceCollector.on('collect', async i => {
                                let boxNum = parseInt(i.customId.split('_')[1]);
                                player.hidingSpot = boxNum;
                                chosen = true;
                                await i.update({ content: `✅ ممتاز! لقد اختبأت في الصندوق رقم **${boxNum}** 🤫`, components: [] });
                                choiceCollector.stop('chosen');
                            });

                            choiceCollector.on('end', async (_, res) => {
                                if (!chosen) {
                                    player.hidingSpot = Math.floor(Math.random() * 25) + 1;
                                    await userObj.send({ content: `⚠️ انتهى الوقت! تم اختيار صندوق عشوائي لك: **${player.hidingSpot}**` }).catch(() => {});
                                }
                            });
                        } catch (err) {
                            player.hidingSpot = Math.floor(Math.random() * 25) + 1;
                        }
                    }

                    await new Promise(res => setTimeout(res, 27000));

                    await message.channel.send(`💣 **انتهت مرحلة الاختباء!** أغلق الجميع أبواب صناديقهم.. ويبدأ البوت الآن بتفجير الصناديق عشوائياً! 🧨`);
                    await new Promise(res => setTimeout(res, 3000));

                    let explodedBoxes = [];
                    let activeGameMsg = await message.channel.send({ 
                        embeds: [new EmbedBuilder().setTitle('🧨 خريطة الصناديق الحالية (25 صندوقاً)').setDescription('جاري تفجير الصناديق تباعاً...').setColor('#e74c3c')],
                        components: renderBoxesRows(explodedBoxes) 
                    });

                    let gameActive = true;
                    let roundNum = 1;

                    while (gameActive) {
                        let alivePlayers = playersArr.filter(p => p.alive);
                        if (alivePlayers.length <= 1) break;

                        let availableBoxes = [];
                        for (let i = 1; i <= 25; i++) {
                            if (!explodedBoxes.includes(i)) availableBoxes.push(i);
                        }

                        if (availableBoxes.length === 0) break;

                        let targetBox = availableBoxes[Math.floor(Math.random() * availableBoxes.length)];
                        explodedBoxes.push(targetBox);

                        await activeGameMsg.edit({
                            embeds: [new EmbedBuilder().setTitle(`🧨 الجولة ${roundNum}: تفجير صندوق جديد!`).setDescription(`💥 البوت يختار عشوائياً لتفجير الصندوق رقم: **${targetBox}**!`).setColor('#e74c3c')],
                            components: renderBoxesRows(explodedBoxes)
                        }).catch(() => {});

                        await new Promise(res => setTimeout(res, 3000));

                        let caughtPlayers = playersArr.filter(p => p.alive && p.hidingSpot === targetBox);
                        if (caughtPlayers.length > 0) {
                            for (let cp of caughtPlayers) {
                                cp.alive = false;
                                await message.channel.send(`💥 **بووووم!** تم تفجير الصندوق رقم **${targetBox}** وكان مختبئاً بداخله اللاعب **${cp.name}**! لقد خرج من اللعبة ❌`);
                            }
                        } else {
                            await message.channel.send(`💨 تم تفجير الصندوق رقم **${targetBox}**.. ولكنه كان فارغاً! صمد اللاعبون الآخرون.`);
                        }

                        let remainingAlive = playersArr.filter(p => p.alive);
                        if (remainingAlive.length <= 1) {
                            gameActive = false;
                            break;
                        }

                        roundNum++;
                        await new Promise(res => setTimeout(res, 3000));
                    }

                    let survivingPlayers = playersArr.filter(p => p.alive);
                    const finalEmbed = new EmbedBuilder();

                    if (survivingPlayers.length === 1) {
                        finalEmbed.setTitle('🏆 بطل لعبة الاختباء والصناديق!')
                        .setDescription(`👑 الناجي الوحيد الذي صمد حتى النهاية ولم يتم تفجير صندوقه هو:\n\n✨ **${survivingPlayers[0].name}** ✨\n\nمبروك الفوز بالمركز الأول! 🥇🎉`)
                        .setColor('#ffd700');
                    } else if (survivingPlayers.length > 1) {
                        finalEmbed.setTitle('🤝 انتهاء اللعبة بتعادل الناجين!')
                        .setDescription(`✨ الصامدون الأخيرون الذين نجوا من التفجيرات:\n\n` + survivingPlayers.map(p => `👑 **${p.name}** (صندوق رقم: ${p.hidingSpot})`).join('\n') + `\n\nمبارك لكم الفوز! 🏆`)
                        .setColor('#f1c40f');
                    } else {
                        finalEmbed.setTitle('💀 خسارة جماعية!')
                        .setDescription(`💥 تم تفجير صناديق الجميع وخسر كل اللاعبين في هذه الجولة!`)
                        .setColor('#e74c3c');
                    }

                    await message.channel.send({ embeds: [finalEmbed] });

                } catch (error) {
                    console.error(error);
                    await message.channel.send("❌ حدث خطأ أثناء تشغيل لعبة الاختباء.").catch(() => {});
                }
            }
        });
    }

    // 8. لعبة ريبيكا (حرف، حيوان، نبات، جماد، بلاد) - Rebecca Game
    if (message.content === prefix + 'ريبيكا' || message.content === prefix + 'rebecca') {
        const playersMap = new Map();
        const MAX_PLAYERS = 15;
        const durationSeconds = 30;
        const endTime = Math.floor(Date.now() / 1000) + durationSeconds;

        const embed = new EmbedBuilder()
            .setTitle('📝 لعبة ريبيكا (حرف، حيوان، نبات، جماد، بلاد)')
            .setDescription(`اضغط على زر **انضمام** للمشاركة!\nسيتم اختيار حرف عشوائي للجميع، وكل لاعب يرسل إجاباته (حيوان، نبات، جماد، بلاد) تبدأ بهذا الحرف.\n\n⏳ **تبدأ اللعبة تلقائياً بعد:** <t:${endTime}:R>`)
            .setColor('#16a085')
            .addFields({ name: `👥 المشاركون (0/${MAX_PLAYERS}):`, value: 'لا يوجد مشاركين حتى الآن.' });

        const joinBtn = new ButtonBuilder().setCustomId('join').setLabel('انضمام 🟢').setStyle(ButtonStyle.Success);
        const leaveBtn = new ButtonBuilder().setCustomId('leave').setLabel('انسحاب 🔴').setStyle(ButtonStyle.Danger);
        const startBtn = new ButtonBuilder().setCustomId('start').setLabel('بدء الآن 🚀').setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(joinBtn, leaveBtn, startBtn);
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
                    playersMap.set(userId, { id: userId, name: playerName, answers: null });
                }
                await interaction.reply({ content: `✅ تم انضمامك للعبة ريبيكا بنجاح!`, ephemeral: true });
            } else if (interaction.customId === 'leave') {
                if (playersMap.has(userId)) {
                    playersMap.delete(userId);
                    await interaction.reply({ content: '❌ لقد انسحبت من اللعبة.', ephemeral: true });
                } else {
                    return interaction.reply({ content: '⚠️ أنت لست منضم أصلاً!', ephemeral: true });
                }
            } else if (interaction.customId === 'start') {
                if (userId !== message.author.id) {
                    return interaction.reply({ content: '⚠️ صاحب الأمر فقط يمكنه بدء اللعبة!', ephemeral: true });
                }
                if (playersMap.size < 1) {
                    return interaction.reply({ content: '⚠️ نحتاج إلى لاعب واحد على الأقل لبدء اللعبة!', ephemeral: true });
                }
                collector.stop('start');
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
                let playersArr = Array.from(playersMap.values());

                if (playersArr.length < 1) {
                    return gameMessage.edit({ content: '❌ تم إلغاء اللعبة لعدم وجود مشاركين.', embeds: [], components: [] });
                }

                try {
                    // اختيار حرف عشوائي باللغة العربية
                    const arabicLetters = ['أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'];
                    const chosenLetter = arabicLetters[Math.floor(Math.random() * arabicLetters.length)];

                    const roundStartEmbed = new EmbedBuilder()
                        .setTitle('📝 انطلقت لعبة ريبيكا!')
                        .setDescription(`الحرف المطلوب لهذه الجولة هو: ** \` ${chosenLetter} \` **\n\nاضغط على الزر أدناه لفتح نموذج الإجابة وكتابة (حيوان، نبات، جماد، بلاد).\n⏳ **لديك 45 ثانية للإجابة!**`)
                        .setColor('#1abc9c');

                    const answerBtn = new ButtonBuilder().setCustomId('open_modal').setLabel('اكتب إجاباتك ✍️').setStyle(ButtonStyle.Primary);
                    const answerRow = new ActionRowBuilder().addComponents(answerBtn);

                    await gameMessage.edit({ content: '🎮 **بدأت التحديات!**', embeds: [roundStartEmbed], components: [answerRow] });

                    const buttonCollector = gameMessage.createMessageComponentCollector({ componentType: ComponentType.Button, time: 45000 });

                    buttonCollector.on('collect', async i => {
                        if (!playersMap.has(i.user.id)) {
                            return i.reply({ content: '⚠️ أنت لست مشاركاً في هذه اللعبة!', ephemeral: true });
                        }

                        // إنشاء نافذة منبثقة (Modal) لإدخال الكلمات الأربعة
                        const modal = new ModalBuilder()
                            .setCustomId(`rebecca_modal_${i.user.id}`)
                            .setTitle(`إجابات لعبة ريبيكا (الحرف: ${chosenLetter})`);

                        const animalInput = new TextInputBuilder()
                            .setCustomId('animal')
                            .setLabel('حيوان يبدأ بالحرف:')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true);

                        const plantInput = new TextInputBuilder()
                            .setCustomId('plant')
                            .setLabel('نبات يبدأ بالحرف:')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true);

                        const objectInput = new TextInputBuilder()
                            .setCustomId('object')
                            .setLabel('جماد يبدأ بالحرف:')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true);

                        const countryInput = new TextInputBuilder()
                            .setCustomId('country')
                            .setLabel('بلاد تبدأ بالحرف:')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true);

                        modal.addComponents(
                            new ActionRowBuilder().addComponents(animalInput),
                            new ActionRowBuilder().addComponents(plantInput),
                            new ActionRowBuilder().addComponents(objectInput),
                            new ActionRowBuilder().addComponents(countryInput)
                        );

                        await i.showModal(modal);

                        try {
                            const modalResponse = await i.awaitModalSubmit({
                                filter: mInteraction => mInteraction.customId === `rebecca_modal_${i.user.id}` && mInteraction.user.id === i.user.id,
                                time: 40000
                            });

                            const animal = modalResponse.fields.getTextInputValue('animal');
                            const plant = modalResponse.fields.getTextInputValue('plant');
                            const obj = modalResponse.fields.getTextInputValue('object');
                            const country = modalResponse.fields.getTextInputValue('country');

                            let playerObj = playersMap.get(i.user.id);
                            playerObj.answers = { animal, plant, object: obj, country };

                            await modalResponse.reply({ content: '✅ تم استلام إجاباتك بنجاح! انتظر ظهور النتائج.', ephemeral: true });
                        } catch (err) {
                            // انتهى وقت إدخال الـ Modal
                        }
                    });

                    await new Promise(res => setTimeout(res, 46000));

                    // عرض النتائج والإجابات لكل المشاركين
                    let resultsDescription = `الحرف المختار كان: ** \` ${chosenLetter} \` **\n\n`;
                    playersArr.forEach(p => {
                        if (p.answers) {
                            resultsDescription += `👤 **${p.name}**:\n` +
                                `• حيوان: \`${p.answers.animal}\`\n` +
                                `• نبات: \`${p.answers.plant}\`\n` +
                                `• جماد: \`${p.answers.object}\`\n` +
                                `• بلاد: \`${p.answers.country}\`\n\n`;
                        } else {
                            resultsDescription += `👤 **${p.name}**: ❌ لم يرسل إجاباته في الوقت المحدد.\n\n`;
                        }
                    });

                    const finalResultEmbed = new EmbedBuilder()
                        .setTitle('📊 نتائج لعبة ريبيكا')
                        .setDescription(resultsDescription)
                        .setColor('#f39c12');

                    await message.channel.send({ embeds: [finalResultEmbed] });
                    await gameMessage.edit({ content: '🎉 **انتهت لعبة ريبيكا بنجاح!**', components: [] }).catch(() => {});

                } catch (error) {
                    console.error(error);
                    await message.channel.send("❌ حدث خطأ أثناء تشغيل لعبة ريبيكا.").catch(() => {});
                }
            }
        });
    }
});

client.login(process.env.TOKEN);
