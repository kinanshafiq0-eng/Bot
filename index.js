const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, PermissionsBitField, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { createCanvas, loadImage, registerFont } = require('@napi-rs/canvas');
const express = require('express');
const fs = require('fs');
const path = require('path');
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
  nameCooldown: {},
  memberCount: {},
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
    };
  }
  return db.config[guildId];
}

function updateGuildConfig(guildId, data) {
  db.config[guildId] = { ...getGuildConfig(guildId), ...data };
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

// ========== نظام الترحيب بالصور ==========
async function generateWelcomeImage(member, memberCount) {
  const canvas = createCanvas(1200, 600);
  const ctx = canvas.getContext('2d');

  // خلفية داكنة مع تدرج
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(0.5, '#16213e');
  gradient.addColorStop(1, '#0f3460');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // إطار مزخرف
  ctx.strokeStyle = '#e94560';
  ctx.lineWidth = 10;
  ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

  // صورة المستخدم (دائرية)
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

  // إطار حول الصورة
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = '#e94560';
  ctx.lineWidth = 8;
  ctx.stroke();

  // نص الترحيب
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  // الاسم
  ctx.font = 'bold 48px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`مرحباً ${member.user.username}`, 450, 200);

  // ترتيب العضو
  ctx.font = '32px Arial';
  ctx.fillStyle = '#aaaaaa';
  ctx.fillText(`#${memberCount}`, 450, 280);

  // تذييل
  ctx.font = '24px Arial';
  ctx.fillStyle = '#888888';
  ctx.fillText('أهلاً بك في السيرفر!', 450, 360);

  // شعار بسيط
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

  // حساب عدد الأعضاء
  const memberCount = member.guild.memberCount;
  db.memberCount[member.guild.id] = memberCount;

  // إنشاء الصورة
  const imageBuffer = await generateWelcomeImage(member, memberCount);

  // إرسال الصورة مع رسالة
  const embed = new EmbedBuilder()
    .setTitle('🐱 Welcome To TEAM WOLF Community')
    .setDescription(`User: ${member}\nmember count: ${memberCount}`)
    .setColor(0x2b2d31)
    .setImage('attachment://welcome.png')
    .setTimestamp();

  await channel.send({
    content: `${member}`,
    embeds: [embed],
    files: [{ attachment: imageBuffer, name: 'welcome.png' }]
  });

  // منح دور الدخول إن وجد
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

  // ========== أمر المساعدة ==========
  if (cmd === 'مساعدة') {
    const embed = new EmbedBuilder()
      .setTitle('📖 قائمة الأوامر')
      .setColor(0x2b2d31)
      .addFields(
        { name: '🎫 التذاكر', value: '`!بانل` – إنشاء لوحة تذاكر (للمشرفين)', inline: false },
        { name: '🔔 رتب الإشعارات', value: '`!رتب` – عرض أزرار الرتب (للمشرفين)', inline: false },
        { name: '✏️ تغيير الاسم', value: '`!تغيير_اسم` – فتح واجهة تغيير الاسم', inline: false },
        { name: '⚙️ الإعدادات', value: '`!تعيين ترحيب #قناة` `!تعيين دور_دخول @دور`', inline: false },
        { name: '🎮 عامة', value: '`!بينق` `!سيرفر`', inline: false }
      )
      .setFooter({ text: `البادئة: !` });
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // ========== أمر بانل (التذاكر) ==========
  if (cmd === 'بانل') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply('❌ تحتاج صلاحية أدمن.');

    const embed = new EmbedBuilder()
      .setTitle('🎫 نظام التذاكر')
      .setDescription('اختر القسم المناسب من القائمة المنسدلة أدناه لإنشاء تذكرة.')
      .setColor(0x2b2d31)
      .setFooter({ text: 'سيتم إنشاء قناة خاصة بك وسيرد عليك الفريق.' });

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('ticket_menu')
        .setPlaceholder('📌 اختر القسم...')
        .addOptions([
          { label: '🛠️ High Support', value: 'High Support', emoji: '🛠️' },
          { label: '👥 Support Team', value: 'Support Team', emoji: '👥' },
          { label: '🚫 Kick Support', value: 'Kick Support', emoji: '🚫' },
          { label: '🎮 Event Support', value: 'Event Support', emoji: '🎮' },
          { label: '📋 Rest Menu', value: 'Rest Menu', emoji: '📋' },
        ])
    );

    await message.channel.send({ embeds: [embed], components: [row] });
    await message.reply('✅ تم إنشاء لوحة التذاكر.');
  }

  // ========== أمر رتب الإشعارات ==========
  if (cmd === 'رتب') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply('❌ تحتاج صلاحية أدمن.');

    const embed = new EmbedBuilder()
      .setTitle('🔔 رتب الإشعارات')
      .setDescription('اختر الرتب التي تريد استلام إشعارات عنها من خلال الأزرار أدناه.')
      .setColor(0x2b2d31)
      .setFooter({ text: 'اضغط مرة للحصول على الرتبة، ومرة أخرى لإزالتها.' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('role_game').setLabel('🎮 Game Notice').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('role_event').setLabel('📅 Event Notice').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('role_ajr').setLabel('🔊 Ajr Notice').setStyle(ButtonStyle.Primary),
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
    await message.channel.send({ content: '📝 سيتم فتح نافذة لتغيير اسمك.' });
    await message.author.send({ components: [new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_name_modal')
        .setLabel('✏️ تغيير الاسم')
        .setStyle(ButtonStyle.Primary)
    )] }).catch(() => message.reply('❌ تأكد من فتح الخاص بك.'));
  }

  // ========== أوامر الإعدادات ==========
  if (cmd === 'تعيين') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply('❌ تحتاج صلاحية أدمن.');

    const sub = args[0]?.toLowerCase();
    if (sub === 'ترحيب') {
      const channel = message.mentions.channels.first();
      if (!channel) return message.reply('⚠️ منشن القناة.');
      updateGuildConfig(guildId, { welcomeChannel: channel.id });
      await message.reply(`✅ تم تعيين قناة الترحيب إلى ${channel}`);
    } else if (sub === 'دور_دخول') {
      const role = message.mentions.roles.first();
      if (!role) return message.reply('⚠️ منشن الدور.');
      updateGuildConfig(guildId, { joinRole: role.id });
      await message.reply(`✅ تم تعيين دور الدخول إلى ${role}`);
    } else {
      await message.reply('⚠️ الأوامر المتاحة: `!تعيين ترحيب #قناة` ، `!تعيين دور_دخول @دور`');
    }
  }

  // ========== أوامر عامة ==========
  if (cmd === 'بينق') {
    await message.reply(`🏓 البينق: ${client.ws.ping}ms`);
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
    await message.channel.send({ embeds: [embed] });
  }
});

// ========== معالج التفاعلات ==========
client.on('interactionCreate', async (interaction) => {
  // ========== القائمة المنسدلة للتذاكر ==========
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

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('close_ticket').setLabel('🔒 إغلاق التذكرة').setStyle(ButtonStyle.Secondary)
      );

      await channel.send({ content: `${member}`, embeds: [embed], components: [row] });
      await interaction.editReply({ content: `✅ تم إنشاء تذكرتك: ${channel}`, ephemeral: true });
    } catch (error) {
      await interaction.editReply({ content: '❌ حدث خطأ في إنشاء التذكرة.', ephemeral: true });
    }
  }

  // ========== أزرار ==========
  if (interaction.isButton()) {
    // أزرار رتب الإشعارات
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

    // زر إغلاق التذكرة
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
