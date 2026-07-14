const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, PermissionsBitField, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const express = require('express');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

// ========== سيرفر الويب (لإبقاء البوت نشطاً على Railway) ==========
app.get('/', (req, res) => res.send('🟢 Bot is online'));
app.listen(port, () => console.log(`✅ Web server on port ${port}`));

// ========== قراءة التوكن من المتغيرات البيئية ==========
const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) {
    console.error('❌ DISCORD_TOKEN غير موجود في المتغيرات البيئية.');
    process.exit(1);
}

// ========== قاعدة البيانات (تُحفظ في ملف) ==========
const db = {
    config: {},
    currency: {},
    nameCooldown: {},
    warns: {},
    messageCounter: {},
    voiceTimers: {}
};

function saveDB() {
    try { fs.writeFileSync('./database.json', JSON.stringify(db, null, 2)); } catch (e) {}
}
function loadDB() {
    try { const data = fs.readFileSync('./database.json', 'utf8'); Object.assign(db, JSON.parse(data)); } catch (e) {}
}
loadDB();
setInterval(saveDB, 60000);

function getGuildConfig(guildId) {
    if (!db.config[guildId]) {
        db.config[guildId] = {
            logChannel: null,
            welcomeChannel: null,
            ticketParent: null,
            muteRole: null,
            joinRole: null,
            warnMuteThreshold: 3,
            warnKickThreshold: 5,
            welcomeMessage: 'أهلاً بك في السيرفر! 🎉',
            welcomeImage: null
        };
    }
    return db.config[guildId];
}

function updateGuildConfig(guildId, data) {
    db.config[guildId] = { ...getGuildConfig(guildId), ...data };
}

function getCurrency(userId) { return db.currency[userId] || 0; }
function addCurrency(userId, amount) { db.currency[userId] = (db.currency[userId] || 0) + amount; return db.currency[userId]; }
function getWarns(userId, guildId) { return db.warns[`${guildId}-${userId}`] || []; }
function addWarn(userId, guildId, reason, moderator) {
    const key = `${guildId}-${userId}`;
    if (!db.warns[key]) db.warns[key] = [];
    db.warns[key].push({ reason, moderator, date: new Date().toISOString() });
    return db.warns[key].length;
}
function clearWarns(userId, guildId) { db.warns[`${guildId}-${userId}`] = []; }

// ========== العميل ==========
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions
    ]
});

client.once('ready', () => {
    console.log(`✅ البوت جاهز باسم ${client.user.tag}`);
    client.user.setActivity('!مساعدة', { type: 'WATCHING' });
});

// ========== نظام اللوق ==========
async function logToChannel(guildId, embedData) {
    const config = getGuildConfig(guildId);
    if (!config.logChannel) return;
    const channel = client.channels.cache.get(config.logChannel);
    if (!channel) return;
    const embed = new EmbedBuilder()
        .setColor(embedData.color || 0x2b2d31)
        .setTitle(embedData.title || '📋 سجل')
        .setDescription(embedData.description || '')
        .setTimestamp()
        .setFooter({ text: embedData.footer || '' });
    if (embedData.fields) {
        for (const field of embedData.fields) {
            embed.addFields(field);
        }
    }
    await channel.send({ embeds: [embed] }).catch(() => {});
}

// ========== نظام الترحيب ==========
client.on('guildMemberAdd', async (member) => {
    const config = getGuildConfig(member.guild.id);
    if (!config.welcomeChannel) return;
    const channel = member.guild.channels.cache.get(config.welcomeChannel);
    if (!channel) return;
    const embed = new EmbedBuilder()
        .setTitle('👋 مرحباً!')
        .setDescription(config.welcomeMessage || `أهلاً ${member} في السيرفر!`)
        .setColor(0x2b2d31)
        .setTimestamp(member.joinedAt)
        .setThumbnail(member.user.displayAvatarURL());
    if (config.welcomeImage) embed.setImage(config.welcomeImage);
    await channel.send({ content: `${member}`, embeds: [embed] }).catch(() => {});
    if (config.joinRole) {
        const role = member.guild.roles.cache.get(config.joinRole);
        if (role) await member.roles.add(role).catch(() => {});
    }
    await logToChannel(member.guild.id, {
        title: '👤 عضو جديد',
        description: `**${member.user.tag}** انضم إلى السيرفر.`,
        color: 0x00ff00,
        fields: [{ name: 'عدد الأعضاء', value: `${member.guild.memberCount}`, inline: true }]
    });
});

// ========== نظام العملة (رسائل + فويس) ==========
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    const userId = message.author.id;
    db.messageCounter[userId] = (db.messageCounter[userId] || 0) + 1;
    if (db.messageCounter[userId] % 30 === 0) {
        const newBal = addCurrency(userId, 15);
        try { await message.author.send(`🌟 حصلت على 15 عملة! رصيدك: ${newBal}`); } catch (e) {}
    }
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    const userId = newState.member.id;
    const guildId = newState.guild.id;
    const key = `${guildId}-${userId}`;
    if (!oldState.channelId && newState.channelId) {
        const interval = setInterval(() => {
            const newBal = addCurrency(userId, 1);
            try { newState.member.send(`🔊 +1 عملة (فويس). رصيدك: ${newBal}`); } catch (e) {}
        }, 60000);
        db.voiceTimers[key] = interval;
    } else if (oldState.channelId && !newState.channelId) {
        if (db.voiceTimers[key]) { clearInterval(db.voiceTimers[key]); delete db.voiceTimers[key]; }
    }
});

// ========== أوامر البوت ==========
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    if (!message.content.startsWith('!')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();
    const guildId = message.guild.id;

    // ========== أمر المساعدة ==========
    if (cmd === 'مساعدة') {
        const embed = new EmbedBuilder()
            .setTitle('📖 قائمة الأوامر')
            .setColor(0x2b2d31)
            .addFields(
                { name: '🛡️ الإدارة', value: '`حظر` `طرد` `كتم` `فك_كتم` `تحذير` `مسح` `قفل` `فتح`', inline: false },
                { name: '⚙️ الإعدادات', value: '`تعيين سجلات #قناة` `تعيين ترحيب #قناة` `تعيين رسالة_ترحيب نص` `تعيين صورة_ترحيب رابط` `تعيين دور_كتم @دور` `تعيين دور_دخول @دور` `تعيين حد_كتم عدد` `تعيين حد_طرد عدد`', inline: false },
                { name: '💰 العملة', value: '`رصيد` `شراء_og`', inline: false },
                { name: '🎫 التذاكر', value: '`بانل` (للمشرفين) – ينشئ لوحة التذاكر', inline: false },
                { name: '🎮 عامة', value: '`بينق` `سيرفر`', inline: false }
            )
            .setFooter({ text: `البادئة: !` });
        await message.channel.send({ embeds: [embed] });
        return;
    }

    // ========== أوامر الإدارة ==========
    if (cmd === 'حظر') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return message.reply('❌ لا تملك صلاحية.');
        const member = message.mentions.members.first();
        if (!member) return message.reply('⚠️ منشن العضو.');
        const reason = args.join(' ') || 'لا يوجد سبب';
        await member.ban({ reason });
        const embed = new EmbedBuilder().setTitle('✅ تم الحظر').setColor(0xff0000).setDescription(`${member.user.tag} تم حظره بسبب: ${reason}`);
        await message.channel.send({ embeds: [embed] });
        await logToChannel(guildId, {
            title: '🔨 حظر',
            description: `**المنفذ:** ${message.author}\n**المستهدف:** ${member.user.tag}\n**السبب:** ${reason}`,
            color: 0xff0000
        });
    }

    else if (cmd === 'طرد') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return message.reply('❌ لا تملك صلاحية.');
        const member = message.mentions.members.first();
        if (!member) return message.reply('⚠️ منشن العضو.');
        const reason = args.join(' ') || 'لا يوجد سبب';
        await member.kick(reason);
        const embed = new EmbedBuilder().setTitle('✅ تم الطرد').setColor(0xff8800).setDescription(`${member.user.tag} تم طرده بسبب: ${reason}`);
        await message.channel.send({ embeds: [embed] });
        await logToChannel(guildId, {
            title: '🚪 طرد',
            description: `**المنفذ:** ${message.author}\n**المستهدف:** ${member.user.tag}\n**السبب:** ${reason}`,
            color: 0xff8800
        });
    }

    else if (cmd === 'كتم') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) return message.reply('❌ لا تملك صلاحية.');
        const member = message.mentions.members.first();
        if (!member) return message.reply('⚠️ منشن العضو.');
        const reason = args.join(' ') || 'لا يوجد سبب';
        const config = getGuildConfig(guildId);
        let muteRole = config.muteRole ? message.guild.roles.cache.get(config.muteRole) : null;
        if (!muteRole) {
            muteRole = message.guild.roles.cache.find(r => r.name === 'Muted');
            if (!muteRole) {
                muteRole = await message.guild.roles.create({ name: 'Muted', permissions: [] });
                message.guild.channels.cache.forEach(ch => {
                    ch.permissionOverwrites.create(muteRole, { SendMessages: false }).catch(() => {});
                });
                updateGuildConfig(guildId, { muteRole: muteRole.id });
            }
        }
        await member.roles.add(muteRole, reason);
        const embed = new EmbedBuilder().setTitle('🔇 تم الكتم').setColor(0xffaa00).setDescription(`${member.user.tag} تم كتمه بسبب: ${reason}`);
        await message.channel.send({ embeds: [embed] });
        await logToChannel(guildId, {
            title: '🔇 كتم',
            description: `**المنفذ:** ${message.author}\n**المستهدف:** ${member.user.tag}\n**السبب:** ${reason}`,
            color: 0xffaa00
        });
    }

    else if (cmd === 'فك_كتم') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) return message.reply('❌ لا تملك صلاحية.');
        const member = message.mentions.members.first();
        if (!member) return message.reply('⚠️ منشن العضو.');
        const config = getGuildConfig(guildId);
        let muteRole = config.muteRole ? message.guild.roles.cache.get(config.muteRole) : null;
        if (!muteRole) {
            muteRole = message.guild.roles.cache.find(r => r.name === 'Muted');
            if (!muteRole) return message.reply('⚠️ لا يوجد دور كتم.');
        }
        await member.roles.remove(muteRole);
        await message.reply(`🔊 تم فك الكتم عن ${member.user.tag}`);
        await logToChannel(guildId, {
            title: '🔊 فك كتم',
            description: `**المنفذ:** ${message.author}\n**المستهدف:** ${member.user.tag}`,
            color: 0x00ff00
        });
    }

    else if (cmd === 'تحذير') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return message.reply('❌ لا تملك صلاحية.');
        const member = message.mentions.members.first();
        if (!member) return message.reply('⚠️ منشن العضو.');
        const reason = args.join(' ') || 'لا يوجد سبب';
        const count = addWarn(member.id, guildId, reason, message.author.id);
        await message.reply(`⚠️ تم تحذير ${member.user.tag} بسبب: ${reason} (إجمالي التحذيرات: ${count})`);
        try { await member.send(`⚠️ تم تحذيرك في ${message.guild.name} بسبب: ${reason}`); } catch (e) {}
        await logToChannel(guildId, {
            title: '⚠️ تحذير',
            description: `**المنفذ:** ${message.author}\n**المستهدف:** ${member.user.tag}\n**السبب:** ${reason}\n**إجمالي التحذيرات:** ${count}`,
            color: 0xffdd00
        });
        const config = getGuildConfig(guildId);
        if (count >= config.warnKickThreshold) {
            await member.kick('تجاوز حد التحذيرات');
            await message.channel.send(`🚫 ${member.user.tag} تم طرده تلقائياً (تجاوز حد التحذيرات).`);
        } else if (count >= config.warnMuteThreshold) {
            const muteRole = config.muteRole ? message.guild.roles.cache.get(config.muteRole) : null;
            if (muteRole) {
                await member.roles.add(muteRole, 'تجاوز حد التحذيرات');
                await message.channel.send(`🔇 ${member.user.tag} تم كتمه تلقائياً (تجاوز حد التحذيرات).`);
            }
        }
    }

    else if (cmd === 'مسح') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return message.reply('❌ لا تملك صلاحية.');
        let amount = parseInt(args[0]) || 5;
        if (amount > 100) amount = 100;
        const deleted = await message.channel.bulkDelete(amount, true).catch(() => {});
        const count = deleted ? deleted.size : 0;
        const msg = await message.channel.send(`🗑️ تم مسح ${count} رسالة.`);
        setTimeout(() => msg.delete().catch(() => {}), 5000);
        await logToChannel(guildId, {
            title: '🗑️ مسح',
            description: `**المنفذ:** ${message.author}\n**القناة:** ${message.channel.name}\n**عدد الرسائل:** ${count}`,
            color: 0x00ccff
        });
    }

    else if (cmd === 'قفل') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return message.reply('❌ لا تملك صلاحية.');
        await message.channel.permissionOverwrites.create(message.guild.id, { SendMessages: false });
        await message.reply('🔒 تم قفل القناة.');
        await logToChannel(guildId, {
            title: '🔒 قفل قناة',
            description: `**المنفذ:** ${message.author}\n**القناة:** ${message.channel.name}`,
            color: 0xff0000
        });
    }

    else if (cmd === 'فتح') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return message.reply('❌ لا تملك صلاحية.');
        await message.channel.permissionOverwrites.delete(message.guild.id);
        await message.reply('🔓 تم فتح القناة.');
        await logToChannel(guildId, {
            title: '🔓 فتح قناة',
            description: `**المنفذ:** ${message.author}\n**القناة:** ${message.channel.name}`,
            color: 0x00ff00
        });
    }

    // ========== أوامر الإعدادات ==========
    else if (cmd === 'تعيين') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply('❌ تحتاج صلاحية أدمن.');
        const sub = args[0]?.toLowerCase();
        const value = args.slice(1).join(' ');
        const config = getGuildConfig(guildId);

        if (!sub) {
            const embed = new EmbedBuilder()
                .setTitle('⚙️ أوامر الإعدادات')
                .setColor(0x2b2d31)
                .addFields(
                    { name: '📋 السجلات', value: '`!تعيين سجلات #قناة`' },
                    { name: '👋 الترحيب', value: '`!تعيين ترحيب #قناة`\n`!تعيين رسالة_ترحيب النص`\n`!تعيين صورة_ترحيب رابط`' },
                    { name: '🔇 دور الكتم', value: '`!تعيين دور_كتم @دور`' },
                    { name: '🚪 دور الدخول', value: '`!تعيين دور_دخول @دور`' },
                    { name: '⚠️ حدود التحذيرات', value: '`!تعيين حد_كتم عدد`\n`!تعيين حد_طرد عدد`' }
                )
                .setFooter({ text: 'كل الإعدادات تُطبق على هذا السيرفر فقط.' });
            await message.channel.send({ embeds: [embed] });
            return;
        }

        if (sub === 'سجلات') {
            const channel = message.mentions.channels.first();
            if (!channel) return message.reply('⚠️ منشن القناة.');
            updateGuildConfig(guildId, { logChannel: channel.id });
            await message.reply(`✅ تم تعيين قناة السجلات إلى ${channel}`);
        } else if (sub === 'ترحيب') {
            const channel = message.mentions.channels.first();
            if (!channel) return message.reply('⚠️ منشن القناة.');
            updateGuildConfig(guildId, { welcomeChannel: channel.id });
            await message.reply(`✅ تم تعيين قناة الترحيب إلى ${channel}`);
        } else if (sub === 'رسالة_ترحيب') {
            if (!value) return message.reply('⚠️ أدخل النص.');
            updateGuildConfig(guildId, { welcomeMessage: value });
            await message.reply(`✅ تم تعيين رسالة الترحيب: ${value}`);
        } else if (sub === 'صورة_ترحيب') {
            if (!value) return message.reply('⚠️ أدخل رابط الصورة.');
            updateGuildConfig(guildId, { welcomeImage: value });
            await message.reply(`✅ تم تعيين صورة الترحيب: ${value}`);
        } else if (sub === 'دور_كتم') {
            const role = message.mentions.roles.first();
            if (!role) return message.reply('⚠️ منشن الدور.');
            updateGuildConfig(guildId, { muteRole: role.id });
            await message.reply(`✅ تم تعيين دور الكتم إلى ${role}`);
        } else if (sub === 'دور_دخول') {
            const role = message.mentions.roles.first();
            if (!role) return message.reply('⚠️ منشن الدور.');
            updateGuildConfig(guildId, { joinRole: role.id });
            await message.reply(`✅ تم تعيين دور الدخول إلى ${role}`);
        } else if (sub === 'حد_كتم') {
            const num = parseInt(value);
            if (isNaN(num) || num < 1) return message.reply('⚠️ أدخل عدداً صحيحاً أكبر من 0.');
            updateGuildConfig(guildId, { warnMuteThreshold: num });
            await message.reply(`✅ تم تعيين حد الكتم إلى ${num} تحذيرات.`);
        } else if (sub === 'حد_طرد') {
            const num = parseInt(value);
            if (isNaN(num) || num < 1) return message.reply('⚠️ أدخل عدداً صحيحاً أكبر من 0.');
            updateGuildConfig(guildId, { warnKickThreshold: num });
            await message.reply(`✅ تم تعيين حد الطرد إلى ${num} تحذيرات.`);
        } else {
            await message.reply('⚠️ أمر غير معروف. استخدم `!تعيين` لعرض القائمة.');
        }
    }

    // ========== أوامر العملة ==========
    else if (cmd === 'رصيد') {
        const member = message.mentions.members.first() || message.member;
        const bal = getCurrency(member.id);
        await message.reply(`💰 رصيد ${member.user.username}: ${bal} عملة.`);
    }

    else if (cmd === 'شراء_og') {
        const bal = getCurrency(message.author.id);
        if (bal < 10000) return message.reply(`⚠️ رصيدك غير كافٍ. تحتاج 10,000 عملة.`);
        db.currency[message.author.id] = bal - 10000;
        const role = message.guild.roles.cache.find(r => r.name === 'OG');
        if (!role) return message.reply('❌ رتبة OG غير موجودة.');
        await message.member.roles.add(role);
        await message.reply(`✅ تم شراء رتبة OG! رصيدك المتبقي: ${db.currency[message.author.id]}`);
    }

    // ========== أمر بانل (لوحة التذاكر) ==========
    else if (cmd === 'بانل') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply('❌ تحتاج صلاحية أدمن.');
        const embed = new EmbedBuilder()
            .setTitle('🎫 نظام التذاكر')
            .setDescription('اختر القسم المناسب من القائمة المنسدلة أدناه لإنشاء تذكرة.')
            .setColor(0x2b2d31)
            .setFooter({ text: 'سيتم إنشاء قناة خاصة بك وسيرد عليك الفريق.' });
        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('ticket_menu')
                    .setPlaceholder('📌 اختر القسم...')
                    .addOptions([
                        { label: '💻 دعم فني', value: 'دعم فني', emoji: '🛠️' },
                        { label: '📢 شكوى', value: 'شكوى', emoji: '⚠️' },
                        { label: '🎮 دعم ألعاب', value: 'دعم ألعاب', emoji: '🎮' },
                        { label: '📩 اقتراح', value: 'اقتراح', emoji: '💡' },
                        { label: '📌 أخرى', value: 'أخرى', emoji: '📂' }
                    ])
            );
        await message.channel.send({ embeds: [embed], components: [row] });
        await message.reply('✅ تم إنشاء لوحة التذاكر.');
    }

    // ========== أوامر عامة ==========
    else if (cmd === 'بينق') {
        await message.reply(`🏓 البينق: ${client.ws.ping}ms`);
    }

    else if (cmd === 'سيرفر') {
        const embed = new EmbedBuilder()
            .setTitle(message.guild.name)
            .setColor(0x2b2d31)
            .addFields(
                { name: '👥 الأعضاء', value: `${message.guild.memberCount}`, inline: true },
                { name: '💬 القنوات', value: `${message.guild.channels.cache.size}`, inline: true },
                { name: '👑 المالك', value: `<@${message.guild.ownerId}>`, inline: true }
            )
            .setThumbnail(message.guild.iconURL());
        await message.channel.send({ embeds: [embed] });
    }
});

// ========== معالج التفاعلات ==========
client.on('interactionCreate', async (interaction) => {
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_menu') {
        await interaction.deferReply({ ephemeral: true });
        const selected = interaction.values[0];
        const guild = interaction.guild;
        const member = interaction.member;

        const ticketName = `تذكرة-${member.user.username}`.slice(0, 32);
        try {
            const channel = await guild.channels.create({
                name: ticketName,
                type: ChannelType.GuildText,
                parent: null,
                permissionOverwrites: [
                    { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: member.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
                    { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }
                ]
            });

            const embed = new EmbedBuilder()
                .setTitle(`🎫 تذكرة - ${selected}`)
                .setDescription(`مرحباً ${member}!\nالقسم: **${selected}**\nيرجى شرح مشكلتك، سيرد عليك فريق الدعم قريباً.`)
                .setColor(0x2b2d31)
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel('🔒 إغلاق التذكرة')
                        .setStyle(ButtonStyle.Secondary)
                );

            await channel.send({ content: `${member}`, embeds: [embed], components: [row] });
            await interaction.editReply({ content: `✅ تم إنشاء تذكرتك: ${channel}`, ephemeral: true });
        } catch (error) {
            await interaction.editReply({ content: '❌ حدث خطأ في إنشاء التذكرة.', ephemeral: true });
        }
    }

    if (interaction.isButton()) {
        const buttonId = interaction.customId;

        if (['role_game', 'role_event', 'role_ajr'].includes(buttonId)) {
            const roleMap = {
                'role_game': 'Game Notice',
                'role_event': 'Event Notice',
                'role_ajr': 'Ajr Notice'
            };
            const roleName = roleMap[buttonId];
            const role = interaction.guild.roles.cache.find(r => r.name === roleName);
            if (!role) return interaction.reply({ content: `❌ رتبة "${roleName}" غير موجودة.`, ephemeral: true });
            const member = interaction.member;
            if (member.roles.cache.has(role.id)) {
                await member.roles.remove(role);
                await interaction.reply({ content: `✅ تم إزالة رتبة ${roleName}.`, ephemeral: true });
            } else {
                await member.roles.add(role);
                await interaction.reply({ content: `✅ تم منحك رتبة ${roleName}.`, ephemeral: true });
            }
        }

        else if (buttonId === 'change_name') {
            const userId = interaction.user.id;
            const last = db.nameCooldown[userId];
            if (last && (Date.now() - last) < 5 * 60 * 60 * 1000) {
                const remaining = Math.ceil((5 * 60 * 60 * 1000 - (Date.now() - last)) / (60 * 60 * 1000));
                return interaction.reply({ content: `⏳ يمكنك تغيير اسمك بعد ${remaining} ساعة.`, ephemeral: true });
            }
            const modal = new ModalBuilder()
                .setCustomId('name_change_modal')
                .setTitle('تغيير الاسم')
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('new_name')
                            .setLabel('الاسم الجديد')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    )
                );
            await interaction.showModal(modal);
        }

        else if (buttonId === 'close_ticket') {
            const channel = interaction.channel;
            if (!channel.name.startsWith('تذكرة-')) return interaction.reply({ content: '⚠️ هذه ليست قناة تذكرة.', ephemeral: true });
            await interaction.reply({ content: '🔒 جاري إغلاق التذكرة...', ephemeral: true });
            setTimeout(async () => { await channel.delete(); }, 3000);
        }
    }

    if (interaction.isModalSubmit() && interaction.customId === 'name_change_modal') {
        const newName = interaction.fields.getTextInputValue('new_name');
        if (newName.length < 2 || newName.length > 32) {
            return interaction.reply({ content: '⚠️ الاسم يجب أن يكون بين 2 و 32 حرفاً.', ephemeral: true });
        }
        try {
            await interaction.member.setNickname(newName);
            db.nameCooldown[interaction.user.id] = Date.now();
            await interaction.reply({ content: `✅ تم تغيير اسمك إلى **${newName}**`, ephemeral: true });
        } catch (error) {
            await interaction.reply({ content: '❌ لا أملك صلاحية تغيير اسمك.', ephemeral: true });
        }
    }
});

// ========== تشغيل البوت ==========
client.login(TOKEN).catch(err => {
    console.error('❌ فشل تسجيل الدخول:', err);
    process.exit(1);
});
