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
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

const THEME_COLOR = '#8B0000'; // الثيم اللوني الداكن

client.on('ready', () => {
    console.log(`✅ Hide and Seek Turn-based Bot Logged in as ${client.user.tag}!`);
    client.user.setActivity('!اختباء | نظام الأدوار', { type: 3 });
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
            .setTitle('🫣 لعبة الاختباء (نظام الأدوار والتفجير)')
            .setDescription(`اضغط على زر **انضمام** في الشات العام للمشاركة!\n\n⏳ **تبدأ اللعبة تلقائياً بعد:** <t:${endTime}:R>`)
            .setColor(THEME_COLOR)
            .addFields({ name: `👥 المشاركون (0/${MAX_PLAYERS}):`, value: 'لا يوجد مشاركين حتى الآن.' });

        const joinBtn = new ButtonBuilder().setCustomId('hide_join').setLabel('انضمام 🟢').setStyle(ButtonStyle.Danger);
        const leaveBtn = new ButtonBuilder().setCustomId('hide_leave').setLabel('انسحاب 🔴').setStyle(ButtonStyle.Secondary);
        const row = new ActionRowBuilder().addComponents(joinBtn, leaveBtn);

        const gameMessage = await message.reply({ embeds: [embed], components: [row] });
        const collector = gameMessage.createMessageComponentCollector({ time: durationSeconds * 1000 });

        collector.on('collect', async interaction => {
            const userId = interaction.user.id;
            const playerName = interaction.user.displayName || interaction.user.username;

            if (interaction.customId === 'hide_join') {
                if (playersMap.size >= MAX_PLAYERS && !playersMap.has(userId)) {
                    return interaction.reply({ content: '⚠️ عذراً، العدد مكتمل!', ephemeral: true });
                }
                if (!playersMap.has(userId)) {
                    playersMap.set(userId, { id: userId, name: playerName, alive: true, hidingSpot: null });
                }
                await interaction.reply({ content: `✅ تم انضمامك للعبة الاختباء بنجاح!`, ephemeral: true });
            } else if (interaction.customId === 'hide_leave') {
                if (playersMap.has(userId)) {
                    playersMap.delete(userId);
                    await interaction.reply({ content: '❌ لقد انسحبت من اللعبة.', ephemeral: true });
                } else {
                    return interaction.reply({ content: '⚠️ أنت لست منضماً أصلاً!', ephemeral: true });
                }
            }

            const playersArray = Array.from(playersMap.values());
            const playersList = playersArray.length > 0 
                ? playersArray.map(p => `• ${p.name}`).join('\n') 
                : 'لا يوجد مشاركين حتى الآن.';

            const updatedEmbed = EmbedBuilder.from(embed).setFields({ name: `👥 المشاركون (${playersMap.size}/${MAX_PLAYERS}):`, value: playersList });
            await gameMessage.edit({ embeds: [updatedEmbed] });
        });

        collector.on('end', async () => {
            let playersArr = Array.from(playersMap.values());

            if (playersArr.length < 1) {
                return gameMessage.edit({ content: '❌ تم إلغاء اللعبة لعدم وجود لاعبين.', embeds: [], components: [] });
            }

            try {
                const startEmbed = new EmbedBuilder()
                    .setTitle('🫣 مرحلة الاختباء السرية (25 صندوقاً)')
                    .setDescription(`📦 تم إرسال رسالة خاصة (DM) لكل مشارك.\nاختر صندوقاً من 1 إلى 25 لتختبئ فيه سرّاً.\n\n⏳ **لديك 20 ثانية للاختيار!**`)
                    .setColor(THEME_COLOR);

                await gameMessage.edit({ content: `🎮 **انطلقت مرحلة الاختباء تلقائياً!**`, embeds: [startEmbed], components: [] });

                // دالة توليد أزرار الصناديق الـ 25 (5x5)
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
                                    .setLabel(isExploded ? `💥 ${boxNum}` : `${boxNum}`)
                                    .setStyle(isExploded ? ButtonStyle.Danger : ButtonStyle.Secondary)
                                    .setDisabled(disabled || isExploded)
                            );
                        }
                        rows.push(new ActionRowBuilder().addComponents(rowComponents));
                    }
                    return rows;
                };

                // إرسال خيارات الاختباء في الخاص لكل لاعب
                for (let player of playersArr) {
                    try {
                        let userObj = await client.users.fetch(player.id);
                        let boxMsg = await userObj.send({ 
                            content: '🫣 **اختر صندوقاً من 1 إلى 25 لتختبئ فيه (سري تماماً):**', 
                            components: renderBoxesRows() 
                        });

                        let choiceCollector = boxMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 20000 });
                        let chosen = false;

                        choiceCollector.on('collect', async i => {
                            let boxNum = parseInt(i.customId.split('_')[1]);
                            player.hidingSpot = boxNum;
                            chosen = true;
                            await i.update({ content: `🤫 **تم تأكيد اختبائك السري في الصندوق رقم: ${boxNum}**`, components: [] });
                            choiceCollector.stop();
                        });

                        choiceCollector.on('end', async () => {
                            if (!chosen) {
                                player.hidingSpot = Math.floor(Math.random() * 25) + 1;
                                await userObj.send({ content: `⚠️ انتهى الوقت! تم اختيار صندوق عشوائي لك: **${player.hidingSpot}**` }).catch(() => {});
                            }
                        });
                    } catch (err) {
                        player.hidingSpot = Math.floor(Math.random() * 25) + 1;
                    }
                }

                await new Promise(res => setTimeout(res, 22000));
                await message.channel.send(`💣 **بدأت مرحلة التفجير بالأدوار!** كل لاعب سيأتي دوره لاختيار صندوق وتفجيره في الشات العام 🧨`);

                let explodedBoxes = [];
                let turnIndex = 0;
                let gameActive = true;

                // حلقة الأدوار (كل لاعب يأتي دوره ليختار صندوقاً يفجره)
                while (gameActive) {
                    let alivePlayers = playersArr.filter(p => p.alive);
                    if (alivePlayers.length <= 1) break;

                    // تحديد اللاعب صاحب الدور الحالي
                    let currentPlayer = alivePlayers[turnIndex % alivePlayers.length];

                    let turnEmbed = new EmbedBuilder()
                        .setTitle('🎯 دور التفجير!')
                        .setDescription(`دور اللاعب: <@${currentPlayer.id}> (**${currentPlayer.name}**)\nاختر صندوقاً من الأزرار أدناه لتفجيره واكتشاف ما داخله!\n\n⏳ **لديك 20 ثانية للاختيار..**`)
                        .setColor(THEME_COLOR);

                    let turnMsg = await message.channel.send({ content: `<@${currentPlayer.id}> دورك الآن! 🧨`, embeds: [turnEmbed], components: renderBoxesRows(false, explodedBoxes) });

                    let turnCollector = turnMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 20000 });
                    let actionTaken = false;

                    turnCollector.on('collect', async i => {
                        if (i.user.id !== currentPlayer.id) {
                            return i.reply({ content: '⚠️ ليس دورك لتفجير الصندوق!', ephemeral: true });
                        }

                        let targetBox = parseInt(i.customId.split('_')[1]);
                        if (explodedBoxes.includes(targetBox)) {
                            return i.reply({ content: '⚠️ هذا الصندوق مَفجّر مسبقاً!', ephemeral: true });
                        }

                        actionTaken = true;
                        turnCollector.stop();

                        explodedBoxes.push(targetBox);

                        // التحقق إذا كان هناك شخص مختبئ في هذا الصندوق
                        let caughtPlayers = playersArr.filter(p => p.alive && p.hidingSpot === targetBox);
                        let resultText = `💥 قام <@${currentPlayer.id}> بتفجير الصندوق رقم **[ ${targetBox} ]**!\n`;

                        if (caughtPlayers.length > 0) {
                            for (let cp of caughtPlayers) {
                                cp.alive = false;
                                resultText += `❌ **خسارة!** تم إقصاء اللاعب **${cp.name}** لأنه كان مختبئاً هنا! 💀\n`;
                            }
                        } else {
                            resultText += `🛡️ الصندوق كان فارغاً ولم يكن داخله أحد بسلام.\n`;
                        }

                        await i.update({ embeds: [new EmbedBuilder().setTitle('💥 نتيجة التفجير').setDescription(resultText).setColor(THEME_COLOR)], components: renderBoxesRows(true, explodedBoxes) });
                    });

                    turnCollector.on('end', async () => {
                        if (!actionTaken) {
                            // إذا انتهى وقت اللاعب ولم يتر الاختيار، يفجر البوت صندوقاً عشوائياً نيابة عنه
                            let available = [];
                            for(let i=1; i<=25; i++) if(!explodedBoxes.includes(i)) available.push(i);
                            if (available.length > 0) {
                                let randomBox = available[Math.floor(Math.random() * available.length)];
                                explodedBoxes.push(randomBox);
                                let caught = playersArr.filter(p => p.alive && p.hidingSpot === randomBox);
                                let text = `⌛ انتهى وقت <@${currentPlayer.id}>! البوت قام بتفجير الصندوق **[ ${randomBox} ]** نيابة عنه.\n`;
                                for (let cp of caught) {
                                    cp.alive = false;
                                    text += `❌ تم إقصاء اللاعب **${cp.name}**! 💀\n`;
                                }
                                await turnMsg.edit({ embeds: [new EmbedBuilder().setTitle('⏰ انتهاء الوقت').setDescription(text).setColor(THEME_COLOR)], components: renderBoxesRows(true, explodedBoxes) }).catch(()=>{});
                            }
                        }
                    });

                    // انتظار انتهاء وقت تفجير هذه الجولة قبل الانتقال للاعب التالي
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
                    finalEmbed.setTitle('🏆 بطل لعبة الاختباء بنظام الأدوار!')
                    .setDescription(`👑 الناجي الوحيد الذي صمد حتى النهاية:\n\n✨ **${survivingPlayers[0].name}** ✨\n\nمبروك الفوز بالبطولة! 🥇🎉`);
                } else {
                    finalEmbed.setTitle('🤝 تعادل الناجين!')
                    .setDescription(`✨ الصامدون الأخيرون:\n\n` + survivingPlayers.map(p => `👑 **${p.name}**`).join('\n'));
                }

                await message.channel.send({ embeds: [finalEmbed] });

            } catch (error) {
                console.error(error);
                await message.channel.send("❌ حدث خطأ أثناء تشغيل لعبة الاختباء.").catch(() => {});
            }
        });
    }
});

client.login(process.env.TOKEN);
