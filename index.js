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
const activeGames = new Set();

// ==========================================
// قاعدة بيانات فئات ريبيكا للتحقق من صحة الكلمات
// ==========================================
const rebeccaDatabase = {
    'اسم': [
        'احمد', 'محمد', 'ابراهيم', 'اسماعيل', 'اسامه', 'اياد', 'انس', 'ايوب', 'امين', 'اكرم',
        'بكر', 'بشار', 'باسم', 'بركات', 'بلال', 'بندر',
        'تامر', 'تميم', 'توفيق', 'تركي', 'تيسير',
        'ثامر', 'ثابت', 'ثاقب',
        'جابر', 'جمال', 'جاسر', 'جهاد', 'جواد', 'جرير',
        'حازم', 'حسن', 'حسين', 'حمد', 'حمزة', 'حامد', 'حكمت',
        'خالد', 'خليل', 'خضير', 'خريص',
        'داود', 'دريد', 'دحام', 'داهش',
        'ذياب', 'ذيب', 'ذو الفقار',
        'راشد', 'رامي', 'رائد', 'رباح', 'رجب', 'ركان', 'ريان',
        'زكريا', 'زياد', 'زهير', 'زكي', 'زيد', 'زاهر',
        'سالم', 'سامر', 'سعيد', 'سلمان', 'سليمان', 'سلطان', 'سامح', 'سراج',
        'شاكر', 'شريف', 'شهاب', 'شوقي', 'شعيفان',
        'صالح', 'صقر', 'صلاح', 'صفوان', 'صباح',
        'ضياء', 'ضاحي', 'ضرار', 'ظافر', 'ظهير',
        'عادل', 'عارف', 'عامر', 'عبدالله', 'عبدالرحمن', 'علي', 'عمر', 'عثمان', 'عصام',
        'غالب', 'غسان', 'غيث', 'غلام',
        'فارس', 'فادي', 'فؤاد', 'فهد', 'فيصل', 'فرحان', 'فوزي',
        'قاسم', 'قصي', 'قيس', 'قطب',
        'كامران', 'كريم', 'كمال', 'كثير',
        'لؤي', 'ليث', 'لقمان', 'لطفي',
        'ماجد', 'مالك', 'ماهر', 'محمد', 'محمود', 'مصطفى', 'معاذ', 'منصور', 'مهند',
        'ناجي', 'نادر', 'ناصر', 'نبيل', 'نجم', 'نواف', 'نوح',
        'هاني', 'هاشم', 'هيثم', 'هشام', 'هلال',
        'وائل', 'وجدي', 'وحيد', 'وديع', 'وليد',
        'ياسر', 'يحيى', 'يزيد', 'يعقوب', 'يوسف', 'يونس'
    ],
    'حيوان': [
        'ارنب', 'اسد', 'افعى', 'ايل', 'اتان',
        'بطريق', 'بقر', 'باز', 'ببغاء', 'ببر',
        'تمساح', 'تنين', 'تيس',
        'ثعلب', 'ثور', 'ثعبان',
        'جمل', 'جيربوع', 'جاموس', 'جرو', 'جواد',
        'حصان', 'حمار', 'حوت', 'حرباء', 'حمام', 'حجل',
        'خروف', 'خنزير', 'خيل', 'خلد', 'خطاف',
        'دب', 'دلفين', 'دجاج', 'ديوك', 'دبور',
        'ذئب', 'ذباب',
        'راكون', 'رنة', 'رفراف',
        'زرافة', 'زنبور', 'زبابة',
        'سنجاب', 'سمك', 'سرطان', 'سلاحف', 'سبع',
        'شاهين', 'شمبانزي',
        'صقر', 'صائد',
        'ضفدع', 'ضب', 'ضبع',
        'ظبي', 'ظربان',
        'عجل', 'عصفور', 'عقرب', 'عنكبوت', 'غراب',
        'غزال', 'غرنوق',
        'فيل', 'فهد', 'فار', 'فلامنجو', 'فقمة',
        'قرد', 'قط', 'قنفذ', 'قطرس', 'قندس',
        'كلب', 'كوالا', 'كنغر',
        'لقلق', 'لاما',
        'ماعز', 'نمر', 'نسر', 'ناقة', 'نحلة', 'نعامة', 'نورس',
        'هدهد', 'هامستر',
        'وعل', 'وبر', 'ورل',
        'يمام', 'يعسوب', 'يربوع'
    ],
    'نبات': [
        'ارز', 'اناناس', 'افوكادو',
        'بصل', 'برتقال', 'بطاطس', 'بامية', 'بروكلي', 'باذنجان', 'بلح',
        'تفاح', 'تمر', 'ترمس', 'تين',
        'ثوم',
        'جزر', 'جوافة', 'جوز', 'جرجير',
        'حمص', 'حلبة', 'حرمل', 'حبق', 'حناء',
        'خيار', 'خس', 'خوخ', 'خردل', 'خيزران',
        'دراق', 'دخن', 'دباء',
        'ذرة',
        'رمان', 'ريحان', 'رشاد',
        'زيتون', 'زعتر', 'زعفران', 'زنجبيل',
        'سبانخ', 'سماق', 'سنديان',
        'شومر', 'شعير', 'شاي', 'شمام', 'شمندر',
        'صبار', 'صندل',
        'عنب', 'عدس', 'عجوة',
        'غار',
        'فراولة', 'فجل', 'فول', 'فستق', 'فلفل', 'فطر',
        'قمح', 'قصب', 'قرع', 'قرفة', 'قرنفل',
        'كرفس', 'كوسا', 'كمون', 'كاكا', 'كرز',
        'ليمون', 'لفت', 'لوز', 'لبان',
        'موز', 'مانجو', 'ملفوف', 'نعناع', 'ملوخية', 'ميرمية',
        'نخيل', 'نرجس',
        'هيل', 'هليون',
        'يانسون', 'يقطين'
    ],
    'جماد': [
        'ابريق', 'اسفنج', 'اسوارة', 'الماس',
        'باب', 'برطمان', 'برج', 'برواز', 'بطانية', 'بلوزة', 'برميل', 'بوصلة',
        'تاج', 'تلفزيون', 'تمثال',
        'ثوب', 'ثلاجة', 'ثريا',
        'جدار', 'جسر', 'جهاز', 'جريدة', 'جزمة',
        'حذاء', 'حائط', 'حزام', 'حبل', 'حاسوب', 'حقيبة',
        'خاتم', 'خزانة', 'خشبة', 'خيمة', 'خيط',
        'درج', 'دلو', 'دبوس', 'دراجة', 'درع',
        'ذهب', 'درهم',
        'راديو', 'رسالة', 'رمح',
        'زجاج', 'زر', 'زبرجد',
        'سرير', 'ساعة', 'سيارة', 'سجادة', 'سيف', 'سلك', 'سلسلة', 'ستارة',
        'شباك', 'شاشة', 'شوكة', 'شمعدان', 'شمعة', 'شارع',
        'صندوق', 'صنبور', 'صاروخ', 'صينية', 'صخرة', 'صابون',
        'طاولة', 'طبلة', 'طائرة', 'طوق',
        'ظرف', 'ظلال',
        'عصا', 'عقد', 'عربة', 'علم', 'عطر',
        'غسالة', 'غطاء', 'غرفة',
        'فأس', 'فنجان', 'فرن', 'فرشاة', 'فازة', 'فستان',
        'قلم', 'قفل', 'قدر', 'قميص', 'قارب',
        'كتاب', 'كرسي', 'كأس', 'كمبيوتر', 'مكتب',
        'لابتوب', 'لعبة', 'لوحة',
        'مفتاح', 'مصباح', 'مروحة', 'منشفة', 'مقص', 'محفظة', 'مرآة', 'ملعقة',
        'نظارة', 'نجفة',
        'هاتف', 'هودي', 'هرم',
        'وسادة', 'ورقة', 'وسام',
        'يخت'
    ],
    'بلاد': [
        'اردن', 'اسبانيا', 'امريكا', 'المانيا', 'ايطاليا', 'ايران', 'استراليا', 'امارات', 'اسكتلندا',
        'بريطانيا', 'بلجيكا', 'بلغاريا', 'بحرين', 'بروناي', 'بنغلاديش',
        'تركيا', 'تونس', 'تشاد', 'تشيلي', 'تايلاند', 'تنزانيا', 'تايوان',
        'جزائر', 'جامايكا', 'جورجيا', 'جيبوتي',
        'هند', 'هونغ كونغ',
        'دانمارك',
        'رومانيا', 'روسيا', 'رواندا',
        'زيمبابوي', 'زامبيا',
        'سعودية', 'سودان', 'سوريا', 'سويد', 'سويسرا', 'سنغافورة', 'سنغال', 'صومال',
        'صين', 'صربيا',
        'عراق', 'عمان',
        'فرنسا', 'فلبين', 'فنزويلا', 'فنلندا', 'فلسطين', 'فيتنام',
        'قبرص', 'قطر',
        'كندا', 'كويت', 'كولومبيا', 'كوبا', 'كامرون', 'كرواتيا', 'كينيا',
        'لبنان', 'ليبي', 'لتوانيا', 'ليبيريا',
        'مصر', 'مغرب', 'موريتانيا', 'ماليزيا', 'مالطا', 'مكسيك', 'منغوليا', 'مدغشقر',
        'نرويج', 'نمسا', 'نيبال', 'نيجر', 'نيجيريا', 'نيوزيلندا',
        'هندوراس', 'هنغاريا', 'هولندا',
        'يمن', 'يونان', 'وغندا'
    ]
};

// دالة لتنظيف وتوحيد الحروف العربية للمقارنة الصحيحة
function cleanArabic(text) {
    if (!text) return '';
    return text.trim()
        .replace(/أ|إ|آ/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[\u064b-\u0652]/g, '');
}

client.on('ready', () => {
    console.log(`✅ Bot Logged in as ${client.user.tag}!`);
    client.user.setActivity('!اختباء أو !كراسي أو !ريبيكا أو !تخمين | ساحة الظلام', { type: 3 });
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    const prefix = '!';
    const guildId = message.guild.id;

    // ==========================================
    // 1. لعبة الاختباء (25 صندوق - تدمير عشوائي)
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
            .setDescription(`انضم إلى الساحة، والبقاء للأذكى.\n\n⏳ **تبدأ المواجهة تلقائياً خلال:** <t:${endTime}:R>`)
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
                await interaction.reply({ content: 'تم انضمامك بنجاح.', ephemeral: true });
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
                    .setDescription(`اختر صندوقاً من الـ 25 لتختبئ فيه.\n⏳ **الوقت:** 12 ثانية`);

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
                        .setDescription(`دور اللاعب: <@${currentPlayer.id}>\nاختر صندوقاً لتفجيره.\n⏳ **الوقت:** 10 ثوانٍ`)
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
            .setDescription(`انضم إلى الساحة، والبقاء للأسرع.\n\n⏳ **تبدأ اللعبة تلقائياً خلال:** <t:${endTime}:R>`)
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
                        .setDescription(`الباقون: **${alivePlayers.length}** | الكراسي: **${chairCount}**\n⏳ **الموسيقى تعمل.. الأزرار تنتظر الكشف!**`)
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
                                ? `⚠️ **تنبيه:** انتهت الـ 15 ثانية.. الجولة حمراء (فخ)!` 
                                : `الباقون: **${alivePlayers.length}** | ظهرت الألوان الآن! اسرع بالجلوس!`;
                            
                            let revealEmbed = EmbedBuilder.from(roundEmbed).setDescription(`${revealDesc}\n⏳ **تبقى 10 ثوانٍ!**`);
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
                            await i.reply({ content: 'جولة حمراء! تم إقصاؤك.', ephemeral: true });
                            return;
                        }

                        if (Object.keys(roundState).includes(i.user.id)) {
                            return i.reply({ content: 'لقد جلست مسبقاً!', ephemeral: true });
                        }
                        if (Object.values(roundState).includes(targetBox)) {
                            return i.reply({ content: 'هذا الكرسي محجوز!', ephemeral: true });
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
    // 3. لعبة ريبيكا (مع التحقق من الفئة والحرف)
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
            .setDescription(`انضم إلى التحدي المعرفي!\n\n⏳ **تبدأ اللعبة تلقائياً خلال:** <t:${endTime}:R>`)
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
                const arabicLetters = ['أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'];
                let currentLetterIdx = Math.floor(Math.random() * arabicLetters.length);
                let currentLetter = arabicLetters[currentLetterIdx];

                const categories = [
                    { id: 'اسم', name: 'اسم' },
                    { id: 'حيوان', name: 'حيوان' },
                    { id: 'نبات', name: 'نبات' },
                    { id: 'جماد', name: 'جماد' },
                    { id: 'بلاد', name: 'بلاد' }
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
                        .setDescription(`🎯 **الحرف المطلوب:** \`${currentLetter}\`\n📋 **الفئة المطلوبة:** \`${currentCategory.name}\`\n👤 **دور اللاعب:** <@${currentPlayer.id}>\n\n⏳ **اكتب إجابتك في الشات خلال 20 ثانية!**`)
                        .setColor(THEME_COLOR);

                    await message.channel.send({ content: `<@${currentPlayer.id}> دورك! اكتب **${currentCategory.name}** بحرف **${currentLetter}** في الشات:`, embeds: [turnEmbed] });

                    const filter = m => m.author.id === currentPlayer.id;
                    const chatCollector = message.channel.createMessageCollector({ filter, time: 20000, max: 1 });

                    await new Promise((resolve) => {
                        chatCollector.on('collect', async m => {
                            let answerText = m.content.trim();
                            let cleanAnswer = cleanArabic(answerText);
                            let cleanTargetLetter = cleanArabic(currentLetter);

                            let firstChar = cleanAnswer.charAt(0);
                            let isLetterCorrect = (firstChar === cleanTargetLetter);

                            let categoryList = rebeccaDatabase[currentCategory.name] || [];
                            let isCategoryValid = categoryList.some(item => cleanArabic(item) === cleanAnswer);

                            if (isLetterCorrect && isCategoryValid) {
                                await m.react('✅').catch(() => {});
                                await message.channel.send({ content: `✅ إجابة صحيحة وصائبة من <@${currentPlayer.id}>!` });
                            } else {
                                await m.react('❌').catch(() => {});
                                let reason = !isLetterCorrect ? 'الحرف غير مطابق!' : `الكلمة ليست ضمن فئة (${currentCategory.name}) الصحيحة!`;
                                await message.channel.send({ content: `❌ ${reason} تم إقصاء <@${currentPlayer.id}>.` });
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

    // ==========================================
    // 4. لعبة تخمين البلد الجغرافي (6 جولات بنظام واجهة الدخول والنقاط)
    // ==========================================
    if (message.content === prefix + 'تخمين' || message.content === prefix + 'guess') {
        if (activeGames.has(guildId)) {
            return message.reply({ content: '⚠️ توجد لعبة أخرى تعمل حالياً في السيرفر! انتظر حتى تنتهي.', ephemeral: true });
        }

        activeGames.add(guildId);

        const playersMap = new Map();
        const MAX_PLAYERS = 15;
        const durationSeconds = 15; // وقت الانظار والدخول
        const endTime = Math.floor(Date.now() / 1000) + durationSeconds;

        const lobbyEmbed = new EmbedBuilder()
            .setTitle('◆ لعبة تخمين البلد الجغرافي (6 جولات)')
            .setDescription(`انضم إلى الساحة للمنافسة على أعلى نقاط عبر 6 جولات!\n\n⏳ **تبدأ اللعبة تلقائياً خلال:** <t:${endTime}:R>`)
            .setColor(THEME_COLOR)
            .addFields({ name: `• المُنضمون (0/${MAX_PLAYERS})`, value: '`لا توجد أسماء...`' });

        const joinBtn = new ButtonBuilder().setCustomId('guess_join').setLabel('دخول').setStyle(ButtonStyle.Secondary);
        const leaveBtn = new ButtonBuilder().setCustomId('guess_leave').setLabel('انسحاب').setStyle(ButtonStyle.Secondary);
        const row = new ActionRowBuilder().addComponents(joinBtn, leaveBtn);

        const gameMessage = await message.reply({ embeds: [lobbyEmbed], components: [row] });
        const lobbyCollector = gameMessage.createMessageComponentCollector({ time: durationSeconds * 1000 });

        lobbyCollector.on('collect', async interaction => {
            const userId = interaction.user.id;
            const playerName = interaction.user.displayName || interaction.user.username;

            if (interaction.customId === 'guess_join') {
                if (playersMap.size >= MAX_PLAYERS && !playersMap.has(userId)) {
                    return interaction.reply({ content: 'العدد مكتمل.', ephemeral: true });
                }
                if (!playersMap.has(userId)) {
                    playersMap.set(userId, { id: userId, name: playerName, score: 0 });
                }
                await interaction.reply({ content: 'تم انضمامك بنجاح.', ephemeral: true });
            } else if (interaction.customId === 'guess_leave') {
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

            const updatedEmbed = EmbedBuilder.from(lobbyEmbed).setFields({ name: `• المُنضمون (${playersMap.size}/${MAX_PLAYERS})`, value: playersList });
            await gameMessage.edit({ embeds: [updatedEmbed] });
        });

        lobbyCollector.on('end', async () => {
            let registeredPlayers = Array.from(playersMap.values());

            if (registeredPlayers.length < 1) {
                activeGames.delete(guildId);
                return gameMessage.edit({ content: '◆ تم إلغاء الجولة لعدم وجود لاعبين كافيين.', embeds: [], components: [] });
            }

            await gameMessage.edit({ content: '🚀 **بدأت لعبة التخمين الجغرافي (6 جولات)!**', components: [] }).catch(()=>{});

            const guessLevels = [
                {
                    imageUrl: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=1000&auto=format&fit=crop', // جامع السلطان أحمد - إسطنبول
                    country: 'تركيا',
                    lat: 41.0082, lon: 28.9784,
                    hint: 'معلم تاريخي شهير في مدينة تبعد بين قارتين'
                },
                {
                    imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1000&auto=format&fit=crop', // باريس
                    country: 'فرنسا',
                    lat: 48.8566, lon: 2.3522,
                    hint: 'عاصمة النور والأناقة الأوروبية'
                },
                {
                    imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=1000&auto=format&fit=crop', // لندن
                    country: 'بريطانيا',
                    lat: 51.5074, lon: -0.1278,
                    hint: 'تتميز بطقس ممطر وجسر شهير وساعاتها الكبرى'
                },
                {
                    imageUrl: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?q=80&w=1000&auto=format&fit=crop', // طوكيو
                    country: 'اليابان',
                    lat: 35.6762, lon: 139.6503,
                    hint: 'بلاد الساموراي والتكنولوجيا المتقدمة'
                },
                {
                    imageUrl: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?q=80&w=1000&auto=format&fit=crop', // برج إيفل زاوية أخرى
                    country: 'فرنسا',
                    lat: 48.8584, lon: 2.2945,
                    hint: 'دولة تشتهر بالمعالم السياحية الشهيرة في أوروبا'
                },
                {
                    imageUrl: 'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?q=80&w=1000&auto=format&fit=crop', // روما، إيطاليا
                    country: 'ايطاليا',
                    lat: 41.9028, lon: 12.4964,
                    hint: 'بلد تاريخي مشهور بالكولوسيوم على شكل المعالم الرومانية القديمة'
                }
            ];

            const countryCoords = {
                'الاردن': { lat: 31.95, lon: 35.91 },
                'فلسطين': { lat: 31.90, lon: 35.20 },
                'سوريا': { lat: 33.51, lon: 36.27 },
                'لبنان': { lat: 33.89, lon: 35.50 },
                'مصر': { lat: 30.04, lon: 31.23 },
                'السعودية': { lat: 24.71, lon: 46.67 },
                'العراق': { lat: 33.31, lon: 44.36 },
                'فرنسا': { lat: 48.85, lon: 2.35 },
                'بريطانيا': { lat: 51.50, lon: -0.12 },
                'اليابان': { lat: 35.67, lon: 139.65 },
                'الامارات': { lat: 24.45, lon: 54.37 },
                'تركيا': { lat: 41.00, lon: 28.97 },
                'المانيا': { lat: 52.52, lon: 13.40 },
                'ايطاليا': { lat: 41.90, lon: 12.49 }
            };

            function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
                let R = 6371;
                let dLat = (lat2 - lat1) * (Math.PI / 180);
                let dLon = (lon2 - lon1) * (Math.PI / 180);
                let a =
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return R * c;
            }

            try {
                for (let round = 1; round <= 6; round++) {
                    let currentLevel = guessLevels[round - 1];
                    let roundTimeSeconds = 25;
                    let endTimeStamp = Math.floor(Date.now() / 1000) + roundTimeSeconds;

                    const guessEmbed = new EmbedBuilder()
                        .setTitle(`◆ لعبة تخمين البلد الجغرافي (الجولة ${round}/6)`)
                        .setDescription(`تأمل الصورة أدناه واكتب اسم **البلد** في الشات.\n💡 تلميح: \`${currentLevel.hint}\`\n\n⏳ **ينتهي وقت الجولة خلال:** <t:${endTimeStamp}:R>`)
                        .setImage(currentLevel.imageUrl)
                        .setColor(THEME_COLOR);

                    let roundMsg = await message.channel.send({ embeds: [guessEmbed] });

                    let roundGuesses = new Map();
                    let filter = m => playersMap.has(m.author.id) && !m.author.bot;
                    let chatCollector = message.channel.createMessageCollector({ filter, time: roundTimeSeconds * 1000 });

                    chatCollector.on('collect', m => {
                        let userAns = cleanArabic(m.content);
                        let matchedCountryKey = Object.keys(countryCoords).find(c => cleanArabic(c) === userAns || userAns.includes(cleanArabic(c)));
                        
                        if (matchedCountryKey && !roundGuesses.has(m.author.id)) {
                            roundGuesses.set(m.author.id, {
                                userId: m.author.id,
                                countryGuessed: matchedCountryKey,
                                coords: countryCoords[matchedCountryKey]
                            });
                            m.react('✅').catch(() => {});
                        }
                    });

                    await new Promise(resolve => {
                        chatCollector.on('end', () => resolve());
                    });

                    // حساب النقاط لهذه الجولة
                    let roundSummary = `🏁 **نتائج الجولة ${round} من 6**\nالبلد الصحيح: **${currentLevel.country}**\n\n`;
                    
                    if (roundGuesses.size === 0) {
                        roundSummary += '`لم يقم أي من المشاركين بتخمين البلد في هذه الجولة!`';
                    } else {
                        let scoredList = [];
                        for (let [uId, data] of roundGuesses.entries()) {
                            let distance = getDistanceFromLatLonInKm(
                                currentLevel.lat, currentLevel.lon,
                                data.coords.lat, data.coords.lon
                            );
                            scoredList.push({ userId: uId, distance: distance, country: data.countryGuessed });
                        }

                        scoredList.sort((a, b) => a.distance - b.distance);

                        let rewardPoints = [50, 40, 30, 20, 10];
                        scoredList.forEach((item, index) => {
                            let points = rewardPoints[index] || 5;
                            if (item.distance > 4000 && index > 1) {
                                roundSummary += `• <@${item.userId}> اختر (${item.country}) - بعيد جداً (0 نقاط)\n`;
                            } else {
                                let pObj = playersMap.get(item.userId);
                                if (pObj) pObj.score += points;
                                roundSummary += `• <@${item.userId}> اختر (${item.country}) - المسافة ~${Math.round(item.distance)} كم ➔ **+${points} نقطة**\n`;
                            }
                        });
                    }

                    const roundEmbed = new EmbedBuilder()
                        .setTitle(`◆ حصيلة الجولة ${round}`)
                        .setDescription(roundSummary)
                        .setColor(THEME_COLOR);

                    await message.channel.send({ embeds: [roundEmbed] });
                    await new Promise(res => setTimeout(res, 3000)); // استراحة قصيرة بين الجولات
                }

                // نهاية الـ 6 جولات واعلان الترتيب النهائي
                let finalPlayersArr = Array.from(playersMap.values());
                finalPlayersArr.sort((a, b) => b.score - a.score);

                let finalDesc = `🏆 **انتهت الـ 6 جولات بنجاح! إليكم الترتيب النهائي والمجموع الكلي للنقاط:**\n\n`;
                finalPlayersArr.forEach((p, idx) => {
                    let medal = idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🔹';
                    finalDesc += `${medal} **${p.name}**: \`${p.score} نقطة\`\n`;
                });

                let winner = finalPlayersArr[0];
                if (winner && winner.score > 0) {
                    finalDesc += `\n🎉 **الفائز بالمركز الأول بجدارة هو <@${winner.id}> برصيد ${winner.score} نقطة!**`;
                } else {
                    finalDesc += `\n◆ انتهت اللعبة بدون جمع نقاط كافية.`;
                }

                const finalEmbed = new EmbedBuilder()
                    .setTitle('◆ لوحة الشرف النهائية - تخمين البلد')
                    .setDescription(finalDesc)
                    .setColor(THEME_COLOR);

                await message.channel.send({ embeds: [finalEmbed] });

            } catch (error) {
                console.error(error);
            } finally {
                activeGames.delete(guildId);
            }
        });
    }
});

client.login(process.env.DISCORD_TOKEN);
