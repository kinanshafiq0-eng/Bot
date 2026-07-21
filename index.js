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

client.on('ready', () => {
    console.log(`✅ Bot Logged in as ${client.user.tag}!`);
    client.user.setActivity('!اختباء أو !كراسي | ساحة الظلام', { type: 3 });
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    const prefix = '!';

    // ==========================================
    // 1. لعبة الاختباء (بدون أي تعديل نهائياً)
    // ==========================================
    if (message.content === prefix + 'اختباء' || message.content === prefix + 'hide') {
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
                return gameMessage.edit({ content: '◆ تم إلغاء الجولة لعدم وجود لاعبين.', embeds: [], components: [] });
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
            }
        });
    }

    // ==========================================
    // 2. لعبة الكراسي الموسيقية (عدد الكراسي = عدد المشاركين - 1)
    // ==========================================
    if (message.content === prefix + 'كراسي' || message.content === prefix + 'chairs') {
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
                    return interaction.reply({ content: 'العدد مكتمل.', ephemeral: true });
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
                return gameMessage.edit({ content: '◆ تم إلغاء الجولة لعدم اكتمال اللاعبين (يجب 2 على الأقل).', embeds: [], components: [] });
            }

            try {
                let roundNumber = 1;
                let gameActive = true;

                while (gameActive) {
                    let alivePlayers = playersArr.filter(p => p.alive);
                    if (alivePlayers.length <= 1) break;

                    // عدد الكراسي دائماً أقل من عدد المشاركين الباقين بواحد بالضبط
                    let chairCount = alivePlayers.length - 1;
                    if (chairCount < 1) chairCount = 1;

                    // إجمالي المربعات المعروضة يجب أن يكفي (مثلاً لو الباقين 10 الكراسي 9، نضع إجمالي مربعات قريبة مثل 9 أو 16 حسب الحاجة، وهنا سنبنيها بحيث يكون عدد الكراسي الفعلية المتاحة = chairCount)
                    let totalBoxes = chairCount + 1; // إجمالي الأزرار هو عدد الكراسي المطلوبة + زر واحد فارغ أو إضافي (أو نحدد الأزرار النشطة بعدد الكراسي)
                    if (totalBoxes > 25) totalBoxes = 25;

                    let chairIndices = [];
                    while(chairIndices.length < chairCount) {
                        let rand = Math.floor(Math.random() * totalBoxes) + 1;
                        if(!chairIndices.includes(rand)) chairIndices.push(rand);
                    }

                    let roundState = {}; 
                    let redRoundLosers = []; 
                    let isRoundRed = Math.random() < 0.3; // 30% فرصة أن تكون الجولة حمراء بالكامل

                    const renderChairRows = (disabled = false) => {
                        let rows = [];
                        let currentRow = new ActionRowBuilder();
                        
                        for (let i = 1; i <= totalBoxes; i++) {
                            let isTaken = Object.values(roundState).includes(i);
                            let btnStyle = ButtonStyle.Primary;
                            let btnLabel = `كرسي ${i}`;
                            let isDisabled = disabled;

                            if (isRoundRed) {
                                btnStyle = ButtonStyle.Danger; // أحمر (فخ)
                                btnLabel = `✕ ${i}`;
                            } else if (isTaken) {
                                btnStyle = ButtonStyle.Success; // أخضر عند الحجز
                                btnLabel = `✓ ${i}`;
                            } else if (!chairIndices.includes(i)) {
                                btnStyle = ButtonStyle.Secondary;
                            }

                            currentRow.addComponents(
                                new ButtonBuilder()
                                    .setCustomId(`chair_${i}`)
                                    .setLabel(btnLabel)
                                    .setStyle(btnStyle)
                                    .setDisabled(isDisabled || (!isRoundRed && isTaken))
                            );

                            // ديسكورد يسمح بحد أقصى 5 أزرار في الصف الواحد
                            if (currentRow.components.length === 5 || i === totalBoxes) {
                                rows.push(currentRow);
                                currentRow = new ActionRowBuilder();
                            }
                        }
                        return rows;
                    };

                    let roundDescText = isRoundRed 
                        ? `⚠️ **تحذير:** الجولة حمراء بالكامل! أي شخص يضغط على أي زر سيتم إقصاؤه فوراً!` 
                        : `الباقون: **${alivePlayers.length}** | الكراسي المطلوبة: **${chairCount}**\nاسرع بالجلوس على الكراسي الزرقاء!`;

                    let roundEmbed = new EmbedBuilder()
                        .setTitle(`◇ جولة الكراسي رقم ${roundNumber}`)
                        .setDescription(`${roundDescText}\n⏳ **الوقت:** 7 ثوانٍ`)
                        .setColor(THEME_COLOR);

                    let roundMsg = await message.channel.send({ 
                        content: `🎵 **بدأت الموسيقى.. الكراسي (${chairCount}) لـ (${alivePlayers.length}) مشارك!**`, 
                        embeds: [roundEmbed], 
                        components: renderChairRows(false) 
                    });

                    let roundCollector = roundMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 7000 });

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
                        if (!chairIndices.includes(targetBox)) {
                            return i.reply({ content: 'هذا ليس كرسياً متاحاً للحجز!', ephemeral: true });
                        }

                        roundState[i.user.id] = targetBox;
                        await i.update({ components: renderChairRows(false) });
                    });

                    await new Promise(res => setTimeout(res, 8000));
                    await roundMsg.edit({ components: renderChairRows(true) }).catch(()=>{});

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
            }
        });
    }
});

client.login(process.env.TOKEN);
