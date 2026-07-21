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
const { createCanvas, registerFont } = require('@napi-rs/canvas');
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// ================== [ إعدادات الويب ] ==================
app.get('/', (req, res) => res.send('🟢 Roulette Bot is online'));
app.listen(port, () => console.log(`✅ Web server running on port ${port}`));

// ================== [ تهيئة البوت ] ==================
const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) { console.error('❌ DISCORD_TOKEN missing'); process.exit(1); }

// تسجيل الخط العربي (Cairo)
try {
  registerFont(path.join(__dirname, 'Cairo-Regular.ttf'), { family: 'Cairo' });
  console.log('✅ Arabic font registered');
} catch (e) {
  console.error('⚠️ Font registration failed:', e.message);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const rouletteSessions = {};

// ================== [ رسم العجلة مع الأسماء ] ==================
function drawWheel(players, rotationDegrees = 0, highlightIndex = -1) {
  const size = 600;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = 240;

  // خلفية
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, size, size);

  const colors = [
    '#e74c3c', '#f1c40f', '#2ecc71', '#3498db',
    '#9b59b6', '#e67e22', '#1abc9c', '#e84393',
  ];

  const numPlayers = players.length || 1;
  const anglePerSlice = (2 * Math.PI) / numPlayers;

  // رسم الشرائح
  for (let i = 0; i < numPlayers; i++) {
    const startAngle = i * anglePerSlice + (rotationDegrees * Math.PI) / 180 - Math.PI / 2;
    const endAngle = startAngle + anglePerSlice;

    // الشريحة
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = i === highlightIndex ? '#ffd700' : colors[i % colors.length];
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // اسم اللاعب (أبيض ناصح، خط عربي)
    const textAngle = startAngle + anglePerSlice / 2;
    const textRadius = radius * 0.7;
    const textX = centerX + Math.cos(textAngle) * textRadius;
    const textY = centerY + Math.sin(textAngle) * textRadius;

    ctx.save();
    ctx.translate(textX, textY);
    ctx.rotate(textAngle + Math.PI / 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px "Cairo", "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let name = players[i]?.displayName || players[i]?.username || `لاعب ${i + 1}`;
    if (name.length > 10) name = name.substring(0, 9) + '…';
    ctx.fillText(name, 0, 0);
    ctx.restore();
  }

  // الدائرة المركزية
  ctx.beginPath();
  ctx.arc(centerX, centerY, 50, 0, 2 * Math.PI);
  ctx.fillStyle = '#2c3e50';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px "Cairo", Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎡', centerX, centerY);

  // المؤشر
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

  // إطار ذهبي
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 18, 0, 2 * Math.PI);
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 8;
  ctx.stroke();

  return canvas.toBuffer('image/png');
}

// ================== [ جلب أسماء اللاعبين ] ==================
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
      players.push({ displayName: 'غير معروف', username: `ID: ${id}` });
    }
  }
  return players;
}

client.once('ready', () => {
  console.log(`✅ Roulette Bot online as ${client.user.tag}`);
  client.user.setActivity('🎡 !روليت', { type: ActivityType.Watching });
});

// ================== [ الأوامر ] ==================
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  const guildId = message.guild.id;

  // بدء الجلسة
  if (command === 'روليت_ابدأ' || command === 'roulette_start') {
    if (rouletteSessions[guildId]) {
      return message.reply('⚠️ هناك جلسة روليت نشطة بالفعل.');
    }
    rouletteSessions[guildId] = {
      players: [],
      messageId: null,
      channelId: message.channel.id,
    };

    const buffer = drawWheel([]);
    const attachment = new AttachmentBuilder(buffer, { name: 'wheel.png' });

    const embed = new EmbedBuilder()
      .setTitle('🎡 روليت السيرفر')
      .setDescription(
        `**0 لاعبين مسجلين**\n\n` +
        `اضغط على الزر للانضمام!\n` +
        `للسحب: \`!روليت_سحب\`\n` +
        `للإلغاء: \`!روليت_الغاء\``
      )
      .setColor(0xcc0000)
      .setImage('attachment://wheel.png')
      .setFooter({ text: '🎡 بوت الروليت | انتظر الدوران' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('roulette_join').setLabel('🎯 انضم').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('roulette_leave').setLabel('🚫 خروج').setStyle(ButtonStyle.Danger)
    );

    const sentMessage = await message.channel.send({ embeds: [embed], components: [row], files: [attachment] });
    rouletteSessions[guildId].messageId = sentMessage.id;
    await message.delete().catch(() => {});
    return;
  }

  // سحب الفائز
  if (command === 'روليت_سحب' || command === 'roulette_spin') {
    const session = rouletteSessions[guildId];
    if (!session) return message.reply('⚠️ لا توجد جلسة نشطة.');
    if (session.players.length < 2) return message.reply('⚠️ تحتاج لاعبَين على الأقل.');

    const sessionMessage = await message.channel.messages.fetch(session.messageId).catch(() => null);
    if (!sessionMessage) { delete rouletteSessions[guildId]; return message.reply('❌ الجلسة منتهية.'); }

    const players = await fetchPlayers(message.guild, session.players);
    const playersListText = session.players.map((id, idx) => `**${idx + 1}.** <@${id}>`).join('\n');

    // عد تنازلي
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
      await sessionMessage.edit({ embeds: [embed], components: [], files: [attachment] });
      await new Promise(r => setTimeout(r, 1000));
    }

    // دوران العجلة
    const totalFrames = 20;
    const totalDegrees = 360 * 3 + Math.floor(Math.random() * 360);
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
      await sessionMessage.edit({ embeds: [embed], files: [attachment] });
      await new Promise(r => setTimeout(r, 250));
    }

    // الفائز
    const finalRotation = totalDegrees % 360;
    const anglePerSlice = 360 / session.players.length;
    const normalizedAngle = (360 - (finalRotation % 360)) % 360;
    const winnerIndex = Math.floor(normalizedAngle / anglePerSlice) % session.players.length;
    const winnerId = session.players[winnerIndex];

    const finalBuffer = drawWheel(players, finalRotation, winnerIndex);
    const finalAttachment = new AttachmentBuilder(finalBuffer, { name: 'wheel.png' });
    const winnerEmbed = new EmbedBuilder()
      .setTitle('🏆 لدينا فائز!')
      .setDescription(`${playersListText}\n\n🎉 **الفائز:** <@${winnerId}>`)
      .setColor(0x00ff00)
      .setImage('attachment://wheel.png')
      .setFooter({ text: '🎡 انتهى السحب' })
      .setTimestamp();
    await sessionMessage.edit({ embeds: [winnerEmbed], files: [finalAttachment] });

    await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle('🎉 مبروك!')
          .setDescription(`🏆 **<@${winnerId}>** هو الفائز!`)
          .setColor(0x00ff00)
          .setTimestamp()
      ]
    });

    delete rouletteSessions[guildId];
    return;
  }

  // إلغاء الجلسة
  if (command === 'روليت_الغاء' || command === 'roulette_cancel') {
    const session = rouletteSessions[guildId];
    if (!session) return message.reply('⚠️ لا توجد جلسة نشطة.');
    const msg = await message.channel.messages.fetch(session.messageId).catch(() => null);
    if (msg) {
      const buffer = drawWheel([]);
      const attachment = new AttachmentBuilder(buffer, { name: 'wheel.png' });
      const embed = EmbedBuilder.from(msg.embeds[0])
        .setTitle('🚫 جلسة ملغية')
        .setDescription('تم إلغاء جلسة الروليت.')
        .setColor(0xff0000)
        .setImage('attachment://wheel.png');
      await msg.edit({ embeds: [embed], components: [], files: [attachment] }).catch(() => {});
    }
    delete rouletteSessions[guildId];
    await message.reply('✅ تم إلغاء الجلسة.');
    return;
  }
});

// ================== [ أزرار التفاعل ] ==================
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  const guildId = interaction.guild.id;
  const session = rouletteSessions[guildId];
  if (!session) return interaction.reply({ content: '⚠️ لا توجد جلسة نشطة.', ephemeral: true });

  if (interaction.customId === 'roulette_join') {
    if (session.players.includes(interaction.user.id)) {
      return interaction.reply({ content: '⚠️ أنت منضم بالفعل.', ephemeral: true });
    }
    session.players.push(interaction.user.id);
    const msg = await interaction.channel.messages.fetch(session.messageId).catch(() => null);
    if (msg) {
      const players = await fetchPlayers(interaction.guild, session.players);
      const buf = drawWheel(players);
      const att = new AttachmentBuilder(buf, { name: 'wheel.png' });
      const embed = EmbedBuilder.from(msg.embeds[0])
        .setDescription(
          `**${session.players.length} لاعبين مسجلين**\n\n` +
          `اضغط للانضمام!\n` +
          `للسحب: \`!روليت_سحب\`\n` +
          `للإلغاء: \`!روليت_الغاء\`\n\n` +
          `**المشاركون:** ${session.players.map(p => `<@${p}>`).join(', ')}`
        )
        .setImage('attachment://wheel.png');
      await msg.edit({ embeds: [embed], files: [att] });
    }
    return interaction.reply({ content: '✅ انضممت!', ephemeral: true });
  }

  if (interaction.customId === 'roulette_leave') {
    if (!session.players.includes(interaction.user.id)) {
      return interaction.reply({ content: '⚠️ غير منضم.', ephemeral: true });
    }
    session.players = session.players.filter(id => id !== interaction.user.id);
    const msg = await interaction.channel.messages.fetch(session.messageId).catch(() => null);
    if (msg) {
      const players = await fetchPlayers(interaction.guild, session.players);
      const buf = drawWheel(players);
      const att = new AttachmentBuilder(buf, { name: 'wheel.png' });
      const participants = session.players.length > 0 ? session.players.map(p => `<@${p}>`).join(', ') : 'لا أحد';
      const embed = EmbedBuilder.from(msg.embeds[0])
        .setDescription(
          `**${session.players.length} لاعبين مسجلين**\n\n` +
          `اضغط للانضمام!\n` +
          `للسحب: \`!روليت_سحب\`\n` +
          `للإلغاء: \`!روليت_الغاء\`\n\n` +
          `**المشاركون:** ${participants}`
        )
        .setImage('attachment://wheel.png');
      await msg.edit({ embeds: [embed], files: [att] });
    }
    return interaction.reply({ content: '🚫 خرجت.', ephemeral: true });
  }
});

client.login(TOKEN).catch(err => { console.error('❌ فشل:', err); process.exit(1); });
