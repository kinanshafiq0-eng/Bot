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

// ========== دالة لجلب الصورة العامة (الثيم الداكن) ==========
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

  // ========== أمر المساعدة ==========
  if (cmd === 'مساعدة') {
    const embed = new EmbedBuilder()
      .setTitle('📖 قائمة الأوامر')
      .setColor(0x2b2d31)
      .addFields(
        { name: '🎫 التذاكر', value: '`!بانل` – إنشاء لوحة تذاكر\n`!عرض_تذكرة` – عرض الإعدادات\n`!تعيين تذكرة` – إدارة الأقسام (للمشرفين)', inline: false },
        { name: '🔔 رتب الإشعارات', value: '`!رتب` – عرض أزرار الرتب مع صورة (للمشرفين)', inline: false },
        { name: '✏️ تغيير الاسم', value: '`!تغيير_اسم` – فتح واجهة تغيير الاسم في السيرفر', inline: false },
        { name: '⚙️ الإعدادات', value: '`!تعيين ترحيب #قناة` `!تعيين دور_دخول @دور` `!تعيين صورة_بانل رابط` `!تعيين صورة_رتب رابط` `!تعيين صورة_بنر رابط` `!تعيين صورة_عامة رابط`', inline: false },
        { name: '🎮 عامة', value: '`!بينق` `!سيرفر`', inline: false }
      )
      .setFooter({ text: `البادئة: ! | الثيم: أسود ورمادي` });
    if (generalImage) embed.setImage(generalImage);
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // ========== عرض إعدادات التذاكر ==========
  if (cmd === 'عرض_تذكرة') {
    const settings = getTicketSettings(guildId);
    const embed = new EmbedBuilder()
      .setTitle('📋 إعدادات التذاكر')
      .setColor(0x2b2d31)
      .setDescription(`**النص:** ${settings.text}`)
      .addFields(
        { name: '📌 الأقسام', value: settings.sections.map((s, i) => 
          `${i+1}. ${s.emoji || '📌'} **${s.name}** ${s.roleId ? `<@&${s.roleId}>` : '(بدون دور)'}`
        ).join('\n') || 'لا يوجد أقسام', inline: false },
        { name: '🖼️ الصورة', value: settings.image ? `[رابط](${settings.image})` : 'لا توجد صورة', inline: true }
      )
      .setFooter({ text: 'استخدم !تعيين تذكرة لإدارة الأقسام' });
    if (generalImage) embed.setImage(generalImage);
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // ========== إدارة التذاكر (للمشرفين) ==========
  if (cmd === 'تعيين' && args[0]?.toLowerCase() === 'تذكرة') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply('❌ تحتاج صلاحية أدمن.');

    const sub = args[1]?.toLowerCase();
    const value = args.slice(2).join(' ');

    const settings = getTicketSettings(guildId);

    // عرض تعليمات
    if (!sub) {
      const embed = new EmbedBuilder()
        .setTitle('⚙️ إدارة التذاكر')
        .setColor(0x2b2d31)
        .addFields(
          { name: '➕ إضافة قسم', value: '`!تعيين تذكرة إضافة [الاسم] @دور :ايموجي:`' },
          { name: '🎨 تعيين إيموجي', value: '`!تعيين تذكرة تعيين_ايموجي [الاسم] :ايموجي:`' },
          { name: '➖ حذف قسم', value: '`!تعيين تذكرة حذف [الاسم]`' },
          { name: '📝 تغيير النص', value: '`!تعيين تذكرة نص [النص]`' },
          { name: '🖼️ تغيير الصورة', value: '`!تعيين تذكرة صورة [رابط]`' },
          { name: '👀 عرض الإعدادات', value: '`!عرض_تذكرة`' }
        )
        .setFooter({ text: 'الأقسام الحالية: ' + settings.sections.map(s => `${s.emoji || '📌'} ${s.name}`).join(', ') });
      if (generalImage) embed.setImage(generalImage);
      await message.channel.send({ embeds: [embed] });
      return;
    }

    // إضافة قسم
    if (sub === 'إضافة') {
      // محاولة استخراج الاسم، الرول، والإيموجي
      const parts = value.match(/^(.+?)\s+<@&(\d+)>\s*(\S+)?$/);
      if (!parts) return message.reply('⚠️ الصيغة: `!تعيين تذكرة إضافة [الاسم] @دور :ايموجي:` (الإيموجي اختياري)');
      const sectionName = parts[1].trim();
      const roleId = parts[2];
      const emoji = parts[3] || '📌';
      
      if (settings.sections.find(s => s.name === sectionName)) {
        return message.reply(`⚠️ قسم "${sectionName}" موجود بالفعل.`);
      }
      settings.sections.push({ name: sectionName, roleId, emoji });
      saveTicketSettings(guildId, settings);
      await message.reply(`✅ تم إضافة قسم **${sectionName}** مع دور <@&${roleId}> وإيموجي ${emoji}.`);
      return;
    }

    // تعيين إيموجي لقسم موجود
    if (sub === 'تعيين_ايموجي') {
      const parts = value.match(/^(.+?)\s+(\S+)$/);
      if (!parts) return message.reply('⚠️ الصيغة: `!تعيين تذكرة تعيين_ايموجي [الاسم] :ايموجي:`');
      const sectionName = parts[1].trim();
      const emoji = parts[2];
      const section = settings.sections.find(s => s.name === sectionName);
      if (!section) return message.reply(`⚠️ قسم "${sectionName}" غير موجود.`);
      section.emoji = emoji;
      saveTicketSettings(guildId, settings);
      await message.reply(`✅ تم تعيين الإيموجي ${emoji} لقسم **${sectionName}**.`);
      return;
    }

    // حذف قسم
    if (sub === 'حذف') {
      const sectionName = value.trim();
      const index = settings.sections.findIndex(s => s.name === sectionName);
      if (index === -1) return message.reply(`⚠️ قسم "${sectionName}" غير موجود.`);
      settings.sections.splice(index, 1);
      saveTicketSettings(guildId, settings);
      await message.reply(`✅ تم حذف قسم **${sectionName}**.`);
      return;
    }

    // تغيير النص
    if (sub === 'نص') {
      if (!value) return message.reply('⚠️ أدخل النص الجديد.');
      settings.text = value;
      saveTicketSettings(guildId, settings);
      await message.reply(`✅ تم تغيير نص التذاكر:\n${value}`);
      return;
    }

    // تغيير الصورة
    if (sub === 'صورة') {
      if (!value) return message.reply('⚠️ أدخل رابط الصورة.');
      settings.image = value;
      saveTicketSettings(guildId, settings);
      await message.reply(`✅ تم تغيير صورة التذاكر: ${value}`);
      return;
    }

    await message.reply('⚠️ أمر غير معروف. استخدم `!تعيين تذكرة` لعرض التعليمات.');
    return;
  }

  // ========== أمر بانل (التذاكر) ==========
  if (cmd === 'بانل') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply('❌ تحتاج صلاحية أدمن.');

    const settings = getTicketSettings(guildId);
    const imageUrl = settings.image || 'https://i.imgur.com/GkKqN3G.png';

    const embed = new EmbedBuilder()
      .setTitle('🎫 تذاكر دعم فني')
      .setDescription(settings.text)
      .setColor(0x2b2d31)
      .setImage(imageUrl)
      .setFooter({ text: 'سيتم إنشاء قناة خاصة بك وسيرد عليك الفريق.' });

    if (generalImage) embed.setThumbnail(generalImage);

    const options = settings.sections.map(s => ({
      label: s.name,
      value: s.name,
      emoji: s.emoji || '📌',
    }));

    if (options.length === 0) {
      return message.reply('⚠️ لا توجد أقسام مضافة. استخدم `!تعيين تذكرة إضافة` لإضافة قسم.');
    }

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('ticket_menu')
        .setPlaceholder('📌 اختر القسم...')
        .addOptions(options)
    );

    await message.channel.send({ embeds: [embed], components: [row] });
    await message.reply('✅ تم إنشاء لوحة التذاكر.');
  }

  // ========== أمر رتب الإشعارات ==========
  if (cmd === 'رتب') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply('❌ تحتاج صلاحية أدمن.');

    const defaultImage = 'https://i.imgur.com/7dXe7tM.png';
    const imageUrl = config.rolesImage || defaultImage;

    const embed = new EmbedBuilder()
      .setTitle('🔔 رتب الإشعارات')
      .setDescription('اختر الرتب التي تريد استلام إشعارات عنها من خلال الأزرار أدناه.')
      .setColor(0x2b2d31)
      .setImage(imageUrl)
      .setFooter({ text: 'اضغط مرة للحصول على الرتبة، ومرة أخرى لإزالتها.' });

    if (generalImage) embed.setThumbnail(generalImage);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('role_game').setLabel('🎮 Game Notice').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('role_event').setLabel('📅 Event Notice').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('role_ajr').setLabel('🔊 Ajr Notice').setStyle(ButtonStyle.Secondary),
    );

    await message.channel.send({ embeds: [embed], components: [row] });
    await message.reply('✅ تم إنشاء لوحة الرتب.');
  }

  // ========== أمر تغيير الاسم ==========
  if (cmd === 'تغيير_اسم') {
    const userId = message.author.id;
    const last = db.nameCooldown[userId];
    if (last && Date.now() - last < 5 * 60 * 60 * 1000) {
      const remaining = Math.ceil((5 * 60 * 60 * 1000 - (Date.now() - last)) / (60 * 60 * 1000));
      return message.reply(`⏳ يمكنك تغيير اسمك بعد ${remaining} ساعة.`);
    }

    const embed = new EmbedBuilder()
      .setTitle('✏️ تغيير الاسم')
      .setDescription('اضغط على الزر أدناه لتغيير اسمك المستعار في السيرفر.')
      .setColor(0x2b2d31)
      .setFooter({ text: 'يمكنك تغيير اسمك مرة كل 5 ساعات.' });

    if (generalImage) embed.setImage(generalImage);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_name_modal')
        .setLabel('✏️ تغيير الاسم')
        .setStyle(ButtonStyle.Secondary)
    );

    await message.channel.send({ embeds: [embed], components: [row] });
  }

  // ========== أوامر الإعدادات العامة ==========
  if (cmd === 'تعيين') {
    if (args[0]?.toLowerCase() === 'تذكرة') return;

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply('❌ تحتاج صلاحية أدمن.');

    const sub = args[0]?.toLowerCase();
    const value = args.slice(1).join(' ');

    if (sub === 'ترحيب') {
      const channel = message.mentions.channels.first();
      if (!channel) return message.reply('⚠️ منشن القناة.');
      updateGuildConfig(guildId, { welcomeChannel: channel.id });
      await message.reply(`✅ تم تعيين قناة الترحيب إلى ${channel}`);
    } 
    else if (sub === 'دور_دخول') {
      const role = message.mentions.roles.first();
      if (!role) return message.reply('⚠️ منشن الدور.');
      updateGuildConfig(guildId, { joinRole: role.id });
      await message.reply(`✅ تم تعيين دور الدخول إلى ${role}`);
    } 
    else if (sub === 'صورة_بانل') {
      if (!value) return message.reply('⚠️ أدخل رابط الصورة.');
      updateGuildConfig(guildId, { ticketPanelImage: value });
      await message.reply(`✅ تم تعيين صورة البانل: ${value}`);
    } 
    else if (sub === 'صورة_رتب') {
      if (!value) return message.reply('⚠️ أدخل رابط الصورة.');
      updateGuildConfig(guildId, { rolesImage: value });
      await message.reply(`✅ تم تعيين صورة رتب الإشعارات: ${value}`);
    } 
    else if (sub === 'صورة_بنر') {
      if (!value) return message.reply('⚠️ أدخل رابط الصورة.');
      updateGuildConfig(guildId, { bannerImage: value });
      await message.reply(`✅ تم تعيين صورة البنر: ${value}`);
    } 
    else if (sub === 'صورة_عامة') {
      if (!value) return message.reply('⚠️ أدخل رابط الصورة.');
      updateGuildConfig(guildId, { generalImage: value });
      await message.reply(`✅ تم تعيين الصورة العامة: ${value}`);
    } 
    else {
      await message.reply('⚠️ الأوامر المتاحة: `!تعيين ترحيب #قناة` ، `!تعيين دور_دخول @دور` ، `!تعيين صورة_بانل رابط` ، `!تعيين صورة_رتب رابط` ، `!تعيين صورة_بنر رابط` ، `!تعيين صورة_عامة رابط`');
    }
  }

  // ========== أوامر عامة ==========
  if (cmd === 'بينق') {
    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setDescription(`🏓 البينق: ${client.ws.ping}ms`);
    if (generalImage) embed.setImage(generalImage);
    await message.channel.send({ embeds: [embed] });
  }
  if (cmd === 'سيرفر') {
    const embed = new EmbedBuilder()
      .setTitle(message.guild.name)
      .setColor(0x2b2d31)
      .addFields(
        { name: '👥 الأعضاء', value: `${message.guild.memberCount}`, inline: true },
        { name: '💬 القنوات', value: `${message.guild.channels.cache.size}`, inline: true },
        { name: '👑 المالك', value: `<@${message.guild.ownerId}>`, inline: true }
      )
      .setThumbnail(message.guild.iconURL());
    if (generalImage) embed.setImage(generalImage);
    await message.channel.send({ embeds: [embed] });
  }
});

// ========== معالج التفاعلات ==========
client.on('interactionCreate', async (interaction) => {
  // القائمة المنسدلة للتذاكر
  if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_menu') {
    await interaction.deferReply({ ephemeral: true });
    const selected = interaction.values[0];
    const guild = interaction.guild;
    const member = interaction.member;
    const config = getGuildConfig(guild.id);
    const generalImage = getGeneralImage(guild, config);
    const settings = getTicketSettings(guild.id);
    const section = settings.sections.find(s => s.name === selected);

    if (!section) {
      return interaction.editReply({ content: '❌ القسم غير موجود.', ephemeral: true });
    }

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

      if (generalImage) embed.setImage(generalImage);

      let mention = '';
      if (section.roleId) {
        const role = guild.roles.cache.get(section.roleId);
        if (role) mention = `${role}`;
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('close_ticket').setLabel('🔒 إغلاق التذكرة').setStyle(ButtonStyle.Secondary)
      );

      await channel.send({ content: `${member} ${mention}`.trim(), embeds: [embed], components: [row] });
      await interaction.editReply({ content: `✅ تم إنشاء تذكرتك: ${channel}`, ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: '❌ حدث خطأ في إنشاء التذكرة.', ephemeral: true });
    }
  }

  // ========== أزرار ==========
  if (interaction.isButton()) {
    // أزرار رتب الإشعارات (ثيم رمادي)
    if (['role_game', 'role_event', 'role_ajr'].includes(interaction.customId)) {
      const roleMap = {
        role_game: 'Game Notice',
        role_event: 'Event Notice',
        role_ajr: 'Ajr Notice',
      };
      const roleName = roleMap[interaction.customId];
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

    // زر فتح مودال تغيير الاسم
    if (interaction.customId === 'open_name_modal') {
      const userId = interaction.user.id;
      const last = db.nameCooldown[userId];
      if (last && Date.now() - last < 5 * 60 * 60 * 1000) {
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
              .setMinLength(2)
              .setMaxLength(32)
          )
        );
      await interaction.showModal(modal);
    }

    // زر إغلاق التذكرة (ثيم رمادي)
    if (interaction.customId === 'close_ticket') {
      const channel = interaction.channel;
      if (!channel.name.startsWith('تذكرة-')) return interaction.reply({ content: '⚠️ هذه ليست قناة تذكرة.', ephemeral: true });
      await interaction.reply({ content: '🔒 جاري إغلاق التذكرة...', ephemeral: true });
      setTimeout(async () => { await channel.delete(); }, 3000);
    }
  }

  // ========== مودال تغيير الاسم ==========
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
client.login(TOKEN).catch((err) => {
  console.error('❌ فشل تسجيل الدخول:', err);
  process.exit(1);
});
