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
            .setTitle('🎮 قائمة ألعاب البطولات والإقصاء')
            .setDescription('أهلاً بك! إليك الألعاب المتاحة حالياً:')
            .setColor('#5865F2')
            .addFields(
                { name: '🎯 `!روليت`', value: 'لعبة الإقصاء التدريجي بصور متحركة حتى يبقى فائز واحد.', inline: true },
                { name: '❌⭕ `!بطولة_اكس_او`', value: 'بطولة تكس أو بنظام خروج المغلوب حتى تتويج البطل.', inline: true }
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
});

client.login(process.env.TOKEN);
