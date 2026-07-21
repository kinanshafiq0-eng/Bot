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
    GatewayIntentBits.GuildMembers,
  ],
});

const rouletteSessions = {};

// ========== دالة رسم العجلة (الأسماء على الشرائح) ==========
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

  const colors = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#e67e22', '#1abc9c', '#e84393'];
  const numPlayers = players.length || 1;
  const anglePerSlice = (2 * Math.PI) / numPlayers;

  // رسم الشرائح
  for (let i = 0; i < numPlayers; i++) {
    const startAngle = (i * anglePerSlice) + (rotationDegrees * Math.PI / 180) - Math.PI / 2;
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

    // اسم اللاعب
    const textAngle = startAngle + anglePerSlice / 2;
    const textRadius = radius * 0.65;
    const textX = centerX + Math.cos(textAngle) * textRadius;
    const textY = centerY + Math.sin(textAngle) * textRadius;

    ctx.save();
    ctx.translate(textX, textY);
    ctx.rotate(textAngle + Math.PI / 2);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let name = players[i]?.displayName || players[i]?.username || `لاعب ${i+1}`;
    if (name.length > 12) name = name.substring(0, 11) + '...';
    ctx.fillText(name, 0, 0);
    ctx.restore();
  }

  // الدائرة المركزية
  ctx.beginPath();
  ctx.arc(centerX, centerY, 55, 0, 2 * Math.PI);
  ctx.fillStyle = '#2c3e50';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎡', centerX, centerY);

  // المؤشر (أعلى)
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

// ========== جلب أسماء اللاعبين ==========
async function fetchPlayers(guild, playerIds) {
  const players = [];
  for (const id of playerIds) {
    const member = await guild.members.fetch(id).catch(() => null);
    if (member) {
      players.push({ displayName: member.displayName, username: member.user.username });
    } else {
      players.push({ displayName: `غير معروف`, username: `ID: ${id}` });
    }
  }
  return players;
}

client.once('ready', () => {
  console.log(`✅ البوت جاهز باسم ${client.user.tag}`);
  client.user.setActivity('🎡 روليت', { type: ActivityType.Watching });
});

// ========== الأوامر ==========
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();
  const guildId = message.guild.id;

  // ========== بدء الروليت ==========
  if (cmd === 'روليت_ابدأ') {
    if (rouletteSessions[guildId]) {
      return message.reply('⚠️ هناك جلسة روليت نشطة بالفعل. استخدم `!روليت_سحب` أو `!روليت_الغاء`.');
    }

    rouletteSessions[guildId] = {
      players: [],
      messageId: null,
      channelId: message.channel.id,
    };

    const buf = drawWheel([]);
    const att = new AttachmentBuilder(buf, { name: 'wheel.png' });

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
      .setFooter({ text: '🎡 انتظر الدوران' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('roulette_join').setLabel('🎯 انضم').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('roulette_leave').setLabel('🚫 خروج').setStyle(ButtonStyle.Danger)
    );

    const msg = await message.channel.send({ embeds: [embed], components: [row], files: [att] });
    rouletteSessions[guildId].messageId = msg.id;
    await message.delete().catch(() => {});
    return;
  }

  // ========== سحب فائز ==========
  if (cmd === 'روليت_سحب') {
    const session = rouletteSessions[guildId];
    if (!session || session.players.length < 2) {
      return message.reply('⚠️ تحتاج لاعبين على الأقل (2+) لبدء السحب.');
    }

    const msg = await message.channel.messages.fetch(session.messageId).catch(() => null);
    if (!msg) {
      delete rouletteSessions[guildId];
      return message.reply('❌ رسالة الروليت غير موجودة. ابدأ جلسة جديدة.');
    }

    const players = await fetchPlayers(message.guild, session.players);
    const playersText = session.players.map((p, i) => `**${i+1}.** <@${p}>`).join('\n');

    // ==== المرحلة 1: العد التنازلي ====
    for (let count = 3; count >= 1; count--) {
      const buf = drawWheel(players, 0);
      const att = new AttachmentBuilder(buf, { name: 'wheel.png' });
      const embed = new EmbedBuilder()
        .setTitle('🎡 جاري السحب...')
        .setDescription(`${playersText}\n\n🔄 **${count}**...`)
        .setColor(0xffaa00)
        .setImage('attachment://wheel.png')
        .setFooter({ text: '🎡 استعد...' })
        .setTimestamp();
      await msg.edit({ embeds: [embed], components: [], files: [att] });
      await new Promise(r => setTimeout(r, 1000));
    }

    // ==== المرحلة 2: دوران العجلة (15 إطاراً) ====
    const totalFrames = 15;
    const totalDegrees = 360 * 3 + Math.floor(Math.random() * 360); // 3 لفات + عشوائي
    const degreesPerFrame = totalDegrees / totalFrames;

    for (let frame = 0; frame <= totalFrames; frame++) {
      const rotation = frame * degreesPerFrame;
      const buf = drawWheel(players, rotation);
      const att = new AttachmentBuilder(buf, { name: 'wheel.png' });
      const embed = new EmbedBuilder()
        .setTitle('🎡 العجلة تدور!')
        .setDescription(`${playersText}\n\n🔄 العجلة تدور...`)
        .setColor(0xffaa00)
        .setImage('attachment://wheel.png')
        .setFooter({ text: '🎡 جاري الدوران...' })
        .setTimestamp();
      await msg.edit({ embeds: [embed], files: [att] });
      await new Promise(r => setTimeout(r, 300));
    }

    // ==== المرحلة 3: اختيار فائز ====
    const finalRotation = totalDegrees % 360;
    const numPlayers = session.players.length;
    const anglePerSlice = 360 / numPlayers;
    const normalizedAngle = (360 - (finalRotation % 360)) % 360;
    const winnerIndex = Math.floor(normalizedAngle / anglePerSlice) % numPlayers;
    const winnerId = session.players[winnerIndex];

    const finalBuf = drawWheel(players, finalRotation, winnerIndex);
    const finalAtt = new AttachmentBuilder(finalBuf, { name: 'wheel.png' });

    const winnerEmbed = new EmbedBuilder()
      .setTitle('🏆 لدينا فائز!')
      .setDescription(`${playersText}\n\n🎉 **الفائز:** <@${winnerId}>`)
      .setColor(0x00ff00)
      .setImage('attachment://wheel.png')
      .setFooter({ text: '🎡 انتهى السحب' })
      .setTimestamp();
    await msg.edit({ embeds: [winnerEmbed], files: [finalAtt] });

    await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle('🎉 مبروك!')
          .setDescription(`🏆 **<@${winnerId}>** هو الفائز!\n\n🎊 حظ أوفر للبقية.`)
          .setColor(0x00ff00)
          .setTimestamp()
      ]
    });

    delete rouletteSessions[guildId];
    return;
  }

  // ========== إلغاء الروليت ==========
  if (cmd === 'روليت_الغاء') {
    const session = rouletteSessions[guildId];
    if (!session) return message.reply('⚠️ لا توجد جلسة روليت نشطة.');

    const msg = await message.channel.messages.fetch(session.messageId).catch(() => null);
    if (msg) {
      const buf = drawWheel([]);
      const att = new AttachmentBuilder(buf, { name: 'wheel.png' });
      const embed = EmbedBuilder.from(msg.embeds[0])
        .setTitle('🚫 ألغيت')
        .setDescription('تم إلغاء جلسة الروليت.')
        .setColor(0xff0000)
        .setImage('attachment://wheel.png');
      await msg.edit({ embeds: [embed], components: [], files: [att] }).catch(() => {});
    }

    delete rouletteSessions[guildId];
    await message.reply('✅ تم إلغاء جلسة الروليت.');
    return;
  }
});

// ========== أزرار الانضمام والخروج ==========
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  const guildId = interaction.guild.id;
  const session = rouletteSessions[guildId];
  if (!session) return interaction.reply({ content: '⚠️ لا توجد جلسة روليت نشطة.', ephemeral: true });

  // ========== انضمام ==========
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
          `اضغط على الزر للانضمام!\n` +
          `للسحب: \`!روليت_سحب\`\n` +
          `للإلغاء: \`!روليت_الغاء\`\n\n` +
          `**المشاركون:** ${session.players.map(p => `<@${p}>`).join(', ')}`
        )
        .setImage('attachment://wheel.png');
      await msg.edit({ embeds: [embed], files: [att] });
    }
    await interaction.reply({ content: '✅ انضممت للروليت!', ephemeral: true });
  }

  // ========== خروج ==========
  if (interaction.customId === 'roulette_leave') {
    if (!session.players.includes(interaction.user.id)) {
      return interaction.reply({ content: '⚠️ أنت غير منضم.', ephemeral: true });
    }
    session.players = session.players.filter(id => id !== interaction.user.id);

    const msg = await interaction.channel.messages.fetch(session.messageId).catch(() => null);
    if (msg) {
      const players = await fetchPlayers(interaction.guild, session.players);
      const buf = drawWheel(players);
      const att = new AttachmentBuilder(buf, { name: 'wheel.png' });
      const embed = EmbedBuilder.from(msg.embeds[0])
        .setDescription(
          `**${session.players.length} لاعبين مسجلين**\n\n` +
          `اضغط على الزر للانضمام!\n` +
          `للسحب: \`!روليت_سحب\`\n` +
          `للإلغاء: \`!روليت_الغاء\`\n\n` +
          `**المشاركون:** ${session.players.length > 0 ? session.players.map(p => `<@${p}>`).join(', ') : 'لا أحد'}`
        )
        .setImage('attachment://wheel.png');
      await msg.edit({ embeds: [embed], files: [att] });
    }
    await interaction.reply({ content: '🚫 خرجت من الروليت.', ephemeral: true });
  }
});

// ========== تشغيل البوت ==========
client.login(TOKEN).catch(err => {
  console.error('❌ فشل تسجيل الدخول:', err);
  process.exit(1);
});
