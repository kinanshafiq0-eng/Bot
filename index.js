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

app.get('/', (req, res) => res.send('🟢 Bot is online'));
app.listen(port, () => console.log(`✅ Web server on port ${port}`));

const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) { console.error('❌ DISCORD_TOKEN غير موجود'); process.exit(1); }

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const rouletteSessions = {};

// ========== دالة رسم العجلة ==========
function drawWheel(players, rotationDegrees = 0, highlightIndex = -1) {
  const size = 600;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = 250;

  // خلفية
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, size, size);

  const colors = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#e67e22', '#1abc9c', '#e84393'];
  const numPlayers = players.length || 1;
  const anglePerSlice = (2 * Math.PI) / numPlayers;

  // رسم شرائح العجلة
  for (let i = 0; i < numPlayers; i++) {
    const startAngle = (i * anglePerSlice) + (rotationDegrees * Math.PI / 180);
    const endAngle = startAngle + anglePerSlice;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // كتابة اسم اللاعب (أول 6 أحرف)
    const textAngle = startAngle + anglePerSlice / 2;
    const textX = centerX + Math.cos(textAngle) * 160;
    const textY = centerY + Math.sin(textAngle) * 160;

    ctx.save();
    ctx.translate(textX, textY);
    ctx.rotate(textAngle + Math.PI / 2);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    const name = players[i]?.displayName?.slice(0, 8) || `لاعب ${i+1}`;
    ctx.fillText(name, 0, 0);
    ctx.restore();
  }

  // الدائرة الداخلية
  ctx.beginPath();
  ctx.arc(centerX, centerY, 50, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#cc0000';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🎡', centerX, centerY + 7);

  // المؤشر (مثلث أحمر في الأعلى)
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - radius + 5);
  ctx.lineTo(centerX - 20, centerY - radius - 25);
  ctx.lineTo(centerX + 20, centerY - radius - 25);
  ctx.closePath();
  ctx.fillStyle = '#cc0000';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // إطار خارجي
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 15, 0, 2 * Math.PI);
  ctx.strokeStyle = '#cc0000';
  ctx.lineWidth = 8;
  ctx.stroke();

  return canvas.toBuffer('image/png');
}

client.once('ready', () => {
  console.log(`✅ البوت جاهز باسم ${client.user.tag}`);
  client.user.setActivity('🎡 روليت', { type: ActivityType.Watching });
});

// ========== أوامر الروليت ==========
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();
  const guildId = message.guild.id;

  // ========== بدء الروليت ==========
  if (cmd === 'روليت_ابدأ') {
    if (rouletteSessions[guildId]) {
      return message.reply('⚠️ هناك جلسة روليت نشطة.');
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
        `**0 لاعبين مسجلين**\n\nاضغط على الزر للانضمام!\n` +
        `للسحب: \`!روليت_سحب\`\nللإلغاء: \`!روليت_الغاء\``
      )
      .setColor(0xcc0000)
      .setImage('attachment://wheel.png')
      .setFooter({ text: '🎡 انتظر الدوران' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('roulette_join').setLabel('🎯 انضم').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('roulette_leave').setLabel('🚫 خروج').setStyle(ButtonStyle.Danger)
    );

    const msg = await message.channel.send({ embeds: [embed], components: [row], files: [attachment] });
    rouletteSessions[guildId].messageId = msg.id;
    await message.delete().catch(() => {});
    return;
  }

  // ========== سحب فائز مع دوران حقيقي ==========
  if (cmd === 'روليت_سحب') {
    const session = rouletteSessions[guildId];
    if (!session || session.players.length < 2) {
      return message.reply('⚠️ تحتاج لاعبين على الأقل (2+).');
    }

    const msg = await message.channel.messages.fetch(session.messageId).catch(() => null);
    if (!msg) { delete rouletteSessions[guildId]; return message.reply('❌ جلسة منتهية.'); }

    // جلب أسماء اللاعبين
    const members = [];
    for (const id of session.players) {
      const m = await message.guild.members.fetch(id).catch(() => null);
      members.push(m?.user || { displayName: `لاعب ${id}` });
    }

    const playersText = session.players.map((p, i) => `**${i+1}.** <@${p}>`).join('\n');

    // ==== المرحلة 1: عد تنازلي ====
    for (let count = 3; count >= 1; count--) {
      const buf = drawWheel(members, 0);
      const att = new AttachmentBuilder(buf, { name: 'wheel.png' });
      const embed = new EmbedBuilder()
        .setTitle('🎡 جاري السحب...')
        .setDescription(`${playersText}\n\n🔄 **${count}**...`)
        .setColor(0xffaa00)
        .setImage('attachment://wheel.png')
        .setFooter({ text: '🎡 استعد...' });
      await msg.edit({ embeds: [embed], components: [], files: [att] });
      await new Promise(r => setTimeout(r, 1000));
    }

    // ==== المرحلة 2: دوران العجلة (10 إطارات) ====
    const totalFrames = 15;
    const totalDegrees = 360 * 3 + Math.random() * 360; // 3 لفات + عشوائي
    const degreesPerFrame = totalDegrees / totalFrames;

    for (let frame = 0; frame <= totalFrames; frame++) {
      const rotation = frame * degreesPerFrame;
      const buf = drawWheel(members, rotation);
      const att = new AttachmentBuilder(buf, { name: 'wheel.png' });
      const embed = new EmbedBuilder()
        .setTitle('🎡 العجلة تدور!')
        .setDescription(`${playersText}\n\n🔄 العجلة تدور...`)
        .setColor(0xffaa00)
        .setImage('attachment://wheel.png')
        .setFooter({ text: '🎡 جاري الدوران...' });
      await msg.edit({ embeds: [embed], files: [att] });
      await new Promise(r => setTimeout(r, 300)); // 300ms بين كل إطار
    }

    // ==== المرحلة 3: اختيار فائز ====
    const finalRotation = totalDegrees % 360;
    const numPlayers = session.players.length;
    const anglePerSlice = 360 / numPlayers;
    // المؤشر في الأعلى (0 درجة)، نحسب أي شريحة تقابل الأعلى
    const normalizedAngle = (360 - (finalRotation % 360)) % 360;
    const winnerIndex = Math.floor(normalizedAngle / anglePerSlice) % numPlayers;
    const winnerId = session.players[winnerIndex];

    const finalBuf = drawWheel(members, finalRotation, winnerIndex);
    const finalAtt = new AttachmentBuilder(finalBuf, { name: 'wheel.png' });
    const winnerEmbed = new EmbedBuilder()
      .setTitle('🏆 لدينا فائز!')
      .setDescription(`${playersText}\n\n🎉 **الفائز:** <@${winnerId}>`)
      .setColor(0x00ff00)
      .setImage('attachment://wheel.png')
      .setFooter({ text: '🎡 انتهى السحب' });
    await msg.edit({ embeds: [winnerEmbed], files: [finalAtt] });

    // رسالة تهنئة
    await message.channel.send(`🏆 **مبروك** <@${winnerId}>! أنت الفائز!`);

    delete rouletteSessions[guildId];
    return;
  }

  // ========== إلغاء ==========
  if (cmd === 'روليت_الغاء') {
    const session = rouletteSessions[guildId];
    if (!session) return message.reply('⚠️ لا توجد جلسة نشطة.');
    const msg = await message.channel.messages.fetch(session.messageId).catch(() => null);
    if (msg) {
      const buf = drawWheel([]);
      const att = new AttachmentBuilder(buf, { name: 'wheel.png' });
      const embed = new EmbedBuilder()
        .setTitle('🚫 ألغيت')
        .setDescription('تم إلغاء جلسة الروليت.')
        .setColor(0xff0000)
        .setImage('attachment://wheel.png');
      await msg.edit({ embeds: [embed], components: [], files: [att] }).catch(() => {});
    }
    delete rouletteSessions[guildId];
    await message.reply('✅ تم الإلغاء.');
    return;
  }
});

// ========== أزرار الانضمام والخروج ==========
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  const guildId = interaction.guild.id;
  const session = rouletteSessions[guildId];
  if (!session) return interaction.reply({ content: '⚠️ لا جلسة نشطة.', ephemeral: true });

  if (interaction.customId === 'roulette_join') {
    if (session.players.includes(interaction.user.id)) {
      return interaction.reply({ content: '⚠️ أنت منضم.', ephemeral: true });
    }
    session.players.push(interaction.user.id);

    const msg = await interaction.channel.messages.fetch(session.messageId).catch(() => null);
    if (msg) {
      const members = [];
      for (const id of session.players) {
        const m = await interaction.guild.members.fetch(id).catch(() => null);
        members.push(m?.user || { displayName: `لاعب ${id}` });
      }
      const buf = drawWheel(members);
      const att = new AttachmentBuilder(buf, { name: 'wheel.png' });
      const embed = EmbedBuilder.from(msg.embeds[0])
        .setDescription(
          `**${session.players.length} لاعبين مسجلين**\n\n` +
          `اضغط على الزر للانضمام!\n` +
          `للسحب: \`!روليت_سحب\`\nللإلغاء: \`!روليت_الغاء\`\n\n` +
          `**المشاركون:** ${session.players.map(p => `<@${p}>`).join(', ')}`
        )
        .setImage('attachment://wheel.png');
      await msg.edit({ embeds: [embed], files: [att] });
    }
    await interaction.reply({ content: '✅ انضممت!', ephemeral: true });
  }

  if (interaction.customId === 'roulette_leave') {
    if (!session.players.includes(interaction.user.id)) {
      return interaction.reply({ content: '⚠️ غير منضم.', ephemeral: true });
    }
    session.players = session.players.filter(id => id !== interaction.user.id);

    const msg = await interaction.channel.messages.fetch(session.messageId).catch(() => null);
    if (msg) {
      const members = [];
      for (const id of session.players) {
        const m = await interaction.guild.members.fetch(id).catch(() => null);
        members.push(m?.user || { displayName: `لاعب ${id}` });
      }
      const buf = drawWheel(members);
      const att = new AttachmentBuilder(buf, { name: 'wheel.png' });
      const embed = EmbedBuilder.from(msg.embeds[0])
        .setDescription(
          `**${session.players.length} لاعبين مسجلين**\n\n` +
          `اضغط على الزر للانضمام!\n` +
          `للسحب: \`!روليت_سحب\`\nللإلغاء: \`!روليت_الغاء\`\n\n` +
          `**المشاركون:** ${session.players.length > 0 ? session.players.map(p => `<@${p}>`).join(', ') : 'لا أحد'}`
        )
        .setImage('attachment://wheel.png');
      await msg.edit({ embeds: [embed], files: [att] });
    }
    await interaction.reply({ content: '🚫 خرجت.', ephemeral: true });
  }
});

client.login(TOKEN).catch(err => { console.error('❌ فشل:', err); process.exit(1); });
