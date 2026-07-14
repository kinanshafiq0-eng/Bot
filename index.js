const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  PermissionsBitField,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const express = require('express');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

// ========== سيرفر الويب ==========
app.get('/', (req, res) => res.send('🟢 Bot is online'));
app.listen(port, () => console.log(`✅ Web server on port ${port}`));

// ========== قراءة التوكن ==========
const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) {
  console.error('❌ DISCORD_TOKEN غير موجود');
  process.exit(1);
}

// ========== قاعدة البيانات ==========
const db = {
  config: {},
  nameCooldown: {},
  memberCount: {},
  ticketSettings: {},
  warns: {},
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
      muteRole: null,
      joinRole: null,
      ticketPanelImage: null,
      rolesImage: null,
      bannerImage: null,
      generalImage: null,
    };
  }
  return db.config[guildId];
}

function updateGuildConfig(guildId, data) {
  db.config[guildId] = { ...getGuildConfig(guildId), ...data };
}

function getTicketSettings(guildId) {
  if (!db.ticketSettings[guildId]) {
    db.ticketSettings[guildId] = {
      sections: [
        { name: 'دعم فني', roleId: null, emoji: '🛠️' },
        { name: 'شكوى', roleId: null, emoji: '⚠️' },
        { name: 'اقتراح', roleId: null, emoji: '💡' },
        { name: 'أخرى', roleId: null, emoji: '📂' },
      ],
      text: 'مرحباً بكم جميعاً في قسم التذاكر، لفتح تذكرة أرجو ضغط على قائمة أدناه و اختيار التذكرة التي تناسبك.',
      image: 'https://i.imgur.com/GkKqN3G.png',
    };
  }
  return db.ticketSettings[guildId];
}

function saveTicketSettings(guildId, data) {
  db.ticketSettings[guildId] = data;
}

function getWarns(userId, guildId) {
  const key = `${guildId}-${userId}`;
  return db.warns[key] || [];
}

function addWarn(userId, guildId, reason, moderator) {
  const key = `${guildId}-${userId}`;
  if (!db.warns[key]) db.warns[key] = [];
  db.warns[key].push({ reason, moderator, date: new Date().toISOString() });
  return db.warns[key].length;
}

function clearWarns(userId, guildId) {
  const key = `${guildId}-${userId}`;
  db.warns[key] = [];
}

// ========== العميل ==========
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

client.once('ready', () => {
  console.log(`✅ البوت جاهز باسم ${client.user.tag}`);
  client.user.setActivity('!مساعدة', { type: 'WATCHING' });
});

// ========== دالة لجلب الصورة العامة ==========
function getGeneralImage(guild, config) {
  if (config.generalImage) return config.generalImage;
  if (config.bannerImage) return config.bannerImage;
  if (guild.iconURL()) return guild.iconURL({ size: 1024 });
  return null;
}

// ========== نظام الترحيب بالصور ==========
async function generateWelcomeImage(member, memberCount) {
  const canvas = createCanvas(1200, 600);
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(0.5, '#16213e');
  gradient.addColorStop(1, '#0f3460');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#e94560';
  ctx.lineWidth = 10;
  ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

  const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
  const avatar = await loadImage(avatarURL);
  const radius = 150;
  const centerX = 250;
  const centerY = 300;
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, centerX - radius, centerY - radius, radius * 2, radius * 2);
  ctx.restore();

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = '#e94560';
  ctx.lineWidth = 8;
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 48px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`مرحباً ${member.user.username}`, 450, 200);

  ctx.font = '32px Arial';
  ctx.fillStyle = '#aaaaaa';
  ctx.fillText(`#${memberCount}`, 450, 280);

  ctx.font = '24px Arial';
  ctx.fillStyle = '#888888';
  ctx.fillText('أهلاً بك في السيرفر!', 450, 360);

  ctx.textAlign = 'right';
  ctx.font = '20px Arial';
  ctx.fillStyle = '#e94560';
  ctx.fillText('TEAM WOLF', canvas.width - 50, canvas.height - 40);

  return canvas.toBuffer('image/png');
}

client.on('guildMemberAdd', async (member) => {
  const config = getGuildConfig(member.guild.id);
  if (!config.welcomeChannel) return;
  const channel = member.guild.channels.cache.get(config.welcomeChannel);
  if (!channel) return;

  const memberCount = member.guild.memberCount;
  db.memberCount[member.guild.id] = memberCount;
  const imageBuffer = await generateWelcomeImage(member, memberCount);

  const generalImage = getGeneralImage(member.guild, config);
  const embed = new EmbedBuilder()
    .setTitle('🐱 Welcome To TEAM WOLF Community')
    .setDescription(`User: ${member}\nmember count: ${memberCount}`)
    .setColor(0x2b2d31)
    .setImage('attachment://welcome.png')
    .setTimestamp();

  if (generalImage) embed.setThumbnail(generalImage);

  await channel.send({
    content: `${member}`,
    embeds: [embed],
    files: [{ attachment: imageBuffer, name: 'welcome.png' }]
  });

  if (config.joinRole) {
    const role = member.guild.roles.cache.get(config.joinRole);
    if (role) await member.roles.add(role).catch(() => {});
  }
});

// ========== أوامر البوت ==========
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();
  const guildId = message.guild.id;
  const config = getGuildConfig(guildId);
  const generalImage = getGeneralImage(message.guild, config);
  const ticketSettings = getTicketSettings(guildId);

  // ========== أمر المساعدة (محدث) ==========
  if (cmd === 'مساعدة') {
    const embed = new EmbedBuilder()
      .setTitle('📖 قائمة الأوامر')
      .setColor(0x2b2d31)
      .addFields(
        { name: '🛡️ الإدارة الأساسية', value: '`حظر` `طرد` `كتم` `فك_كتم` `تحذير` `ابطال_تحذيرات` `مسح` `قفل` `فتح`', inline: false },
        { name: '🎭 إدارة الرتب', value: '`اعطاء_رتبة` `سحب_رتبة` `عرض_رتب`', inline: false },
        { name: '📁 إدارة القنوات', value: '`انشاء_قناة` `حذف_قناة` `تغيير_اسم_قناة`', inline: false },
        { name: '🔊 إدارة الصوت', value: '`نقل_كل` `طرد_صوتي` `كتم_صوتي` `فك_كتم_صوتي`', inline: false },
        { name: '📌 إدارة الرسائل', value: '`تثبيت` `الغاء_تثبيت`', inline: false },
        { name: '🎫 التذاكر', value: '`بانل` `عرض_تذكرة` `تعيين تذكرة` (للمشرفين)', inline: false },
        { name: '🔔 رتب الإشعارات', value: '`رتب` (للمشرفين)', inline: false },
        { name: '✏️ تغيير الاسم', value: '`تغيير_اسم`', inline: false },
        { name: 'ℹ️ معلومات', value: '`معلومات` `سيرفر` `بينق`', inline: false },
        { name: '⚙️ إعدادات', value: '`تعيين` (للمشرفين)', inline: false }
      )
      .setFooter({ text: `البادئة: ! | الثيم: أسود ورمادي` });
    if (generalImage) embed.setImage(generalImage);
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // ========== أوامر الإدارة الأساسية ==========

  // حظر
  if (cmd === 'حظر') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
      return message.reply('❌ لا تملك صلاحية حظر.');
    const member = message.mentions.members.first();
    if (!member) return message.reply('⚠️ منشن العضو.');
    const reason = args.join(' ') || 'لا يوجد سبب';
    await member.ban({ reason });
    const embed = new EmbedBuilder()
      .setTitle('✅ تم الحظر')
      .setColor(0x2b2d31)
      .setDescription(`${member.user.tag} تم حظره بسبب: ${reason}`);
    if (generalImage) embed.setImage(generalImage);
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // طرد
  if (cmd === 'طرد') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers))
      return message.reply('❌ لا تملك صلاحية طرد.');
    const member = message.mentions.members.first();
    if (!member) return message.reply('⚠️ منشن العضو.');
    const reason = args.join(' ') || 'لا يوجد سبب';
    await member.kick(reason);
    const embed = new EmbedBuilder()
      .setTitle('✅ تم الطرد')
      .setColor(0x2b2d31)
      .setDescription(`${member.user.tag} تم طرده بسبب: ${reason}`);
    if (generalImage) embed.setImage(generalImage);
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // كتم
  if (cmd === 'كتم') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles))
      return message.reply('❌ لا تملك صلاحية كتم.');
    const member = message.mentions.members.first();
    if (!member) return message.reply('⚠️ منشن العضو.');
    const reason = args.join(' ') || 'لا يوجد سبب';
    let muteRole = message.guild.roles.cache.find(r => r.name === 'Muted');
    if (!muteRole) {
      muteRole = await message.guild.roles.create({ name: 'Muted', permissions: [] });
      message.guild.channels.cache.forEach(ch => {
        ch.permissionOverwrites.create(muteRole, { SendMessages: false }).catch(() => {});
      });
    }
    await member.roles.add(muteRole, reason);
    const embed = new EmbedBuilder()
      .setTitle('🔇 تم الكتم')
      .setColor(0x2b2d31)
      .setDescription(`${member.user.tag} تم كتمه بسبب: ${reason}`);
    if (generalImage) embed.setImage(generalImage);
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // فك كتم
  if (cmd === 'فك_كتم') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles))
      return message.reply('❌ لا تملك صلاحية فك الكتم.');
    const member = message.mentions.members.first();
    if (!member) return message.reply('⚠️ منشن العضو.');
    const muteRole = message.guild.roles.cache.find(r => r.name === 'Muted');
    if (!muteRole) return message.reply('⚠️ لا يوجد دور Muted في السيرفر.');
    await member.roles.remove(muteRole);
    const embed = new EmbedBuilder()
      .setTitle('🔊 تم فك الكتم')
      .setColor(0x2b2d31)
      .setDescription(`${member.user.tag} تم فك الكتم عنه.`);
    if (generalImage) embed.setImage(generalImage);
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // تحذير
  if (cmd === 'تحذير') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers))
      return message.reply('❌ لا تملك صلاحية تحذير.');
    const member = message.mentions.members.first();
    if (!member) return message.reply('⚠️ منشن العضو.');
    const reason = args.join(' ') || 'لا يوجد سبب';
    const count = addWarn(member.id, guildId, reason, message.author.id);
    const embed = new EmbedBuilder()
      .setTitle('⚠️ تحذير')
      .setColor(0x2b2d31)
      .setDescription(`${member.user.tag} تم تحذيره بسبب: ${reason}\nإجمالي التحذيرات: ${count}`);
    if (generalImage) embed.setImage(generalImage);
    await message.channel.send({ embeds: [embed] });
    try { await member.send(`⚠️ تم تحذيرك في ${message.guild.name} بسبب: ${reason}`); } catch (e) {}
    return;
  }

  // إبطال التحذيرات
  if (cmd === 'ابطال_تحذيرات') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers))
      return message.reply('❌ لا تملك صلاحية إبطال التحذيرات.');
    const member = message.mentions.members.first();
    if (!member) return message.reply('⚠️ منشن العضو.');
    clearWarns(member.id, guildId);
    const embed = new EmbedBuilder()
      .setTitle('✅ تم إبطال التحذيرات')
      .setColor(0x2b2d31)
      .setDescription(`تم إلغاء كل تحذيرات ${member.user.tag}.`);
    if (generalImage) embed.setImage(generalImage);
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // مسح
  if (cmd === 'مسح') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
      return message.reply('❌ لا تملك صلاحية مسح.');
    let amount = parseInt(args[0]) || 5;
    if (amount > 100) amount = 100;
    const deleted = await message.channel.bulkDelete(amount, true).catch(() => {});
    const count = deleted ? deleted.size : 0;
    const msg = await message.channel.send(`🗑️ تم مسح ${count} رسالة.`);
    setTimeout(() => msg.delete().catch(() => {}), 5000);
    return;
  }

  // قفل
  if (cmd === 'قفل') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
      return message.reply('❌ لا تملك صلاحية قفل.');
    await message.channel.permissionOverwrites.create(message.guild.id, { SendMessages: false });
    const embed = new EmbedBuilder()
      .setTitle('🔒 تم قفل القناة')
      .setColor(0x2b2d31)
      .setDescription(`تم قفل ${message.channel}`);
    if (generalImage) embed.setImage(generalImage);
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // فتح
  if (cmd === 'فتح') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
      return message.reply('❌ لا تملك صلاحية فتح.');
    await message.channel.permissionOverwrites.delete(message.guild.id);
    const embed = new EmbedBuilder()
      .setTitle('🔓 تم فتح القناة')
      .setColor(0x2b2d31)
      .setDescription(`تم فتح ${message.channel}`);
    if (generalImage) embed.setImage(generalImage);
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // ========== إدارة الرتب ==========

  // إعطاء رتبة
  if (cmd === 'اعطاء_رتبة') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles))
      return message.reply('❌ لا تملك صلاحية إدارة الرتب.');
    const member = message.mentions.members.first();
    if (!member) return message.reply('⚠️ منشن العضو.');
    const role = message.mentions.roles.first();
    if (!role) return message.reply('⚠️ منشن الرتبة.');
    if (role.position >= message.member.roles.highest.position && message.guild.ownerId !== message.author.id)
      return message.reply('❌ لا يمكنك إعطاء رتبة أعلى من رتبتك.');
    await member.roles.add(role);
    const embed = new EmbedBuilder()
      .setTitle('✅ تم إعطاء الرتبة')
      .setColor(0x2b2d31)
      .setDescription(`تم إعطاء ${member} رتبة ${role}`);
    if (generalImage) embed.setImage(generalImage);
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // سحب رتبة
  if (cmd === 'سحب_رتبة') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles))
      return message.reply('❌ لا تملك صلاحية إدارة الرتب.');
    const member = message.mentions.members.first();
    if (!member) return message.reply('⚠️ منشن العضو.');
    const role = message.mentions.roles.first();
    if (!role) return message.reply('⚠️ منشن الرتبة.');
    if (role.position >= message.member.roles.highest.position && message.guild.ownerId !== message.author.id)
      return message.reply('❌ لا يمكنك سحب رتبة أعلى من رتبتك.');
    await member.roles.remove(role);
    const embed = new EmbedBuilder()
      .setTitle('✅ تم سحب الرتبة')
      .setColor(0x2b2d31)
      .setDescription(`تم سحب رتبة ${role} من ${member}`);
    if (generalImage) embed.setImage(generalImage);
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // عرض رتب
  if (cmd === 'عرض_رتب') {
    const member = message.mentions.members.first() || message.member;
    const roles = member.roles.cache
      .filter(r => r.id !== message.guild.id)
      .map(r => r.toString())
      .join(' ') || 'لا يوجد رتب';
    const embed = new EmbedBuilder()
      .setTitle(`🎭 رتب ${member.user.username}`)
      .setColor(0x2b2d31)
      .setDescription(roles);
    if (generalImage) embed.setImage(generalImage);
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // ========== إدارة القنوات ==========

  // إنشاء قناة
  if (cmd === 'انشاء_قناة') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
      return message.reply('❌ لا تملك صلاحية إنشاء قنوات.');
    const name = args.join(' ');
    if (!name) return message.reply('⚠️ أدخل اسم القناة.');
    const channel = await message.guild.channels.create({ name, type: ChannelType.GuildText });
    const embed = new EmbedBuilder()
      .setTitle('✅ تم إنشاء القناة')
      .setColor(0x2b2d31)
      .setDescription(`تم إنشاء ${channel}`);
    if (generalImage) embed.setImage(generalImage);
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // حذف قناة
  if (cmd === 'حذف_قناة') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
      return message.reply('❌ لا تملك صلاحية حذف قنوات.');
    const channel = message.mentions.channels.first();
    if (!channel) return message.reply('⚠️ منشن القناة.');
    await channel.delete();
    const embed = new EmbedBuilder()
      .setTitle('🗑️ تم حذف القناة')
      .setColor(0x2b2d31)
      .setDescription(`تم حذف ${channel.name}`);
    if (generalImage) embed.setImage(generalImage);
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // تغيير اسم قناة
  if (cmd === 'تغيير_اسم_قناة') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
      return message.reply('❌ لا تملك صلاحية تغيير أسماء القنوات.');
    const channel = message.mentions.channels.first();
    if (!channel) return message.reply('⚠️ منشن القناة.');
    const newName = args.slice(1).join(' ');
    if (!newName) return message.reply('⚠️ أدخل الاسم الجديد.');
    await channel.setName(newName);
    const embed = new EmbedBuilder()
      .setTitle('✏️ تم تغيير اسم القناة')
      .setColor(0x2b2d31)
      .setDescription(`تم تغيير اسم القناة إلى ${newName}`);
    if (generalImage) embed.setImage(generalImage);
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // ========== إدارة الرسائل ==========

  // تثبيت رسالة
  if (cmd === 'تثبيت') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
      return message.reply('❌ لا تملك صلاحية تثبيت الرسائل.');
    const msgId = args[0];
    if (!msgId) return message.reply('⚠️ أدخل معرف الرسالة.');
    try {
      const msg = await message.channel.messages.fetch(msgId);
      await msg.pin();
      const embed = new EmbedBuilder()
        .setTitle('📌 تم تثبيت الرسالة')
        .setColor(0x2b2d31)
        .setDescription(`[رابط الرسالة](${msg.url})`);
      if (generalImage) embed.setImage(generalImage);
      await message.channel.send({ embeds: [embed] });
    } catch (e) {
      await message.reply('❌ حدث خطأ. تأكد من المعرف.');
    }
    return;
  }

  // إلغاء تثبيت رسالة
  if (cmd === 'الغاء_تثبيت') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
      return message.reply('❌ لا تملك صلاحية إلغاء تثبيت الرسائل.');
    const msgId = args[0];
    if (!msgId) return message.reply('⚠️ أدخل معرف الرسالة.');
    try {
      const msg = await message.channel.messages.fetch(msgId);
      await msg.unpin();
      const embed = new EmbedBuilder()
        .setTitle('📌 تم إلغاء تثبيت الرسالة')
        .setColor(0x2b2d31)
        .setDescription(`[رابط الرسالة](${msg.url})`);
      if (generalImage) embed.setImage(generalImage);
      await message.channel.send({ embeds: [embed] });
    } catch (e) {
      await message.reply('❌ حدث خطأ. تأكد من المعرف.');
    }
    return;
  }

  // ========== إدارة الصوت ==========

  // نقل كل الأعضاء من روم لآخر
  if (cmd === 'نقل_كل') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.MoveMembers))
      return message.reply('❌ لا تملك صلاحية نقل الأعضاء.');
    const from = message.mentions.channels.first();
    const to = message.mentions.channels.last();
    if (!from || !to || from.type !== ChannelType.GuildVoice || to.type !== ChannelType.GuildVoice)
      return message.reply('⚠️ منشن رومين صوتيين: `!نقل_كل #من #إلى`');
    const members = from.members.filter(m => !m.user.bot);
    let count = 0;
    for (const m of members) {
      await m.voice.setChannel(to).catch(() => {});
      count++;
    }
    const embed = new EmbedBuilder()
      .setTitle('🔊 تم نقل الأعضاء')
      .setColor(0x2b2d31)
      .setDescription(`تم نقل ${count} عضو من ${from} إلى ${to}`);
    if (generalImage) embed.setImage(generalImage);
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // طرد صوتي
  if (cmd === 'طرد_صوتي') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.MoveMembers))
      return message.reply('❌ لا تملك صلاحية طرد من الروم الصوتي.');
    const member = message.mentions.members.first();
    if (!member) return message.reply('⚠️ منشن العضو.');
    if (!member.voice.channel) return message.reply('⚠️ هذا العضو ليس في روم صوتي.');
    await member.voice.disconnect();
    const embed = new EmbedBuilder()
      .setTitle('🔊 تم طرد العضو من الصوت')
      .setColor(0x2b2d31)
      .setDescription(`تم طرد ${member.user.tag} من الروم الصوتي.`);
    if (generalImage) embed.setImage(generalImage);
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // كتم صوتي
  if (cmd === 'كتم_صوتي') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.MuteMembers))
      return message.reply('❌ لا تملك صلاحية كتم صوتي.');
    const member = message.mentions.members.first();
    if (!member) return message.reply('⚠️ منشن العضو.');
    if (!member.voice.channel) return message.reply('⚠️ هذا العضو ليس في روم صوتي.');
    await member.voice.setMute(true);
    const embed = new EmbedBuilder()
      .setTitle('🔇 تم الكتم الصوتي')
      .setColor(0x2b2d31)
      .setDescription(`تم كتم صوت ${member.user.tag} في الروم الصوتي.`);
    if (generalImage) embed.setImage(generalImage);
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // فك كتم صوتي
  if (cmd === 'فك_كتم_صوتي') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.MuteMembers))
      return message.reply('❌ لا تملك صلاحية فك الكتم الصوتي.');
    const member = message.mentions.members.first();
    if (!member) return message.reply('⚠️ منشن العضو.');
    if (!member.voice.channel) return message.reply('⚠️ هذا العضو ليس في روم صوتي.');
    await member.voice.setMute(false);
    const embed = new EmbedBuilder()
      .setTitle('🔊 تم فك الكتم الصوتي')
      .setColor(0x2b2d31)
      .setDescription(`تم فك كتم صوت ${member.user.tag} في الروم الصوتي.`);
    if (generalImage) embed.setImage(generalImage);
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // ========== معلومات ==========

  // معلومات العضو
  if (cmd === 'معلومات') {
    const member = message.mentions.members.first() || message.member;
    const embed = new EmbedBuilder()
      .setTitle(`ℹ️ معلومات ${member.user.username}`)
      .setColor(0x2b2d31)
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        { name: '🆔 المعرف', value: member.id, inline: true },
        { name: '📅 تاريخ الانضمام', value: member.joinedAt.toDateString(), inline: true },
        { name: '📅 تاريخ الحساب', value: member.user.createdAt.toDateString(), inline: true },
        { name: '🎭 أعلى رتبة', value: member.roles.highest.toString(), inline: true },
        { name: '🔊 في روم صوتي', value: member.voice.channel ? member.voice.channel.name : 'لا', inline: true }
      );
    if (generalImage) embed.setImage(generalImage);
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // ========== أوامر التذاكر والرتب وتغيير الاسم ==========
  // (هنا تأتي الأوامر السابقة: بانل، رتب، تغيير_اسم، عرض_تذكرة، تعيين تذكرة، تعيين، سيرفر، بينق)

  // ... (باقي الأوامر من الكود السابق)
  // سيتم تضمينها في الكود الكامل النهائي
});

// ========== معالج التفاعلات ==========
// ... (نفس الكود السابق)
// ========== تشغيل البوت ==========
client.login(TOKEN).catch((err) => {
  console.error('❌ فشل تسجيل الدخول:', err);
  process.exit(1);
});
