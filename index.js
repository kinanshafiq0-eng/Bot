const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  ActivityType,
} = require('discord.js');
const { createCanvas } = require('@napi-rs/canvas');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// ================== [ إعدادات الويب ] ==================
app.get('/', (req, res) => res.send('🟢 Roulette Bot is online'));
app.listen(port, () => console.log(`✅ Web server running on port ${port}`));

// ================== [ تهيئة البوت ] ==================
const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) {
  console.error('❌ DISCORD_TOKEN environment variable is not set.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// ================== [ قاعدة بيانات مؤقتة ] ==================
const rouletteSessions = {};

// ================== [ دالة رسم العجلة ] ==================
/**
 * يرسم عجلة روليت على Canvas.
 * @param {Array} players - مصفوفة كائنات { displayName, username }.
 * @param {number} rotationDegrees - درجة دوران العجلة.
 * @param {number} highlightIndex - فهرس اللاعب الفائز (لتمييز شريحته).
 * @returns {Buffer} صورة PNG.
 */
function drawWheel(players, rotationDegrees = 0, highlightIndex = -1) {
  const size = 600;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = 240;

  // --- خلفية ---
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, size, size);

  const colors = [
    '#e74c3c', '#f1c40f', '#2ecc71', '#3498db',
    '#9b59b6', '#e67e22', '#1abc9c', '#e84393',
  ];

  const numPlayers = players.length || 1;
  const anglePerSlice = (2 * Math.PI) / numPlayers;

  // --- رسم الشرائح ---
  for (let i = 0; i < numPlayers; i++) {
    const startAngle =
      i * anglePerSlice + (rotationDegrees * Math.PI) / 180 - Math.PI / 2;
    const endAngle = startAngle + anglePerSlice;

    // الشريحة
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();

    // لون الشريحة (ذهبي للفائز)
    ctx.fillStyle = i === highlightIndex ? '#ffd700' : colors[i % colors.length];
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // --- اسم اللاعب ---
    const textAngle = startAngle + anglePerSlice / 2;
    const textRadius = radius * 0.65; // المسافة من المركز
    const textX = centerX + Math.cos(textAngle) * textRadius;
    const textY = centerY + Math.sin(textAngle) * textRadius;

    ctx.save();
    ctx.translate(textX, textY);
    ctx.rotate(textAngle + Math.PI / 2); // تدوير النص مع الشريحة
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let name = players[i]?.displayName || players[i]?.username || `Player ${i + 1}`;
    if (name.length > 10) name = name.substring(0, 9) + '…';
    ctx.fillText(name, 0, 0);
    ctx.restore();
  }

  // --- الدائرة المركزية ---
  ctx.beginPath();
  ctx.arc(centerX, centerY, 55, 0, 2 * Math.PI);
  ctx.fillStyle = '#2c3e50';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎡', centerX, centerY);

  // --- المؤشر (أعلى العجلة) ---
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - radius - 5);
  ctx.lineTo(centerX - 25, centerY - radius - 40);
  ctx.lineTo(centerX + 25, centerY - radius - 40);
  ctx.closePath();
  ctx.fillStyle = '#ff0000';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();

  // --- إطار خارجي ذهبي ---
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 18, 0, 2 * Math.PI);
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 8;
  ctx.stroke();

  return canvas.toBuffer('image/png');
}

// ================== [ دالة جلب أسماء اللاعبين ] ==================
/**
 * تحوّل مصفوفة IDs إلى كائنات تحوي أسماء العرض.
 * @param {Guild} guild - السيرفر.
 * @param {string[]} playerIds - مصفوفة معرفات المستخدمين.
 * @returns {Promise<Array>} مصفوفة كائنات { displayName, username }.
 */
async function fetchPlayers(guild, playerIds) {
  const players = [];
  for (const id of playerIds) {
    const member = await guild.members.fetch(id).catch(() => null);
    if (member) {
      players.push({
        displayName: member.displayName,
        username: member.user.username,
      });
    } else {
      players.push({ displayName: 'Unknown', username: `ID: ${id}` });
    }
  }
  return players;
}

// ================== [ أحداث البوت ] ==================
client.once('ready', () => {
  console.log(`✅ Roulette Bot online as ${client.user.tag}`);
  client.user.setActivity('🎡 !roulette', { type: ActivityType.Watching });
});

// ================== [ معالج الأوامر النصية ] ==================
client.on('messageCreate', async (message) => {
  // تجاهل الرسائل من البوتات أو خارج السيرفر
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  const guildId = message.guild.id;

  // ========== [ !روليت_ابدأ ] ==========
  if (command === 'روليت_ابدأ' || command === 'roulette_start') {
    if (rouletteSessions[guildId]) {
      return message.reply('⚠️ هناك جلسة روليت نشطة بالفعل. استخدم `!روليت_سحب` أو `!روليت_الغاء`.');
    }

    // إنشاء جلسة جديدة
    rouletteSessions[guildId] = {
      players: [],
      messageId: null,
      channelId: message.channel.id,
    };

    // رسم العجلة فارغة
    const buffer = drawWheel([]);
    const attachment = new AttachmentBuilder(buffer, { name: 'wheel.png' });

    // إنشاء الرسالة
    const embed = new EmbedBuilder()
      .setTitle('🎡 روليت السيرفر')
      .setDescription(
        `**0 لاعبين مسجلين**\n\n` +
        `اضغط على الزر أدناه للانضمام!\n` +
        `لبدء السحب: \`!روليت_سحب\`\n` +
        `للإلغاء: \`!روليت_الغاء\``
      )
      .setColor(0xcc0000)
      .setImage('attachment://wheel.png')
      .setFooter({ text: '🎡 بوت الروليت | انتظر الدوران' })
      .setTimestamp();

    // الأزرار
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('roulette_join')
        .setLabel('🎯 انضم')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('roulette_leave')
        .setLabel('🚫 خروج')
        .setStyle(ButtonStyle.Danger)
    );

    const sentMessage = await message.channel.send({
      embeds: [embed],
      components: [row],
      files: [attachment],
    });

    rouletteSessions[guildId].messageId = sentMessage.id;
    await message.delete().catch(() => {});
    return;
  }

  // ========== [ !روليت_سحب ] ==========
  if (command === 'روليت_سحب' || command === 'roulette_spin') {
    const session = rouletteSessions[guildId];

    // تحقق من وجود جلسة
    if (!session) {
      return message.reply('⚠️ لا توجد جلسة روليت نشطة. ابدأ واحدة بـ `!روليت_ابدأ`.');
    }

    // تحقق من عدد اللاعبين
    if (session.players.length < 2) {
      return message.reply('⚠️ يجب أن يكون هناك لاعبان على الأقل لبدء السحب.');
    }

    // جلب رسالة الجلسة
    const sessionMessage = await message.channel.messages.fetch(session.messageId).catch(() => null);
    if (!sessionMessage) {
      delete rouletteSessions[guildId];
      return message.reply('❌ رسالة الروليت الأصلية غير موجودة. ابدأ جلسة جديدة.');
    }

    // تجهيز بيانات اللاعبين
    const players = await fetchPlayers(message.guild, session.players);
    const playersListText = session.players
      .map((id, index) => `**${index + 1}.** <@${id}>`)
      .join('\n');

    // ===== المرحلة 1: العد التنازلي (3, 2, 1) =====
    for (let count = 3; count >= 1; count--) {
      const buffer = drawWheel(players, 0);
      const attachment = new AttachmentBuilder(buffer, { name: 'wheel.png' });

      const embed = new EmbedBuilder()
        .setTitle('🎡 جاري السحب...')
        .setDescription(`${playersListText}\n\n🔄 **${count}**...`)
        .setColor(0xffaa00)
        .setImage('attachment://wheel.png')
        .setFooter({ text: '🎡 استعد للدوران...' })
        .setTimestamp();

      await sessionMessage.edit({
        embeds: [embed],
        components: [],
        files: [attachment],
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // ===== المرحلة 2: دوران العجلة (20 إطار) =====
    const totalFrames = 20;
    const totalDegrees = 360 * 3 + Math.floor(Math.random() * 360); // 3 لفات كاملة + عشوائي
    const degreesPerFrame = totalDegrees / totalFrames;

    for (let frame = 0; frame <= totalFrames; frame++) {
      const rotation = frame * degreesPerFrame;
      const buffer = drawWheel(players, rotation);
      const attachment = new AttachmentBuilder(buffer, { name: 'wheel.png' });

      const embed = new EmbedBuilder()
        .setTitle('🎡 العجلة تدور!')
        .setDescription(`${playersListText}\n\n🔄 العجلة تدور...`)
        .setColor(0xffaa00)
        .setImage('attachment://wheel.png')
        .setFooter({ text: '🎡 جاري الدوران...' })
        .setTimestamp();

      await sessionMessage.edit({
        embeds: [embed],
        files: [attachment],
      });
      await new Promise(resolve => setTimeout(resolve, 250));
    }

    // ===== المرحلة 3: إعلان الفائز =====
    const finalRotation = totalDegrees % 360;
    const numPlayers = session.players.length;
    const anglePerSlice = 360 / numPlayers;
    const normalizedAngle = (360 - (finalRotation % 360)) % 360;
    const winnerIndex = Math.floor(normalizedAngle / anglePerSlice) % numPlayers;
    const winnerId = session.players[winnerIndex];

    // رسم العجلة مع تمييز الفائز
    const finalBuffer = drawWheel(players, finalRotation, winnerIndex);
    const finalAttachment = new AttachmentBuilder(finalBuffer, { name: 'wheel.png' });

    const winnerEmbed = new EmbedBuilder()
      .setTitle('🏆 لدينا فائز!')
      .setDescription(`${playersListText}\n\n🎉 **الفائز:** <@${winnerId}>`)
      .setColor(0x00ff00)
      .setImage('attachment://wheel.png')
      .setFooter({ text: '🎡 انتهى السحب' })
      .setTimestamp();

    await sessionMessage.edit({
      embeds: [winnerEmbed],
      files: [finalAttachment],
    });

    // رسالة تهنئة منفصلة
    await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle('🎉 مبروك!')
          .setDescription(
            `🏆 **<@${winnerId}>** هو الفائز!\n\n🎊 حظ أوفر للمشاركين الآخرين في المرات القادمة.`
          )
          .setColor(0x00ff00)
          .setTimestamp(),
      ],
    });

    // حذف الجلسة
    delete rouletteSessions[guildId];
    return;
  }

  // ========== [ !روليت_الغاء ] ==========
  if (command === 'روليت_الغاء' || command === 'roulette_cancel') {
    const session = rouletteSessions[guildId];

    if (!session) {
      return message.reply('⚠️ لا توجد جلسة روليت نشطة حالياً.');
    }

    const sessionMessage = await message.channel.messages.fetch(session.messageId).catch(() => null);
    if (sessionMessage) {
      const buffer = drawWheel([]);
      const attachment = new AttachmentBuilder(buffer, { name: 'wheel.png' });

      const embed = EmbedBuilder.from(sessionMessage.embeds[0])
        .setTitle('🚫 جلسة ملغية')
        .setDescription('تم إلغاء جلسة الروليت.')
        .setColor(0xff0000)
        .setImage('attachment://wheel.png');

      await sessionMessage.edit({
        embeds: [embed],
        components: [],
        files: [attachment],
      }).catch(() => {});
    }

    delete rouletteSessions[guildId];
    await message.reply('✅ تم إلغاء جلسة الروليت بنجاح.');
    return;
  }

  // ========== [ !روليت ] ==========
  if (command === 'روليت' || command === 'roulette') {
    const embed = new EmbedBuilder()
      .setTitle('🎡 أوامر الروليت')
      .setColor(0xcc0000)
      .setDescription(
        `**!روليت_ابدأ** - بدء جلسة روليت جديدة\n` +
        `**!روليت_سحب** - تدوير العجلة واختيار فائز\n` +
        `**!روليت_الغاء** - إلغاء الجلسة الحالية\n\n` +
        `🎯 يمكن للأعضاء الانضمام عبر الأزرار أسفل رسالة الروليت.`
      )
      .setFooter({ text: '🎡 بوت الروليت' })
      .setTimestamp();
    await message.channel.send({ embeds: [embed] });
    return;
  }
});

// ================== [ معالج الأزرار التفاعلية ] ==================
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const guildId = interaction.guild.id;
  const session = rouletteSessions[guildId];

  if (!session) {
    return interaction.reply({
      content: '⚠️ لا توجد جلسة روليت نشطة.',
      ephemeral: true,
    });
  }

  // ========== [ زر الانضمام ] ==========
  if (interaction.customId === 'roulette_join') {
    if (session.players.includes(interaction.user.id)) {
      return interaction.reply({
        content: '⚠️ أنت منضم بالفعل إلى الجلسة.',
        ephemeral: true,
      });
    }

    session.players.push(interaction.user.id);

    // تحديث رسالة الجلسة
    const sessionMessage = await interaction.channel.messages.fetch(session.messageId).catch(() => null);
    if (sessionMessage) {
      const players = await fetchPlayers(interaction.guild, session.players);
      const buffer = drawWheel(players);
      const attachment = new AttachmentBuilder(buffer, { name: 'wheel.png' });

      const embed = EmbedBuilder.from(sessionMessage.embeds[0])
        .setDescription(
          `**${session.players.length} لاعبين مسجلين**\n\n` +
          `اضغط على الزر أدناه للانضمام!\n` +
          `لبدء السحب: \`!روليت_سحب\`\n` +
          `للإلغاء: \`!روليت_الغاء\`\n\n` +
          `**المشاركون:** ${session.players.map(id => `<@${id}>`).join(', ')}`
        )
        .setImage('attachment://wheel.png');

      await sessionMessage.edit({
        embeds: [embed],
        files: [attachment],
      });
    }

    return interaction.reply({
      content: '✅ تم انضمامك إلى جلسة الروليت!',
      ephemeral: true,
    });
  }

  // ========== [ زر الخروج ] ==========
  if (interaction.customId === 'roulette_leave') {
    if (!session.players.includes(interaction.user.id)) {
      return interaction.reply({
        content: '⚠️ أنت غير منضم إلى الجلسة.',
        ephemeral: true,
      });
    }

    session.players = session.players.filter(id => id !== interaction.user.id);

    // تحديث رسالة الجلسة
    const sessionMessage = await interaction.channel.messages.fetch(session.messageId).catch(() => null);
    if (sessionMessage) {
      const players = await fetchPlayers(interaction.guild, session.players);
      const buffer = drawWheel(players);
      const attachment = new AttachmentBuilder(buffer, { name: 'wheel.png' });

      const participantsList = session.players.length > 0
        ? session.players.map(id => `<@${id}>`).join(', ')
        : 'لا أحد';

      const embed = EmbedBuilder.from(sessionMessage.embeds[0])
        .setDescription(
          `**${session.players.length} لاعبين مسجلين**\n\n` +
          `اضغط على الزر أدناه للانضمام!\n` +
          `لبدء السحب: \`!روليت_سحب\`\n` +
          `للإلغاء: \`!روليت_الغاء\`\n\n` +
          `**المشاركون:** ${participantsList}`
        )
        .setImage('attachment://wheel.png');

      await sessionMessage.edit({
        embeds: [embed],
        files: [attachment],
      });
    }

    return interaction.reply({
      content: '🚫 تم خروجك من جلسة الروليت.',
      ephemeral: true,
    });
  }
});

// ================== [ تشغيل البوت ] ==================
client.login(TOKEN).catch((err) => {
  console.error('❌ Failed to login:', err);
  process.exit(1);
});
