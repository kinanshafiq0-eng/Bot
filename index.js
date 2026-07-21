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
const ACCENT_COLOR = '#8B0000'; // أحمر داكن هادئ

client.on('ready', () => {
    console.log(`✅ Hide and Seek Bot Logged in as ${client.user.tag}!`);
    client.user.setActivity('!اختباء | ساحة الظلام', { type: 3 });
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    const prefix = '!';

    if (message.content === prefix + 'اختباء' || message.content === prefix + 'hide') {
        const playersMap = new Map();
        const MAX_PLAYERS = 15;
        const durationSeconds = 15; 
        const endTime = Math.floor(Date.now() / 1000) + durationSeconds;

        const embed = new EmbedBuilder()
            .setTitle('◆ لُعبة الاختباء الكبرى')
            .setDescription(`انضم إلى الساحة الكبرى، حيث الغموض والبقاء للصامد الأخير.\n\n⏳ **تبدأ المواجهة خلال:** <t:${endTime}:R>`)
            .setColor(THEME_COLOR)
            .addFields({ name: `• المُنضمون (0/${MAX_PLAYERS})`, value: '`لا توجد أسماء حتى اللحظة...`' })
            .setFooter({ text: 'نظام اللعب التفاعلي • البوت الرسمي' });

        const joinBtn = new ButtonBuilder().setCustomId('hide_join').setLabel('دخول الساحة').setStyle(ButtonStyle.Secondary);
        const leaveBtn = new ButtonBuilder().setCustomId('hide_leave').setLabel('انسحاب').setStyle(ButtonStyle.Secondary);
        const row = new ActionRowBuilder().addComponents(joinBtn, leaveBtn);

        const gameMessage = await message.reply({ embeds: [embed], components: [row] });
        const collector = gameMessage.createMessageComponentCollector({ time: durationSeconds * 1000 });

        collector.on('collect', async interaction => {
            const userId = interaction.user.id;
            const playerName = interaction.user.displayName || interaction.user.username;

            if (interaction.customId === 'hide_join') {
                if (playersMap.size >= MAX_PLAYERS && !playersMap.has(userId)) {
                    return interaction.reply({ content: 'عذراً، المقاعد اكتملت.', ephemeral: true });
                }
                if (!playersMap.has(userId)) {
                    playersMap.set(userId, { id: userId, name: playerName, alive: true, hidingSpot: null });
                }
                await interaction.reply({ content: 'تم تسجيل حضورك في الساحة بنجاح.', ephemeral: true });
            } else if (interaction.customId === 'hide_leave') {
                if (playersMap.has(userId)) {
                    playersMap.delete(userId);
                    await interaction.reply({ content: 'تم إزالتك من قائمة المشاركين.', ephemeral: true });
                } else {
                    return interaction.reply({ content: 'أنت لست مسجلاً أساساً.', ephemeral: true });
                }
            }

            const playersArray = Array.from(playersMap.values());
            const playersList = playersArray.length > 0 
                ? playersArray.map(p => `• ${p.name}`).join('\n') 
                : '`لا توجد أسماء حتى اللحظة...`';

            const updatedEmbed = EmbedBuilder.from(embed).setFields({ name: `• المُنضمون (${playersMap.size}/${MAX_PLAYERS})`, value: playersList });
            await gameMessage.edit({ embeds: [updatedEmbed] });
        });

        collector.on('end', async () => {
            let playersArr = Array.from(playersMap.values());

            if (playersArr.length < 1) {
                return gameMessage.edit({ content: '◆ تم إلغاء الجولة لعدم اكتمال الحضور.', embeds: [], components: [] });
            }

            try {
                const renderBoxesRows = (disabled = false, exploded = []) => {
                    let rows = [];
                    for (let r = 0; r < 5; r++) {
                        let rowComponents = [];
                        for (let c = 0; c < 5; c++) {
                            let boxNum = r * 5 + c + 1;
                            let isExploded = exploded.includes(boxNum);
                            rowComponents.push(
                                new ButtonBuilder()
                                    .setCustomId(`box_${boxNum}`)
                                    .setLabel(isExploded ? `✕ ${boxNum}` : `${boxNum}`)
                                    .setStyle(isExploded ? ButtonStyle.Danger : ButtonStyle.Secondary)
                                    .setDisabled(disabled || isExploded)
                            );
                        }
                        rows.push(new ActionRowBuilder().addComponents(rowComponents));
                    }
                    return rows;
                };

                const hideEmbed = new EmbedBuilder()
                    .setTitle('◇ مرحلة التخفي الكبرى')
                    .setDescription(`اختر صندوقاً من الـ 25 لتتخذ منه مأوى سرياً.\n\n⏳ **الوقت المتبقي للاختيار:**`)
                    .setColor(THEME_COLOR);

                let hideMsg = await message.channel.send({ content: `🔹 **انطلقت مرحلة الاختباء.. اختر موقعك بحذر:**`, embeds: [hideEmbed], components: renderBoxesRows() });

                let hideCollector = hideMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 20000 });

                hideCollector.on('collect', async i => {
                    let player = playersMap.get(i.user.id);
                    if (!player) {
                        return i.reply({ content: 'لست من ضمن المشاركين في هذه المعركة.', ephemeral: true });
                    }
                    if (player.hidingSpot !== null) {
                        return i.reply({ content: `لقد اخترت مسبقاً الصندوق رقم [ ${player.hidingSpot} ].`, ephemeral: true });
                    }

                    let boxNum = parseInt(i.customId.split('_')[1]);
                    player.hidingSpot = boxNum;

                    await i.reply({ content: `تم استقرارك في الصندوق [ ${boxNum} ]. حافظ على سرية مكانك.`, ephemeral: true });
                });

                hideCollector.on('end', async () => {
                    for (let player of playersArr) {
                        if (player.hidingSpot === null) {
                            player.hidingSpot = Math.floor(Math.random() * 25) + 1;
                        }
                    }
                });

                await new Promise(res => setTimeout(res, 22000));

                await hideMsg.edit({ content: `🔒 **أغلق الستار.. انتهى وقت الاختباء.**`, components: [] }).catch(() => {});
                await message.channel.send(`⚔️ **بدأت مرحلة التدمير..** لكل مشارك دوره الخاص في كشف المخابئ.`);

                let explodedBoxes = [];
                let turnIndex = 0;
                let gameActive = true;

                while (gameActive) {
                    let alivePlayers = playersArr.filter(p => p.alive);
                    if (alivePlayers.length <= 1) break;

                    let currentPlayer = alivePlayers[turnIndex % alivePlayers.length];

                    let turnEmbed = new EmbedBuilder()
                        .setTitle('◇ جولة التدمير')
                        .setDescription(`دور البطل: <@${currentPlayer.id}>\nاختر صندوقاً لهدمه واستكشاف ما خلفه.\n\n⏳ **المهلة الممنوحة:**`)
                        .setColor(THEME_COLOR);

                    let turnMsg = await message.channel.send({ content: `🔹 الدور الآن للـ <@${currentPlayer.id}>`, embeds: [turnEmbed], components: renderBoxesRows(false, explodedBoxes) });

                    let turnCollector = turnMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 20000 });
                    let actionTaken = false;

                    turnCollector.on('collect', async i => {
                        if (i.user.id !== currentPlayer.id) {
                            return i.reply({ content: 'ليس دورك الآن.', ephemeral: true });
                        }

                        let targetBox = parseInt(i.customId.split('_')[1]);
                        if (explodedBoxes.includes(targetBox)) {
                            return i.reply({ content: 'هذا الصندوق تم تدميره مسبقاً.', ephemeral: true });
                        }

                        actionTaken = true;
                        turnCollector.stop();

                        explodedBoxes.push(targetBox);

                        let caughtPlayers = playersArr.filter(p => p.alive && p.hidingSpot === targetBox);
                        let resultText = `💥 أطاح اللاعب <@${currentPlayer.id}> بالصندوق رقم **[ ${targetBox} ]**\n\n`;

                        if (caughtPlayers.length > 0) {
                            for (let cp of caughtPlayers) {
                                cp.alive = false;
                                resultText += `✖ تم كشف واقصاء: **${cp.name}** من المعركة.\n`;
                            }
                        } else {
                            resultText += `🛡️ كان الصندوق خالياً تماماً.. نجا الجميع هذه المرة.`;
                        }

                        await i.update({ embeds: [new EmbedBuilder().setTitle('◇ تقرير التفجير').setDescription(resultText).setColor(THEME_COLOR)], components: renderBoxesRows(true, explodedBoxes) });
                    });

                    turnCollector.on('end', async () => {
                        if (!actionTaken) {
                            let available = [];
                            for(let i=1; i<=25; i++) if(!explodedBoxes.includes(i)) available.push(i);
                            if (available.length > 0) {
                                let randomBox = available[Math.floor(Math.random() * available.length)];
                                explodedBoxes.push(randomBox);
                                let caught = playersArr.filter(p => p.alive && p.hidingSpot === randomBox);
                                let text = `⏳ انقضى الوقت.. تم تدمير الصندوق **[ ${randomBox} ]** تلقائياً.\n\n`;
                                for (let cp of caught) {
                                    cp.alive = false;
                                    text += `✖ سقط اللاعب: **${cp.name}**\n`;
                                }
                                await turnMsg.edit({ embeds: [new EmbedBuilder().setTitle('◇ انتهاء الوقت').setDescription(text).setColor(THEME_COLOR)], components: renderBoxesRows(true, explodedBoxes) }).catch(()=>{});
                            }
                        }
                    });

                    await new Promise(res => setTimeout(res, 22000));

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
                    finalEmbed.setTitle('◆ نهاية المعركة • الناجي الأخير')
                    .setDescription(`بكل هيبة واقتدار، صمد حتى النهاية:\n\n👑 **${survivingPlayers[0].name}** 👑\n\nمبارك لك سيادتك على هذه الجولة.`);
                } else {
                    finalEmbed.setTitle('◆ نهاية المعركة • تعادل الأبطال')
                    .setDescription(`الصامدون في وجه الدمار:\n\n` + survivingPlayers.map(p => `👑 **${p.name}**`).join('\n'));
                }

                await message.channel.send({ embeds: [finalEmbed] });

            } catch (error) {
                console.error(error);
                await message.channel.send("حدث خطأ غير متوقع أثناء إدارة اللعبة.").catch(() => {});
            }
        });
    }
});

client.login(process.env.TOKEN);
