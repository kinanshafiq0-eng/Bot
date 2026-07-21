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
    TextInputStyle,
    StringSelectMenuBuilder
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

const THEME_COLOR = '#8B0000'; // الأسود والأحمر الداكن

client.on('ready', () => {
    console.log(`✅ Professional Gaming Bot Logged in as ${client.user.tag}!`);
    client.user.setActivity('!ألعاب | مركز الألعاب التفاعلي', { type: 3 });
});

// لوحة تحكم رئيسية تشبه البوتات الكبرى (ProBot/Emobot style)
client.on('messageCreate', async message => {
    if (message.author.bot) return;
    const prefix = '!';

    if (message.content === prefix + 'ألعاب' || message.content === prefix + 'games') {
        const embed = new EmbedBuilder()
            .setTitle('🎮 مركز ألعاب التحدي والمرح المظلم')
            .setDescription('أهلاً بك في نظام الألعاب الاحترافي.\nاختر اللعبة التي تود خوض غمارها من القائمة أدناه أو عبر الأوامر السريعة:')
            .setColor(THEME_COLOR)
            .addFields(
                { name: '📝 `!ريبيكا`', value: 'حرف، حيوان، نبات، جماد، بلاد.', inline: true },
                { name: '🫣 `!اختباء`', value: 'الاختباء السري في 25 صندوقاً وتفجيرها.', inline: true },
                { name: '✊ `!حجرة`', value: 'حجرة ورقة مقص التكتيكية.', inline: true },
                { name: '🪑 `!كراسي`', value: 'الكراسي الموسيقية الحماسية.', inline: true },
                { name: '🎯 `!روليت`', value: 'الروليت الروسية الخطرة.', inline: true },
                { name: '🏆 `!بطولة_اكس_او`', value: 'بطولة إكس أو التكتيكية.', inline: true },
                { name: '🕵️‍♂️ `!مافيا`', value: 'لعبة المافيا وكشف الجواسيس.', inline: true }
            )
            .setFooter({ text: 'نظام الألعاب الآلي - يبدأ تلقائياً فور اكتمال الوقت المحدد' });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('game_select_menu')
            .setPlaceholder('🎯 اختر لعبة لبدئها فوراً...')
            .addOptions([
                { label: 'لعبة ريبيكا (الحروف)', description: 'اختبر سرعة بديهتك في الحروف الأربعة', value: 'rebecca', emoji: '📝' },
                { label: 'لعبة الاختباء السرية', description: 'اختبئ في الصناديق ونافس على البقاء', value: 'hide', emoji: '🫣' },
                { label: 'حجرة ورقة مقص', description: 'المواجهة السريعة الكلاسيكية', value: 'rps', emoji: '✊' },
                { label: 'الكراسي الموسيقية', description: 'اسرع واجلس قبل نفاذ الكراسي', value: 'chairs', emoji: '🪑' },
                { label: 'الروليت الروسية', description: 'اختبار حظ مرعب بالمسدس', value: 'roulette', emoji: '🎯' },
                { label: 'بطولة إكس أو', description: 'تحدي تكتيكي ثنائي الذكاء', value: 'tictactoe', emoji: '🏆' },
                { label: 'لعبة المافيا', description: 'اكتشف الجاسوس السري بين أصدقائك', value: 'mafia', emoji: '🕵️‍♂️' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        return message.reply({ embeds: [embed], components: [row] });
    }

    // التعامل مع القائمة المنسدلة لتحويل المستخدم للعبة المطلوبة
    // (ملاحظة: يتم توجيه الأوامر الداخلية مباشرة بناءً على اختيار القائمة أو الأوامر الكتابية)
});

// تفاعل القائمة المنسدلة
client.on('interactionCreate', async interaction => {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId === 'game_select_menu') {
        const choice = interaction.values[0];
        await interaction.reply({ content: `🚀 تم استلام طلبك! جارٍ إطلاق لعبة **${choice}**...`, ephemeral: true });
        
        // محاكاة إطلاق الأمر تلقائياً في الشات
        if (choice === 'rebecca') triggerRebecca(interaction.message);
        if (choice === 'hide') triggerHide(interaction.message);
        if (choice === 'rps') triggerRPS(interaction.message);
        if (choice === 'chairs') triggerChairs(interaction.message);
        if (choice === 'roulette') triggerRoulette(interaction.message);
        if (choice === 'tictactoe') triggerTTT(interaction.message);
        if (choice === 'mafia') triggerMafia(interaction.message);
    }
});

// ==========================================
// الدوال البرمجية للألعاب (تعمل تلقائياً)
// ==========================================

async function triggerRebecca(message) {
    const playersMap = new Map();
    const durationSeconds = 15;
    const endTime = Math.floor(Date.now() / 1000) + durationSeconds;

    const embed = new EmbedBuilder()
        .setTitle('📝 لعبة ريبيكا (حرف، حيوان، نبات، جماد، بلاد)')
        .setDescription(`اضغط على زر **انضمام** للمشاركة!\n\n⏳ **تبدأ اللعبة تلقائياً بعد:** <t:${endTime}:R>`)
        .setColor(THEME_COLOR);

    const joinBtn = new ButtonBuilder().setCustomId('rebecca_join').setLabel('انضمام 🟢').setStyle(ButtonStyle.Danger);
    const gameMessage = await message.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(joinBtn)] });

    const collector = gameMessage.createMessageComponentCollector({ time: durationSeconds * 1000 });
    collector.on('collect', async i => {
        playersMap.set(i.user.id, { id: i.user.id, name: i.user.username, answers: null });
        await i.reply({ content: '✅ انضممت للعبة ريبيكا!', ephemeral: true });
    });

    collector.on('end', async () => {
        let playersArr = Array.from(playersMap.values());
        if (playersArr.length < 1) return gameMessage.edit({ content: '❌ إلغاء لعدم وجود لاعبين.', embeds: [], components: [] });

        const letters = ['أ', 'ب', 'ت', 'ج', 'ح', 'خ', 'د', 'ر', 'س', 'ش', 'ع', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'];
        const chosenLetter = letters[Math.floor(Math.random() * letters.length)];

        const startEmbed = new EmbedBuilder()
            .setTitle('📝 انطلقت لعبة ريبيكا تلقائياً!')
            .setDescription(`الحرف المطلوب: ** \` ${chosenLetter} \` **\n\n⏳ **لديك 45 ثانية للإجابة عبر الزر أدناه!**`)
            .setColor(THEME_COLOR);

        const ansBtn = new ButtonBuilder().setCustomId('rebecca_modal_btn').setLabel('اكتب إجاباتك ✍️').setStyle(ButtonStyle.Danger);
        await gameMessage.edit({ content: '🎮 **بدأت الجولة!**', embeds: [startEmbed], components: [new ActionRowBuilder().addComponents(ansBtn)] });

        let btnCol = gameMessage.createMessageComponentCollector({ componentType: ComponentType.Button, time: 45000 });
        btnCol.on('collect', async i => {
            if (!playersMap.has(i.user.id)) return i.reply({ content: '⚠️ أنت لست مشاركاً!', ephemeral: true });
            const modal = new ModalBuilder().setCustomId(`modal_${i.user.id}`).setTitle(`إجابات ريبيكا (${chosenLetter})`);
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('animal').setLabel('حيوان').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('plant').setLabel('نبات').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('object').setLabel('جماد').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('country').setLabel('بلاد').setStyle(TextInputStyle.Short).setRequired(true))
            );
            await i.showModal(modal);
            try {
                let sub = await i.awaitModalSubmit({ filter: m => m.user.id === i.user.id, time: 40000 });
                playersMap.get(i.user.id).answers = {
                    animal: sub.fields.getTextInputValue('animal'),
                    plant: sub.fields.getTextInputValue('plant'),
                    object: sub.fields.getTextInputValue('object'),
                    country: sub.fields.getTextInputValue('country')
                };
                await sub.reply({ content: '✅ تم استلام إجاباتك السرية!', ephemeral: true });
            } catch(e) {}
        });

        setTimeout(async () => {
            let desc = `الحرف: ** \` ${chosenLetter} \` **\n\n`;
            playersArr.forEach(p => {
                desc += p.answers ? `👤 **${p.name}**:\n حيوان: ${p.answers.animal} | نبات: ${p.answers.plant} | جماد: ${p.answers.object} | بلاد: ${p.answers.country}\n\n` : `👤 **${p.name}**: ❌ لم يجب.\n\n`;
            });
            await message.channel.send({ embeds: [new EmbedBuilder().setTitle('📊 نتائج ريبيكا').setDescription(desc).setColor(THEME_COLOR)] });
            await gameMessage.edit({ content: '🎉 **انتهت اللعبة!**', components: [] }).catch(()=>{});
        }, 46000);
    });
}

async function triggerHide(message) {
    const playersMap = new Map();
    const durationSeconds = 15;
    const endTime = Math.floor(Date.now() / 1000) + durationSeconds;

    const embed = new EmbedBuilder()
        .setTitle('🫣 لعبة الاختباء المظلمة (25 صندوقاً)')
        .setDescription(`اضغط على زر **انضمام** للمشاركة!\n\n⏳ **تبدأ اللعبة تلقائياً بعد:** <t:${endTime}:R>`)
        .setColor(THEME_COLOR);

    const joinBtn = new ButtonBuilder().setCustomId('hide_join').setLabel('انضمام 🟢').setStyle(ButtonStyle.Danger);
    const gameMessage = await message.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(joinBtn)] });

    const collector = gameMessage.createMessageComponentCollector({ time: durationSeconds * 1000 });
    collector.on('collect', async i => {
        playersMap.set(i.user.id, { id: i.user.id, name: i.user.username, alive: true, hidingSpot: null });
        await i.reply({ content: '✅ انضممت للاختباء!', ephemeral: true });
    });

    collector.on('end', async () => {
        let playersArr = Array.from(playersMap.values());
        if (playersArr.length < 1) return gameMessage.edit({ content: '❌ إلغاء لعدم وجود لاعبين.', embeds: [], components: [] });

        await gameMessage.edit({ content: `🎮 **انطلقت مرحلة الاختباء تلقائياً!**`, embeds: [new EmbedBuilder().setTitle('🫣 اختر صندوقاً سرياً').setDescription('تفقد رسائلك الخاصة (DM)').setColor(THEME_COLOR)], components: [] });

        for (let player of playersArr) {
            try {
                let userObj = await message.client.users.fetch(player.id);
                let rows = [];
                for(let r=0; r<5; r++) {
                    let comps = [];
                    for(let c=0; c<5; c++) {
                        let num = r*5 + c + 1;
                        comps.push(new ButtonBuilder().setCustomId(`b_${num}`).setLabel(`${num}`).setStyle(ButtonStyle.Secondary));
                    }
                    rows.push(new ActionRowBuilder().addComponents(comps));
                }
                let boxMsg = await userObj.send({ content: '🫣 اختر صندوقاً من 1 إلى 25 لتختبئ فيه (سري تماماً ولا يراه غيرك):', components: rows });
                let boxCollector = boxMsg.createMessageComponentCollector({ time: 20000 });
                let chosen = false;

                boxCollector.on('collect', async bi => {
                    player.hidingSpot = parseInt(bi.customId.split('_')[1]);
                    chosen = true;
                    // الاختباء السري يظهر للمستخدم في الشات الخاص به (Ephemeral)
                    await bi.update({ content: `🤫 **تم تأكيد اختبائك السري في الصندوق رقم: ${player.hidingSpot}**`, components: [] });
                    boxCollector.stop();
                });

                boxCollector.on('end', () => {
                    if (!chosen) player.hidingSpot = Math.floor(Math.random() * 25) + 1;
                });
            } catch(e) {
                player.hidingSpot = Math.floor(Math.random() * 25) + 1;
            }
        }

        await new Promise(res => setTimeout(res, 22000));
        await message.channel.send(`💣 **بدأت عملية التفجير في الظلام!**`);

        let explodedBoxes = [];
        while(true) {
            let alive = playersArr.filter(p => p.alive);
            if (alive.length <= 1) break;
            let available = [];
            for(let i=1; i<=25; i++) if(!explodedBoxes.includes(i)) available.push(i);
            if (available.length === 0) break;

            let target = available[Math.floor(Math.random() * available.length)];
            explodedBoxes.push(target);
            await new Promise(res => setTimeout(res, 2500));

            let caught = playersArr.filter(p => p.alive && p.hidingSpot === target);
            for(let cp of caught) {
                cp.alive = false;
                // إعلان خسارة وخروج اللاعب فقط بدون ذكر تفاصيل المربع المفجر
                await message.channel.send(`💥 **خسارة!** تم إقصاء اللاعب **${cp.name}** من اللعبة! ❌`);
            }
        }

        let surviving = playersArr.filter(p => p.alive);
        let finalDesc = surviving.length === 1 ? `👑 البطل الناجي:\n\n✨ **${surviving[0].name}** ✨` : `🤝 تعادل الناجين!`;
        await message.channel.send({ embeds: [new EmbedBuilder().setTitle('🏆 نهاية لعبة الاختباء').setDescription(finalDesc).setColor(THEME_COLOR)] });
    });
}

async function triggerRPS(message) {
    const gameMsg = await message.channel.send({ embeds: [new EmbedBuilder().setTitle('✊ لعبة حجرة ورقة مقص').setDescription('⏳ **انطلقت اللعبة تلقائياً!**\nاختر حركتك:').setColor(THEME_COLOR)], components: [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('rps_rock').setLabel('حجرة ✊').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('rps_paper').setLabel('ورقة 📄').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('rps_scissors').setLabel('مقص ✂️').setStyle(ButtonStyle.Primary)
        )
    ]});

    let choices = {};
    const collector = gameMsg.createMessageComponentCollector({ time: 15000 });
    collector.on('collect', async i => {
        choices[i.user.id] = { name: i.user.username, choice: i.customId.split('_')[1] };
        await i.reply({ content: `✅ تم تسجيل خيارك!`, ephemeral: true });
    });

    collector.on('end', async () => {
        let entries = Object.values(choices);
        if (entries.length < 1) return gameMsg.edit({ content: '❌ انتهى الوقت ولم يلعب أحد.', embeds: [], components: [] });
        
        let botChoice = ['rock', 'paper', 'scissors'][Math.floor(Math.random() * 3)];
        let resText = `خيار البوت كان: **${botChoice}**\n\n`;
        entries.forEach(e => { resText += `👤 **${e.name}** اختار: \`${e.choice}\`\n`; });

        await gameMsg.edit({ embeds: [new EmbedBuilder().setTitle('🎯 نتائج حجرة ورقة مقص').setDescription(resText).setColor(THEME_COLOR)], components: [] });
    });
}

async function triggerChairs(message) {
    const playersMap = new Map();
    const durationSeconds = 15;
    const endTime = Math.floor(Date.now() / 1000) + durationSeconds;

    const embed = new EmbedBuilder()
        .setTitle('🪑 لعبة الكراسي الموسيقية')
        .setDescription(`اضغط **انضمام** للمشاركة!\n\n⏳ **تبدأ اللعبة تلقائياً بعد:** <t:${endTime}:R>`)
        .setColor(THEME_COLOR);

    const gameMsg = await message.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('chair_join').setLabel('انضمام 🟢').setStyle(ButtonStyle.Danger))] });

    const collector = gameMsg.createMessageComponentCollector({ time: durationSeconds * 1000 });
    collector.on('collect', async i => {
        playersMap.set(i.user.id, i.user.username);
        await i.reply({ content: '✅ انضممت للكراسي!', ephemeral: true });
    });

    collector.on('end', async () => {
        let players = Array.from(playersMap.keys());
        if (players.length < 1) return gameMsg.edit({ content: '❌ تم الإلغاء.', embeds: [], components: [] });

        let chairsCount = Math.max(1, players.length - 1);
        await gameMsg.edit({ content: '🎵 **توقفت الموسيقى! اسرع واجلس!**', embeds: [], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('sit').setLabel('اجلس بسرعة 🪑').setStyle(ButtonStyle.Danger))] });

        let seated = new Set();
        let sitCol = gameMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 5000 });
        sitCol.on('collect', async i => {
            if (players.includes(i.user.id) && seated.size < chairsCount) {
                seated.add(i.user.id);
                await i.reply({ content: '🪑 حصلت على كرسي!', ephemeral: true });
            } else {
                await i.reply({ content: '❌ متأخر!', ephemeral: true });
            }
        });

        sitCol.on('end', async () => {
            let losers = players.filter(id => !seated.has(id));
            let loserNames = losers.map(id => playersMap.get(id)).join(', ');
            let winnerNames = Array.from(seated).map(id => playersMap.get(id)).join(', ');
            await message.channel.send({ embeds: [new EmbedBuilder().setTitle('🪑 نتائج الكراسي').setDescription(`✨ الجالسون: **${winnerNames || 'لا أحد'}**\n💀 الخارجون: **${loserNames || 'لا أحد'}**`).setColor(THEME_COLOR)] });
        });
    });
}

async function triggerRoulette(message) {
    const gameMsg = await message.channel.send({ embeds: [new EmbedBuilder().setTitle('🎯 الروليت الروسية الخطرة').setDescription('⏳ **انطلقت اللعبة تلقائياً!**\nاضغط على الزر لتجربة حظك في السحب!').setColor(THEME_COLOR)], components: [
        new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('trigger').setLabel('اسحب الزناد 🔫').setStyle(ButtonStyle.Danger))
    ]});

    let bullet = Math.floor(Math.random() * 6) + 1;
    let count = 0;
    let collector = gameMsg.createMessageComponentCollector({ time: 20000 });

    collector.on('collect', async i => {
        count++;
        if (count === bullet) {
            collector.stop();
            await i.update({ embeds: [new EmbedBuilder().setTitle('💥 بانغ!').setDescription(`💀 **${i.user.username}** سحب الزناد وكانت الرصاصة من نصيبه!`).setColor(THEME_COLOR)], components: [] });
        } else {
            await i.reply({ content: '✅ نجوت هذه المرة.. مرر المسدس!', ephemeral: true });
        }
    });
}

async function triggerTTT(message) {
    const waitingEmbed = new EmbedBuilder()
        .setTitle('🏆 بطولة إكس أو التكتيكية')
        .setDescription('⏳ في انتظار منافس للانضمام...\n**تبدأ اللعبة تلقائياً خلال 15 ثانية!**')
        .setColor(THEME_COLOR);

    const gameMsg = await message.channel.send({ embeds: [waitingEmbed], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ttt_join').setLabel('انضمام كمنافس 🟢').setStyle(ButtonStyle.Danger))] });
    let players = [];

    const collector = gameMsg.createMessageComponentCollector({ time: 15000 });
    collector.on('collect', async i => {
        if (players.length < 2 && !players.includes(i.user.id)) {
            players.push(i.user.id);
            await i.reply({ content: '✅ انضممت للبطولة!', ephemeral: true });
            if (players.length === 2) collector.stop('ready');
        }
    });

    collector.on('end', async () => {
        if (players.length < 2) return gameMsg.edit({ content: '❌ إلغاء لعدم اكتمال اللاعبين.', embeds: [], components: [] });

        let board = Array(9).fill(null);
        let turnIndex = 0;

        const getRows = () => {
            let rows = [];
            for(let r=0; r<3; r++) {
                let comps = [];
                for(let c=0; c<3; c++) {
                    let idx = r*3 + c;
                    let val = board[idx];
                    comps.push(new ButtonBuilder().setCustomId(`t_${idx}`).setLabel(val === 'X' ? '❌' : val === 'O' ? '⭕' : `${idx+1}`).setStyle(val ? ButtonStyle.Secondary : ButtonStyle.Danger).setDisabled(val !== null));
                }
                rows.push(new ActionRowBuilder().addComponents(comps));
            }
            return rows;
        };

        await gameMsg.edit({ content: '🎮 **بدأت مواجهة البطولة تلقائياً!**', embeds: [new EmbedBuilder().setTitle('🏆 بطولة إكس أو').setDescription(`دور: <@${players[turnIndex]}>`).setColor(THEME_COLOR)], components: getRows() });

        let playCol = gameMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });
        playCol.on('collect', async i => {
            if (i.user.id !== players[turnIndex]) return i.reply({ content: '⚠️ ليس دورك!', ephemeral: true });
            let idx = parseInt(i.customId.split('_')[1]);
            board[idx] = turnIndex === 0 ? 'X' : 'O';

            let wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
            let winner = wins.find(w => board[w[0]] && board[w[0]] === board[w[1]] && board[w[0]] === board[w[2]]);

            if (winner) {
                playCol.stop();
                return i.update({ embeds: [new EmbedBuilder().setTitle('🏆 نهاية البطولة').setDescription(`🎉 الفائز: <@${players[turnIndex]}>`).setColor(THEME_COLOR)], components: getRows() });
            }

            turnIndex = turnIndex === 0 ? 1 : 0;
            await i.update({ embeds: [new EmbedBuilder().setTitle('🏆 بطولة إكس أو').setDescription(`دور: <@${players[turnIndex]}>`).setColor(THEME_COLOR)], components: getRows() });
        });
    });
}

async function triggerMafia(message) {
    const playersMap = new Map();
    const durationSeconds = 15;
    const endTime = Math.floor(Date.now() / 1000) + durationSeconds;

    const embed = new EmbedBuilder()
        .setTitle('🕵️‍♂️ لعبة المافيا السرية')
        .setDescription(`اضغط على زر **انضمام** للمشاركة!\n\n⏳ **تبدأ اللعبة تلقائياً بعد:** <t:${endTime}:R>`)
        .setColor(THEME_COLOR);

    const gameMsg = await message.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('mafia_join').setLabel('انضمام 🟢').setStyle(ButtonStyle.Danger))] });

    const collector = gameMsg.createMessageComponentCollector({ time: durationSeconds * 1000 });
    collector.on('collect', async i => {
        playersMap.set(i.user.id, { id: i.user.id, name: i.user.username, role: 'مواطن' });
        await i.reply({ content: '✅ انضممت للمافيا!', ephemeral: true });
    });

    collector.on('end', async () => {
        let playersArr = Array.from(playersMap.values());
        if (playersArr.length < 3) return gameMsg.edit({ content: '❌ تحتاج اللعبة إلى 3 لاعبين على الأقل.', embeds: [], components: [] });

        let mafiaIdx = Math.floor(Math.random() * playersArr.length);
        playersArr[mafiaIdx].role = 'مافيا';

        for (let p of playersArr) {
            try {
                let u = await message.client.users.fetch(p.id);
                await u.send({ embeds: [new EmbedBuilder().setTitle('🕵️‍♂️ هويتك السرية').setDescription(`دورك في هذه الجولة هو: **${p.role}**`).setColor(THEME_COLOR)] });
            } catch(e) {}
        }

        await gameMsg.edit({ content: '🕵️‍♂️ **توزعت الأدوار في الظلام!** تحقق من رسائلك الخاصة واكتشف من هو المافيا في الشات!', embeds: [new EmbedBuilder().setTitle('🕵️‍♂️ مرحلة النقاش').setDescription('ناقشوا واكتشفوا من هو المافيا بينكم!').setColor(THEME_COLOR)], components: [] });
    });
}

client.login(process.env.TOKEN);
