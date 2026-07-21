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

// ========== دالة رسم العجلة (مُصحّحة) ==========
function drawWheel(players, rotationDegrees = 0, highlightIndex = -1) {
  const size = 600;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = 240;

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, size, size);

  const colors = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#e67e22', '#1abc9c', '#e84393'];
  const numPlayers = players.length || 1;
  const anglePerSlice = (2 * Math.PI) / numPlayers;

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

    const textAngle = startAngle + anglePerSlice / 2;
    const textRadius = radius * 0.65;
    const textX = centerX + Math.cos(textAngle) * textRadius;
    const textY = centerY + Math.sin(textAngle) * textRadius;

    ctx.save();
    ctx.translate(textX, textY);
    ctx.rotate(textAngle + Math.PI / 2);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let name = players[i]?.displayName || players[i]?.username || `لاعب ${i+1}`;
    if (name.length > 12) name = name.substring(0, 11) + '...';
    ctx.fillText(name, 0, 0);
    ctx.restore();
  }

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

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 18, 0, 2 * Math.PI);
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 8;
  ctx.stroke();

  return canvas.toBuffer('image/png');
}

client.once('ready', () => {
  console.log(`✅ البوت جاهز باسم ${client.user.tag}`);
  client.user.setActivity('🎡 روليت', { type: ActivityType.Watching });
});

// ========== بدء الروليت ==========
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();
  const guildId = message.guild.id;

  if (cmd === 'روليت_ابدأ') {
    if (rouletteSessions[guildId]) return message.reply('⚠️ هناك جلسة نشطة بالفعل.');

    rouletteSessions[guildId] = { players: [], messageId: null, channelId: message.channel.id };

    const buf = drawWheel([]);
    const att = new AttachmentBuilder(buf, { name: 'wheel.png' });

    const embed = new EmbedBuilder()
      .setTitle('🎡 روليت السيرفر')
      .setDescription(`**0 لاعبين مسجلين**\n\nاضغط على الزر للانضمام!\nللسحب: \`!روليت_سحب\`\nللإلغاء: \`!روليت_الغاء\``)
      .setColor(0xcc0000)
      .setImage('attachment://wheel.png')
      .setFooter({ text: '🎡 انتظر الدوران' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('roulette_join').setLabel('🎯 انضم').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('roulette_leave').setLabel('🚫 خروج').setStyle(ButtonStyle.Danger)
    );

    const msg = await message.channel.send({ embeds: [embed], components: [row], files: [att] });
    rouletteSessions[guildId].messageId = msg.id;
    await message.delete().catch(() => {});
    return;
  }

  // ... (باقي الكود: روليت_سحب، روليت_الغاء، أزرار التفاعل – نفس كود الرد السابق)
  // تأكد من استخدام drawWheel الجديدة في جميع أماكن التحديث
});

client.login(TOKEN).catch(err => { console.error('❌ فشل:', err); process.exit(1); });
