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

const THEME_COLOR = '#0A0A0A'; // أسود فخم مطفي

// تخزين الألعاب النشطة لكل سيرفر لمنع تداخل الألعاب
const activeGames = new Set();

client.on('ready', () => {
    console.log(`✅ Bot Logged in as ${client.user.tag}!`);
    client.user.setActivity('!اختباء أو !كراسي أو !ريبيكا | ساحة الظلام', { type: 3 });
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    const prefix = '!';
    const guildId = message.guild.id;

    // ==========================================
    // 1. لعبة الاختباء
    // ==========================================
    if (message.content === prefix + 'اختباء' || message.content === prefix + 'hide') {
        if (activeGames.has(guildId)) {
            return message.reply({ content: '⚠️ توجد لعبة أخرى تعمل حالياً في السيرفر! انتظر حتى تنتهي.', ephemeral: true });
        }

        activeGames.add(guildId);

        const playersMap = new Map();
        const MAX_PLAYERS = 15;
        const durationSeconds = 15; 
        const endTime = Math.floor(Date.now() / 1000) + durationSeconds;

        const embed = new EmbedBuilder()
            .setTitle('◆ لُعبة الاختباء الكبرى')
            .setDescription(`انضم إلى الساحة، والبقاء للأذكى.\n\n⏳ **تبدأ المواجهة خلال:** <t:${endTime}:R>`)
            .setColor(THEME_COLOR)
            .addFields({ name: `• المُنضمون (0/${MAX_PLAYERS})`, value: '`لا توجد أسماء...`' });

        const joinBtn = new ButtonBuilder().setCustomId('hide_join').setLabel('دخول').setStyle(ButtonStyle.Secondary);
        const leaveBtn = new ButtonBuilder().setCustomId('hide_leave').setLabel('انسحاب').setStyle(ButtonStyle.Secondary);
        const row = new ActionRowBuilder().addComponents(joinBtn, leaveBtn);

        const gameMessage = await message.reply({ embeds: [embed], components: [row] });
        const collector = gameMessage.createMessageComponentCollector({ time: durationSeconds * 1000 });

        collector.on('collect', async interaction => {
            const userId = interaction.user.id;
            const playerName = interaction.user.displayName || interaction.user.username;

            if (interaction.customId === 'hide_join') {
                if (playersMap.size >= MAX_PLAYERS && !playersMap.has(userId)) {
                    return interaction.reply({ content: 'العدد مكتمل.', ephemeral: true });
                }
                if (!playersMap.has(userId)) {
                    playersMap.set(userId, { id: userId, name: playerName, alive: true, hidingSpot: null });
                }
                await interaction.reply({ content: 'تم انضمامك.', ephemeral: true });
            } else if (interaction.customId === 'hide_leave') {
                if (playersMap.has(userId)) {
                    playersMap.delete(userId);
                    await interaction.reply({ content: 'تم انسحابك.', ephemeral: true });
                } else {
                    return interaction.reply({ content: 'أنت لست منضماً.', ephemeral: true });
                }
            }

            const playersArray = Array.from(playersMap.values());
            const playersList = playersArray.length > 0 
                ? playersArray.map(p => `• ${p.name}`).join('\n') 
                : '`لا توجد أسماء...`';

            const updatedEmbed = EmbedBuilder.from(embed).setFields({ name: `• المُنضمون (${playersMap.size}/${MAX_PLAYERS})`, value: playersList });
            await gameMessage.edit({ embeds: [updatedEmbed] });
        });

        collector.on('end', async () => {
            let playersArr = Array.from(playersMap.values());

            if (playersArr.length < 1) {
                activeGames.delete(guildId);
                return gameMessage.edit({ content: '◆ تم إلغاء الجولة لعدم وجود لاعبين كافيين.', embeds: [], components: [] });
            }

            try {
                const renderBoxesRows = (disabled = false, boxStatusMap = {}) => {
                    let rows = [];
                    for (let r = 0; r < 5; r++) {
                        let rowComponents = [];
                        for (let c = 0; c < 5; c++) {
                            let boxNum = r * 5 + c + 1;
                            let status = boxStatusMap[boxNum]; 
                            
                            let btnStyle = ButtonStyle.Secondary;
                            if (status === 'hit') btnStyle = ButtonStyle.Success;  
                            else if (status === 'safe') btnStyle = ButtonStyle.Danger;    

                            rowComponents.push(
                                new ButtonBuilder()
                                    .setCustomId(`box_${boxNum}`)
                                    .setLabel(`${boxNum}`)
                                    .setStyle(btnStyle)
                                    .setDisabled(disabled || status !== undefined)
                            );
                        }
                        rows.push(new ActionRowBuilder().addComponents(rowComponents));
                    }
                    return rows;
                };

                const hideEmbed = new EmbedBuilder()
                    .setTitle('◇ مرحلة التخفي')
                    .setDescription(`اختر صندوقاً (1-25) لتختبئ فيه بسرعة.\n⏳ **الوقت:** 12 ثانية`);

                let hideMsg = await message.channel.send({ content: `🔹 **اختر مكان اختبائك الآن:**`, embeds: [hideEmbed], components: renderBoxesRows(false, {}) });

                let hideCollector = hideMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 12000 });

                hideCollector.on('collect', async i => {
                    let player = playersMap.get(i.user.id);
                    if (!player) return i.reply({ content: 'لست مشاركاً.', ephemeral: true });
                    if (player.hidingSpot !== null) return i.reply({ content: `اخترت مسبقاً [${player.hidingSpot}].`, ephemeral: true });

                    let boxNum = parseInt(i.customId.split('_')[1]);
                    player.hidingSpot = boxNum;
                    await i.reply({ content: `اختبأت في الصندوق [${boxNum}].`, ephemeral: true });
                });

                hideCollector.on('end', async () => {
                    for (let player of playersArr) {
                        if (player.hidingSpot === null) {
                            player.hidingSpot = Math.floor(Math.random() * 25) + 1;
                        }
                    }
                });

                await new Promise(res => setTimeout(res, 13000));
                await hideMsg.edit({ content: `🔒 **بدأت مرحلة التدمير..**`, components: [] }).catch(() => {});

                let boxStatusMap = {}; 
                let turnIndex = 0;
                let gameActive = true;

                while (gameActive) {
                    let alivePlayers = playersArr.filter(p => p.alive);
                    if (alivePlayers.length <= 1) break;

                    let currentPlayer = alivePlayers[turnIndex % alivePlayers.length];

                    let turnEmbed = new EmbedBuilder()
                        .setTitle('◇ جولة التدمير')
                        .setDescription(`دور البطل: <@${currentPlayer.id}>\nاختر صندوقاً لتفجيره.\n⏳ **الوقت:** 10 ثوانٍ`)
                        .setColor(THEME_COLOR);

                    let turnMsg = await message.channel.send({ content: `<@${currentPlayer.id}> دورك الآن:`, embeds: [turnEmbed], components: renderBoxesRows(false, boxStatusMap) });

                    let turnCollector = turnMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 10000 });
                    let actionTaken = false;

                    turnCollector.on('collect', async i => {
                        if (i.user.id !== currentPlayer.id) {
                            return i.reply({ content: 'ليس دورك.', ephemeral: true });
                        }

                        let targetBox = parseInt(i.customId.split('_')[1]);
                        if (boxStatusMap[targetBox] !== undefined) {
                            return i.reply({ content: 'مفجر مسبقاً.', ephemeral: true });
                        }

                        actionTaken = true;
                        turnCollector.stop();

                        let caughtPlayers = playersArr.filter(p => p.alive && p.hidingSpot === targetBox);
                        
                        if (caughtPlayers.length > 0) {
                            boxStatusMap[targetBox] = 'hit'; 
                        } else {
                            boxStatusMap[targetBox] = 'safe'; 
                        }

                        let resultText = `💥 تم تفجير الصندوق **[${targetBox}]** بواسطة <@${currentPlayer.id}>\n`;
                        let pingContent = "";

                        if (caughtPlayers.length > 0) {
                            let pingList = caughtPlayers.map(cp => `<@${cp.id}>`).join(' ');
                            pingContent = `🚨 **خسارة وإقصاء:** ${pingList}`;
                            for (let cp of caughtPlayers) {
                                cp.alive = false;
                                resultText += `تم كشف وإقصاء: <@${cp.id}>\n`;
                            }
                        } else {
                            resultText += `الصندوق كان فارغاً وصامداً.`;
                        }

                        await i.update({ 
                            content: pingContent || null,
                            embeds: [new EmbedBuilder().setDescription(resultText).setColor(THEME_COLOR)], 
                            components: renderBoxesRows(true, boxStatusMap) 
                        });
                    });

                    turnCollector.on('end', async () => {
                        if (!actionTaken) {
                            let available = [];
                            for(let i=1; i<=25; i++) if(boxStatusMap[i] === undefined) available.push(i);
                            if (available.length > 0) {
                                let randomBox = available[Math.floor(Math.random() * available.length)];
                                
                                let caught = playersArr.filter(p => p.alive && p.hidingSpot === randomBox);
                                if (caught.length > 0) {
                                    boxStatusMap[randomBox] = 'hit';
                                } else {
                                    boxStatusMap[randomBox] = 'safe';
                                }

                                let text = `⏳ انتهى وقت <@${currentPlayer.id}>.. تم تفجير [${randomBox}] تلقائياً.\n`;
                                let pingContent = "";

                                if (caught.length > 0) {
                                    let pingList = caught.map(cp => `<@${cp.id}>`).join(' ');
                                    pingContent = `🚨 **إقصاء لانتهاء الوقت:** ${pingList}`;
                                    for (let cp of caught) {
                                        cp.alive = false;
                                        text += `تم إقصاء اللاعب: <@${cp.id}>\n`;
                                    }
                                }

                                await turnMsg.edit({ 
                                    content: pingContent || null,
                                    embeds: [new EmbedBuilder().setDescription(text).setColor(THEME_COLOR)], 
                                    components: renderBoxesRows(true, boxStatusMap) 
                                }).catch(()=>{});
                            }
                        }
                    });

                    await new Promise(res => setTimeout(res, 11000));

                    let remainingAlive = playersArr.filter(p => p.alive);
                    if (remainingAlive.length <= 1) {
                        gameActive = false;
                        break;
                    }

                    turnIndex++;
                }

                let survivingPlayers = playersArr.filter(p => p.alive);
                const finalEmbed = new EmbedBuilder().setColor(THEME_COLOR);

                if (survivingPlayers.length === 1) {
                    finalEmbed.setTitle('◆ نهاية المعركة')
                    .setDescription(`👑 الناجي الفائز:\n<@${survivingPlayers[0].id}> ✨`);
                    await message.channel.send({ content: `👑 مبارك الفوز <@${survivingPlayers[0].id}>!`, embeds: [finalEmbed] });
                } else {
                    finalEmbed.setTitle('◆ نهاية المعركة')
                    .setDescription(`👑 الناجون:\n` + survivingPlayers.map(p => `<@${p.id}>`).join('\n'));
                    let pings = survivingPlayers.map(p => `<@${p.id}>`).join(' ');
                    await message.channel.send({ content: `👑 الناجون: ${pings}`, embeds: [finalEmbed] });
                }

            } catch (error) {
                console.error(error);
            } finally {
                activeGames.delete(guildId);
            }
        });
    }

    // ==========================================
    // 2. لعبة الكراسي الموسيقية
    // ==========================================
    if (message.content === prefix + 'كراسي' || message.content === prefix + 'chairs') {
        if (activeGames.has(guildId)) {
            return message.reply({ content: '⚠️ توجد لعبة أخرى تعمل حالياً في السيرفر! انتظر حتى تنتهي.', ephemeral: true });
        }

        activeGames.add(guildId);

        const playersMap = new Map();
        const MAX_PLAYERS = 15;
        const durationSeconds = 15; 
        const endTime = Math.floor(Date.now() / 1000) + durationSeconds;

        const embed = new EmbedBuilder()
            .setTitle('◆ لُعبة الكراسي الموسيقية')
            .setDescription(`انضم إلى الساحة، والبقاء للأسرع.\n\n⏳ **تبدأ المواجهة خلال:** <t:${endTime}:R>`)
            .setColor(THEME_COLOR)
            .addFields({ name: `• المُنضمون (0/${MAX_PLAYERS})`, value: '`لا توجد أسماء...`' });

        const joinBtn = new ButtonBuilder().setCustomId('chair_join').setLabel('دخول').setStyle(ButtonStyle.Secondary);
        const leaveBtn = new ButtonBuilder().setCustomId('chair_leave').setLabel('انسحاب').setStyle(ButtonStyle.Secondary);
        const row = new ActionRowBuilder().addComponents(joinBtn, leaveBtn);

        const gameMessage = await message.reply({ embeds: [embed], components: [row] });
        const collector = gameMessage.createMessageComponentCollector({ time: durationSeconds * 1000 });

        collector.on('collect', async interaction => {
            const userId = interaction.user.id;
            const playerName = interaction.user.displayName || interaction.user.username;

            if (interaction.customId === 'chair_join') {
                if (playersMap.size >= MAX_PLAYERS && !playersMap.has(userId)) {
                    return interaction.reply({ content: 'العدد غير كافٍ أو مكتمل.', ephemeral: true });
                }
                if (!playersMap.has(userId)) {
                    playersMap.set(userId, { id: userId, name: playerName, alive: true });
                }
                await interaction.reply({ content: 'تم انضمامك.', ephemeral: true });
            } else if (interaction.customId === 'chair_leave') {
                if (playersMap.has(userId)) {
                    playersMap.delete(userId);
                    await interaction.reply({ content: 'تم انسحابك.', ephemeral: true });
                } else {
                    return interaction.reply({ content: 'أنت لست منضماً.', ephemeral: true });
                }
            }

            const playersArray = Array.from(playersMap.values());
            const playersList = playersArray.length > 0 
                ? playersArray.map(p => `• ${p.name}`).join('\n') 
                : '`لا توجد أسماء...`';

            const updatedEmbed = EmbedBuilder.from(embed).setFields({ name: `• المُنضمون (${playersMap.size}/${MAX_PLAYERS})`, value: playersList });
            await gameMessage.edit({ embeds: [updatedEmbed] });
        });

        collector.on('end', async () => {
            let playersArr = Array.from(playersMap.values());

            if (playersArr.length < 2) {
                activeGames.delete(guildId);
                return gameMessage.edit({ content: '◆ تم إلغاء الجولة لعدم اكتمال اللاعبين (يجب 2 على الأقل).', embeds: [], components: [] });
            }

            try {
                let roundNumber = 1;
                let gameActive = true;

                while (gameActive) {
                    let alivePlayers = playersArr.filter(p => p.alive);
                    if (alivePlayers.length <= 1) break;

                    let chairCount = alivePlayers.length - 1;
                    if (chairCount < 1) chairCount = 1;

                    let totalBoxes = chairCount; 

                    let roundState = {}; 
                    let redRoundLosers = []; 
                    let isRoundRed = Math.random() < 0.3; 

                    const renderChairRows = (disabled = false, showColors = false) => {
                        let rows = [];
                        let currentRow = new ActionRowBuilder();
                        
                        for (let i = 1; i <= totalBoxes; i++) {
                            let isTaken = Object.values(roundState).includes(i);
                            let btnStyle = ButtonStyle.Secondary; 
                            let btnLabel = `كرسي ${i}`;
                            let isDisabled = disabled;

                            if (showColors) {
                                if (isRoundRed) {
                                    btnStyle = ButtonStyle.Danger; 
                                    btnLabel = `✕ ${i}`;
                                } else if (isTaken) {
                                    btnStyle = ButtonStyle.Success; 
                                    btnLabel = `✓ ${i}`;
                                } else {
                                    btnStyle = ButtonStyle.Primary; 
                                    btnLabel = `كرسي ${i}`;
                                }
                            } else {
                                if (isTaken) {
                                    btnStyle = ButtonStyle.Success; 
                                    btnLabel = `✓ ${i}`;
                                }
                            }

                            currentRow.addComponents(
                                new ButtonBuilder()
                                    .setCustomId(`chair_${i}`)
                                    .setLabel(btnLabel)
                                    .setStyle(btnStyle)
                                    .setDisabled(isDisabled || (!showColors && false) || (!isRoundRed && isTaken))
                            );

                            if (currentRow.components.length === 5 || i === totalBoxes) {
                                rows.push(currentRow);
                                currentRow = new ActionRowBuilder();
                            }
                        }
                        return rows;
                    };

                    let roundEmbed = new EmbedBuilder()
                        .setTitle(`◇ جولة الكراسي رقم ${roundNumber}`)
                        .setDescription(`الباقون: **${alivePlayers.length}** | الكراسي المطلوبة: **${chairCount}**\n⏳ **الموسيقى تعمل.. الأزرار سمراء (تنتظر 15 ثانية)!**`)
                        .setColor(THEME_COLOR);

                    let totalRoundTime = 25000;
                    let revealDelay = 15000; 

                    let roundMsg = await message.channel.send({ 
                        content: `🎵 **بدأت الموسيقى.. الكراسي (${chairCount}) لـ (${alivePlayers.length}) مشارك!**`, 
                        embeds: [roundEmbed], 
                        components: renderChairRows(false, false) 
                    });

                    let roundCollector = roundMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: totalRoundTime });

                    setTimeout(async () => {
                        try {
                            let revealDesc = isRoundRed 
                                ? `⚠️ **تنبيه:** انتهت الـ 15 ثانية.. الجولة حمراء! تظهر الألوان الآن!` 
                                : `الباقون: **${alivePlayers.length}** | انتهت الـ 15 ثانية وتلونت الكراسي! اسرع بالجلوس!`;
                            
                            let revealEmbed = EmbedBuilder.from(roundEmbed).setDescription(`${revealDesc}\n⏳ **تبقى 10 ثوانٍ متبقية!**`);
                            await roundMsg.edit({ embeds: [revealEmbed], components: renderChairRows(false, true) }).catch(()=>{});
                        } catch (e) {}
                    }, revealDelay);

                    roundCollector.on('collect', async i => {
                        let player = playersMap.get(i.user.id);
                        if (!player || !player.alive) {
                            return i.reply({ content: 'لست مشاركاً أو تم إقصاؤك.', ephemeral: true });
                        }

                        let targetBox = parseInt(i.customId.split('_')[1]);

                        if (isRoundRed) {
                            if (!redRoundLosers.includes(player.id)) {
                                redRoundLosers.push(player.id);
                                player.alive = false;
                            }
                            await i.reply({ content: 'لقد ضغطت في جولة حمراء! تم إقصاؤك.', ephemeral: true });
                            return;
                        }

                        if (Object.keys(roundState).includes(i.user.id)) {
                            return i.reply({ content: 'لقد جلست مسبقاً!', ephemeral: true });
                        }
                        if (Object.values(roundState).includes(targetBox)) {
                            return i.reply({ content: 'هذا الكرسي محجوز مسبقاً!', ephemeral: true });
                        }

                        roundState[i.user.id] = targetBox;
                        await i.update({ components: renderChairRows(false, true) });
                    });

                    await new Promise(res => setTimeout(res, totalRoundTime));
                    await roundMsg.edit({ components: renderChairRows(true, true) }).catch(()=>{});

                    let eliminatedInRound = [];
                    
                    if (!isRoundRed) {
                        for (let player of alivePlayers) {
                            if (roundState[player.id] === undefined) {
                                player.alive = false;
                                eliminatedInRound.push(player);
                            }
                        }
                    } else {
                        for (let playerId of redRoundLosers) {
                            let player = playersMap.get(playerId);
                            if (player && !eliminatedInRound.includes(player)) {
                                eliminatedInRound.push(player);
                            }
                        }
                    }

                    let pingContent = "";
                    let resultDesc = `🏁 انتهت الجولة ${roundNumber}\n`;

                    if (isRoundRed) {
                        resultDesc += `🔴 كانت الجولة حمراء (فخ).\n`;
                    }

                    if (eliminatedInRound.length > 0) {
                        let pings = eliminatedInRound.map(p => `<@${p.id}>`).join(' ');
                        pingContent = `❌ **إقصاء هذا الدور:** ${pings}`;
                        resultDesc += eliminatedInRound.map(p => `• خروج: <@${p.id}>`).join('\n');
                    } else {
                        resultDesc += `• نجا الجميع في هذه الجولة!`;
                    }

                    await message.channel.send({
                        content: pingContent || null,
                        embeds: [new EmbedBuilder().setDescription(resultDesc).setColor(THEME_COLOR)]
                    });

                    let remainingAlive = playersArr.filter(p => p.alive);
                    if (remainingAlive.length <= 1) {
                        gameActive = false;
                        break;
                    }

                    roundNumber++;
                    await new Promise(res => setTimeout(res, 1500));
                }

                let winner = playersArr.find(p => p.alive);
                if (winner) {
                    let winEmbed = new EmbedBuilder()
                        .setTitle('◆ نهاية لعبة الكراسي')
                        .setDescription(`👑 الناجي الفائز بالمركز الأول:\n<@${winner.id}> ✨`)
                        .setColor(THEME_COLOR);
                    await message.channel.send({ content: `👑 مبارك الفوز بالمركز الأول <@${winner.id}>!`, embeds: [winEmbed] });
                } else {
                    await message.channel.send({ content: `◆ انتهت اللعبة بدون فائز.` });
                }

            } catch (error) {
                console.error(error);
            } finally {
                activeGames.delete(guildId);
            }
        });
    }

    // ==========================================
    // 3. لعبة ريبيكا (Rebecca) - المتسلسلة بالشات العادي
    // ==========================================
    if (message.content === prefix + 'ريبيكا' || message.content === prefix + 'rebecca') {
        if (activeGames.has(guildId)) {
            return message.reply({ content: '⚠️ توجد لعبة أخرى تعمل حالياً في السيرفر! انتظر حتى تنتهي.', ephemeral: true });
        }

        activeGames.add(guildId);

        const playersMap = new Map();
        const MAX_PLAYERS = 15;
        const durationSeconds = 15; 
        const endTime = Math.floor(Date.now() / 1000) + durationSeconds;

        const embed = new EmbedBuilder()
            .setTitle('◆ لُعبة ريبيكا (اسم - حيوان - نبات - جماد - بلاد)')
            .setDescription(`انضم إلى التحدي المعرفي!\n\n⏳ **تبدأ اللعبة خلال:** <t:${endTime}:R>`)
            .setColor(THEME_COLOR)
            .addFields({ name: `• المُنضمون (0/${MAX_PLAYERS})`, value: '`لا توجد أسماء...`' });

        const joinBtn = new ButtonBuilder().setCustomId('rebecca_join').setLabel('دخول').setStyle(ButtonStyle.Secondary);
        const leaveBtn = new ButtonBuilder().setCustomId('rebecca_leave').setLabel('انسحاب').setStyle(ButtonStyle.Secondary);
        const row = new ActionRowBuilder().addComponents(joinBtn, leaveBtn);

        const gameMessage = await message.reply({ embeds: [embed], components: [row] });
        const collector = gameMessage.createMessageComponentCollector({ time: durationSeconds * 1000 });

        collector.on('collect', async interaction => {
            const userId = interaction.user.id;
            const playerName = interaction.user.displayName || interaction.user.username;

            if (interaction.customId === 'rebecca_join') {
                if (playersMap.size >= MAX_PLAYERS && !playersMap.has(userId)) {
                    return interaction.reply({ content: 'العدد مكتمل.', ephemeral: true });
                }
                if (!playersMap.has(userId)) {
                    playersMap.set(userId, { id: userId, name: playerName, alive: true });
                }
                await interaction.reply({ content: 'تم انضمامك.', ephemeral: true });
            } else if (interaction.customId === 'rebecca_leave') {
                if (playersMap.has(userId)) {
                    playersMap.delete(userId);
                    await interaction.reply({ content: 'تم انسحابك.', ephemeral: true });
                } else {
                    return interaction.reply({ content: 'أنت لست منضماً.', ephemeral: true });
                }
            }

            const playersArray = Array.from(playersMap.values());
            const playersList = playersArray.length > 0 
                ? playersArray.map(p => `• ${p.name}`).join('\n') 
                : '`لا توجد أسماء...`';

            const updatedEmbed = EmbedBuilder.from(embed).setFields({ name: `• المُنضمون (${playersMap.size}/${MAX_PLAYERS})`, value: playersList });
            await gameMessage.edit({ embeds: [updatedEmbed] });
        });

        collector.on('end', async () => {
            let playersArr = Array.from(playersMap.values());

            if (playersArr.length < 1) {
                activeGames.delete(guildId);
                return gameMessage.edit({ content: '◆ تم إلغاء الجولة لعدم وجود لاعبين كافيين.', embeds: [], components: [] });
            }

            try {
                const arabicLetters = ['أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'هـ', 'و', 'ي'];
                let currentLetterIdx = Math.floor(Math.random() * arabicLetters.length);
                let currentLetter = arabicLetters[currentLetterIdx];

                const categories = [
                    { id: 'r_name', name: 'اسم' },
                    { id: 'r_animal', name: 'حيوان' },
                    { id: 'r_plant', name: 'نبات' },
                    { id: 'r_inanimate', name: 'جماد' },
                    { id: 'r_country', name: 'بلاد' }
                ];

                let playerIndex = 0;
                let categoryIndex = 0;
                let gameRunning = true;

                while (gameRunning) {
                    let alivePlayers = playersArr.filter(p => p.alive);
                    if (alivePlayers.length <= 0) break;

                    let currentPlayer = alivePlayers[playerIndex % alivePlayers.length];
                    let currentCategory = categories[categoryIndex];

                    const turnEmbed = new EmbedBuilder()
                        .setTitle('◆ تحدي ريبيكا المتسلسل')
                        .setDescription(`🎯 **الحرف المطلوب:** \`${currentLetter}\`\n📋 **الفئة:** \`${currentCategory.name}\`\n👤 **دور اللاعب:** <@${currentPlayer.id}>\n\n⏳ **اكتب إجابتك في الشات خلال 20 ثانية!**`)
                        .setColor(THEME_COLOR);

                    let promptMsg = await message.channel.send({ content: `<@${currentPlayer.id}> دورك! اكتب **${currentCategory.name}** بحرف **${currentLetter}** في الشات:`, embeds: [turnEmbed] });

                    const filter = m => m.author.id === currentPlayer.id;
                    const chatCollector = message.channel.createMessageCollector({ filter, time: 20000, max: 1 });

                    let answeredCorrectly = false;

                    await new Promise((resolve) => {
                        chatCollector.on('collect', async m => {
                            let answerText = m.content.trim();
                            
                            let cleanAnswerFirstChar = answerText.charAt(0)
                                .replace('أ', 'ا')
                                .replace('إ', 'ا')
                                .replace('آ', 'ا')
                                .replace('ة', 'ه');

                            let cleanTargetLetter = currentLetter
                                .replace('أ', 'ا')
                                .replace('إ', 'ا')
                                .replace('آ', 'ا')
                                .replace('ة', 'ه');

                            if (cleanAnswerFirstChar === cleanTargetLetter) {
                                answeredCorrectly = true;
                                await m.react('✅').catch(() => {});
                                await message.channel.send({ content: `✅ إجابة صحيحة من <@${currentPlayer.id}>!` });
                            } else {
                                await m.react('❌').catch(() => {});
                                await message.channel.send({ content: `❌ الحرف غير مطابق! تم إقصاء <@${currentPlayer.id}>.` });
                                currentPlayer.alive = false;
                            }
                            resolve();
                        });

                        chatCollector.on('end', collected => {
                            if (collected.size === 0) {
                                message.channel.send({ content: `⏰ انتهى الوقت ولم يرد <@${currentPlayer.id}>! تم إقصاؤه.` });
                                currentPlayer.alive = false;
                                resolve();
                            }
                        });
                    });

                    let remainingAlive = playersArr.filter(p => p.alive);
                    if (remainingAlive.length <= 1) {
                        gameRunning = false;
                        break;
                    }

                    playerIndex++;
                    categoryIndex = (categoryIndex + 1) % categories.length;

                    // تغيير الحرف تدريجياً مع كل دورة مكتملة للفئات أو عشوائياً
                    if (categoryIndex === 0) {
                        currentLetterIdx = (currentLetterIdx + 1) % arabicLetters.length;
                        currentLetter = arabicLetters[currentLetterIdx];
                    }

                    await new Promise(res => setTimeout(res, 1000));
                }

                let finalWinner = playersArr.find(p => p.alive);
                if (finalWinner) {
                    await message.channel.send({ content: `👑 **مبارك الفوز في تحدي ريبيكا:** <@${finalWinner.id}>! 🎉` });
                } else {
                    await message.channel.send({ content: `◆ انتهت اللعبة بدون فائزين.` });
                }

            } catch (error) {
                console.error(error);
            } finally {
                activeGames.delete(guildId);
            }
        });
    }
});

client.login('YOUR_BOT_TOKEN');
