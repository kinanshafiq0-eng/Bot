const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  ActivityType,
  PermissionsBitField,
} = require('discord.js');
const { createCanvas, registerFont } = require('@napi-rs/canvas');
const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const app = express();
const port = process.env.PORT || 3000;

// ================== [ Web Server ] ==================
app.get('/', (req, res) => res.send('🟢 Games Bot is online'));
app.listen(port, () => console.log(`✅ Web server on port ${port}`));

// ================== [ Bot Init ] ==================
const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) { console.error('❌ DISCORD_TOKEN missing'); process.exit(1); }

const fontPath = path.join(__dirname, 'Cairo-Regular.ttf');
const fontUrl = 'https://github.com/google/fonts/raw/main/ofl/cairo/static/Cairo-Regular.ttf';

// --- تنزيل الخط تلقائياً ---
async function ensureFont() {
  if (fs.existsSync(fontPath)) {
    console.log('✅ Font file exists');
    return;
  }
  console.log('⬇️ Downloading Arabic font...');
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(fontPath);
    https.get(fontUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Font download failed: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('✅ Font downloaded successfully');
        resolve();
      });
    }).on('error', reject);
  });
}

// --- تسجيل الخط ---
function registerArabicFont() {
  if (fs.existsSync(fontPath)) {
    try {
      registerFont(fontPath, { family: 'Cairo' });
      console.log('✅ Arabic font registered');
      return true;
    } catch (e) {
      console.error('⚠️ Font registration failed:', e.message);
    }
  } else {
    console.warn('⚠️ Font file missing. Arabic names may not display correctly.');
  }
  return false;
}

// --- تجهيز الخط قبل تشغيل البوت ---
(async () => {
  await ensureFont();
  registerArabicFont();
})();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// ================== [ Database ] ==================
const db = {
  config: {},
  roulette: {},
  hideSeek: {},
  musicalChairs: {},
  ticTacToe: {},
  mafia: {},
};

function saveDB() { try { fs.writeFileSync('./db.json', JSON.stringify(db)); } catch(e){} }
function loadDB() { try { if (fs.existsSync('./db.json')) Object.assign(db, JSON.parse(fs.readFileSync('./db.json', 'utf8'))); } catch(e){} }
loadDB();
setInterval(saveDB, 300000);

// ================== [ Theme ] ==================
const MAIN_COLOR = 0xcc0000;
const DARK_BG = '#1a1a1a';

function getServerImage(guild, config = {}) {
  if (config.generalImage) return config.generalImage;
  if (guild.bannerURL({ size: 1024 })) return guild.bannerURL({ size: 1024 });
  if (guild.iconURL({ size: 1024 })) return guild.iconURL({ size: 1024 });
  return null;
}

function getGuildConfig(guildId) {
  if (!db.config[guildId]) db.config[guildId] = { generalImage: null };
  return db.config[guildId];
}

// ================== [ Roulette Canvas – تم تحسين رسم الأسماء ] ==================
function drawWheel(players, rotationDegrees = 0, highlightIndex = -1) {
  const size = 600;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const centerX = size / 2, centerY = size / 2, radius = 230;

  // خلفية داكنة
  ctx.fillStyle = DARK_BG;
  ctx.fillRect(0, 0, size, size);

  const colors = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#e67e22', '#1abc9c', '#e84393'];
  const numPlayers = players.length || 1;
  const anglePerSlice = (2 * Math.PI) / numPlayers;

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

    // اسم اللاعب (تم التصحيح: مسافة أقل وخط أكثر وضوحاً)
    const textAngle = startAngle + anglePerSlice / 2;
    const textRadius = radius * 0.55; // أقرب إلى المركز لضمان الظهور
    const textX = centerX + Math.cos(textAngle) * textRadius;
    const textY = centerY + Math.sin(textAngle) * textRadius;

    ctx.save();
    ctx.translate(textX, textY);
    // تدوير النص لمتابعة الشريحة (عمودي)
    ctx.rotate(textAngle + Math.PI / 2);
    ctx.fillStyle = '#FFFFFF';
    // استخدام الخط العربي إن تم تسجيله، وإلا Arial
    ctx.font = 'bold 17px "Cairo", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let name = players[i]?.displayName || players[i]?.username || `لاعب ${i + 1}`;
    if (name.length > 10) name = name.substring(0, 9) + '…';
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
  ctx.font = 'bold 28px "Cairo", Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎡', centerX, centerY);

  // المؤشر الأحمر
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

  // إطار أحمر خارجي
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 18, 0, 2 * Math.PI);
  ctx.strokeStyle = '#cc0000';
  ctx.lineWidth = 8;
  ctx.stroke();

  return canvas.toBuffer('image/png');
}

async function fetchPlayers(guild, ids) {
  const arr = [];
  for (const id of ids) {
    const m = await guild.members.fetch(id).catch(() => null);
    arr.push(m ? { displayName: m.displayName, username: m.user.username } : { displayName: 'غير معروف' });
  }
  return arr;
}

function createTTTButtons(board) {
  const rows = [];
  for (let i = 0; i < 3; i++) {
    const row = new ActionRowBuilder();
    for (let j = 0; j < 3; j++) {
      const idx = i * 3 + j;
      const label = board[idx] || '⬛';
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`ttt_${idx}`)
          .setLabel(label)
          .setStyle(board[idx] ? ButtonStyle.Danger : ButtonStyle.Secondary)
          .setDisabled(!!board[idx])
      );
    }
    rows.push(row);
  }
  return rows;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ================== [ Ready ] ==================
client.once('ready', () => {
  console.log(`✅ ${client.user.tag} ready`);
  client.user.setActivity('🎲 !ألعاب', { type: ActivityType.Playing });
});

// ================== [ Commands ] ==================
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith('!')) return;
  const args = message.content.slice(1).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();
  const guildId = message.guild.id;
  const config = getGuildConfig(guildId);
  const serverImg = getServerImage(message.guild, config);

  // ========== [ قائمة الألعاب ] ==========
  if (cmd === 'ألعاب' || cmd === 'العاب' || cmd === 'games') {
    const embed = new EmbedBuilder()
      .setTitle('🎮 قائمة الألعاب')
      .setColor(MAIN_COLOR)
      .setDescription(
        `🎡 **روليت** \`!روليت\`\n`+
        `🎰 **ريبيكا** \`!ريبيكا\`\n`+
        `🙈 **اختباء** \`!اختباء\`\n`+
        `🪑 **كراسي** \`!كراسي\`\n`+
        `❌⭕ **اكس او** \`!اكس_او @خصم\`\n`+
        `🕵️ **مافيا** \`!مافيا\`\n\n`+
        `⚙️ **للمشرفين:** \`!تعيين صورة_عامة <رابط>\` لتعيين صورة عامة`
      )
      .setFooter({ text: 'ثيم أحمر وأسود' });
    if (serverImg) embed.setThumbnail(serverImg);
    return message.channel.send({ embeds: [embed] });
  }

  // ========== [ تعيين صورة عامة ] ==========
  if (cmd === 'تعيين' && args[0] === 'صورة_عامة') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return message.reply('❌ تحتاج صلاحية إدارة السيرفر.');
    }
    const url = args.slice(1).join(' ');
    if (!url) {
      db.config[guildId].generalImage = null;
      saveDB();
      return message.reply('✅ تم إزالة الصورة العامة.');
    }
    db.config[guildId].generalImage = url;
    saveDB();
    return message.reply('✅ تم تعيين الصورة العامة.');
  }

  // ========== [ ROULETTE ] ==========
  if (cmd === 'روليت' || cmd === 'roulette') {
    if (db.roulette[guildId]) return message.reply('⚠️ هناك جلسة روليت نشطة.');
    db.roulette[guildId] = { players: [], messageId: null, channelId: message.channel.id };

    const buf = drawWheel([]);
    const att = new AttachmentBuilder(buf, { name: 'wheel.png' });
    const embed = new EmbedBuilder()
      .setTitle('🎡 روليت السيرفر')
      .setDescription('**0 لاعبين**\nاضغط على الزر للانضمام!\n`!سحب` لبدء السحب\n`!إلغاء` للإلغاء')
      .setColor(MAIN_COLOR)
      .setImage('attachment://wheel.png')
      .setFooter({ text: '🎡 استعد' });
    if (serverImg) embed.setThumbnail(serverImg);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('join_roulette').setLabel('🎯 انضم').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('leave_roulette').setLabel('🚫 خروج').setStyle(ButtonStyle.Secondary)
    );
    const msg = await message.channel.send({ embeds: [embed], components: [row], files: [att] });
    db.roulette[guildId].messageId = msg.id;
    saveDB();
    return message.delete().catch(()=>{});
  }

  // ========== [ سحب الروليت ] ==========
  if (cmd === 'سحب' || cmd === 'spin') {
    const session = db.roulette[guildId];
    if (!session || session.players.length < 2) return message.reply('⚠️ جلسة غير متاحة أو تحتاج لاعبَين على الأقل.');
    const msg = await message.channel.messages.fetch(session.messageId).catch(()=>null);
    if (!msg) { delete db.roulette[guildId]; saveDB(); return message.reply('❌ انتهت الجلسة.'); }

    const players = await fetchPlayers(message.guild, session.players);
    const listText = session.players.map((id,i)=>`**${i+1}.** <@${id}>`).join('\n');

    // عد تنازلي
    for (let c=3; c>=1; c--) {
      const b = drawWheel(players);
      const a = new AttachmentBuilder(b,{name:'wheel.png'});
      const embed = new EmbedBuilder().setTitle('🎡 جاري السحب').setDescription(`${listText}\n\n🔄 **${c}**...`).setColor(0xffaa00).setImage('attachment://wheel.png');
      if (serverImg) embed.setThumbnail(serverImg);
      await msg.edit({ embeds: [embed], components: [], files:[a] });
      await new Promise(r=>setTimeout(r,1000));
    }

    // دوران العجلة
    const totalDeg = 360*3+Math.floor(Math.random()*360);
    for (let f=0; f<=20; f++) {
      const rot = f*(totalDeg/20);
      const b = drawWheel(players, rot);
      const a = new AttachmentBuilder(b,{name:'wheel.png'});
      const embed = new EmbedBuilder().setTitle('🎡 العجلة تدور!').setDescription(`${listText}\n\n🔄 تدور...`).setColor(0xffaa00).setImage('attachment://wheel.png');
      if (serverImg) embed.setThumbnail(serverImg);
      await msg.edit({ embeds: [embed], files:[a] });
      await new Promise(r=>setTimeout(r,250));
    }

    // الفائز
    const finalRot = totalDeg % 360;
    const anglePerSlice = 360 / session.players.length;
    const normalized = (360 - (finalRot % 360)) % 360;
    const winIdx = Math.floor(normalized / anglePerSlice) % session.players.length;
    const winner = session.players[winIdx];

    const finalBuf = drawWheel(players, finalRot, winIdx);
    const finalAtt = new AttachmentBuilder(finalBuf,{name:'wheel.png'});
    const finalEmbed = new EmbedBuilder().setTitle('🏆 لدينا فائز!').setDescription(`${listText}\n\n🎉 **<@${winner}>**`).setColor(0x00ff00).setImage('attachment://wheel.png');
    if (serverImg) finalEmbed.setThumbnail(serverImg);
    await msg.edit({ embeds: [finalEmbed], files:[finalAtt] });

    const congratsEmbed = new EmbedBuilder().setTitle('🎉 مبروك!').setDescription(`🏆 **<@${winner}>** فاز!`).setColor(0x00ff00);
    if (serverImg) congratsEmbed.setThumbnail(serverImg);
    await message.channel.send({ embeds: [congratsEmbed] });

    delete db.roulette[guildId];
    saveDB();
    return;
  }

  if (cmd === 'إلغاء' || cmd === 'cancel') {
    const session = db.roulette[guildId];
    if (!session) return message.reply('⚠️ لا جلسة.');
    const msg = await message.channel.messages.fetch(session.messageId).catch(()=>null);
    if (msg) {
      const embed = new EmbedBuilder().setTitle('🚫 ألغيت').setColor(0xff0000).setDescription('تم الإلغاء');
      if (serverImg) embed.setThumbnail(serverImg);
      await msg.edit({ embeds: [embed], components:[] });
    }
    delete db.roulette[guildId];
    saveDB();
    return message.reply('✅ ألغيت.');
  }

  // ========== [ ريبيكا ] ==========
  if (cmd === 'ريبيكا' || cmd === 'replica') {
    const symbols = ['🍒', '🍋', '🍊', '🍇', '🔔', '💎', '7️⃣', '⭐'];
    const s = [symbols[Math.floor(Math.random()*symbols.length)], symbols[Math.floor(Math.random()*symbols.length)], symbols[Math.floor(Math.random()*symbols.length)]];
    let result, col;
    if (s[0]===s[1] && s[1]===s[2]) { result = '🎉 فوز كبير!'; col = 0x00ff00; }
    else if (s[0]===s[1] || s[1]===s[2] || s[0]===s[2]) { result = '🎈 فوز صغير!'; col = 0xffaa00; }
    else { result = '😔 خسارة'; col = 0xff0000; }
    const embed = new EmbedBuilder()
      .setTitle('🎰 ريبيكا')
      .setDescription(`**${s[0]} | ${s[1]} | ${s[2]}**\n\n${result}`)
      .setColor(col)
      .setFooter({ text: 'ريبيكا | العب مرة أخرى' });
    if (serverImg) embed.setThumbnail(serverImg);
    return message.channel.send({ embeds: [embed] });
  }

  // ========== [ اختباء ] ==========
  if (cmd === 'اختباء' || cmd === 'hide') {
    if (db.hideSeek[guildId]) return message.reply('⚠️ لعبة اختباء جارية.');
    db.hideSeek[guildId] = { players: [], phase: 'joining', hiderId: null, votes: {}, messageId: null };
    const embed = new EmbedBuilder()
      .setTitle('🙈 اختباء')
      .setDescription('انضم للعبة! عند البداية، سيختار البوت مختبئاً.\nالآخرون يتناقشون ويصوتون.\nاستخدم `!تصويت @شخص` للتصويت.')
      .setColor(MAIN_COLOR);
    if (serverImg) embed.setThumbnail(serverImg);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('join_hide').setLabel('🙈 انضم').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('start_hide').setLabel('▶️ ابدأ').setStyle(ButtonStyle.Success)
    );
    const msg = await message.channel.send({ embeds: [embed], components: [row] });
    db.hideSeek[guildId].messageId = msg.id;
    saveDB();
    return message.delete().catch(()=>{});
  }

  if (cmd === 'تصويت' || cmd === 'vote') {
    const game = db.hideSeek[guildId];
    if (!game || game.phase !== 'voting') return message.reply('⚠️ لا تصويت الآن.');
    const target = message.mentions.members.first();
    if (!target || !game.players.includes(target.id)) return message.reply('⚠️ منشن لاعب صحيح.');
    if (game.votes[message.author.id]) return message.reply('⚠️ صوتت بالفعل.');
    game.votes[message.author.id] = target.id;
    message.reply(`✅ صوتت لـ ${target}.`);
    if (Object.keys(game.votes).length >= game.players.length - 1) {
      const counts = {};
      Object.values(game.votes).forEach(id => counts[id] = (counts[id]||0)+1);
      let max = 0, suspect = null;
      for (const [id, cnt] of Object.entries(counts)) if (cnt > max) { max = cnt; suspect = id; }
      const embed = new EmbedBuilder()
        .setTitle(suspect === game.hiderId ? '🎉 الباحثون فازوا!' : '😈 المختبئ فاز!')
        .setDescription(`المختبئ كان <@${game.hiderId}>.`)
        .setColor(suspect === game.hiderId ? 0x00ff00 : 0xff0000);
      if (serverImg) embed.setThumbnail(serverImg);
      message.channel.send({ embeds: [embed] });
      delete db.hideSeek[guildId];
      saveDB();
    }
    return;
  }

  // ========== [ كراسي ] ==========
  if (cmd === 'كراسي' || cmd === 'chairs') {
    if (db.musicalChairs[guildId]) return message.reply('⚠️ لعبة كراسي جارية.');
    db.musicalChairs[guildId] = { players: [], messageId: null, active: false };
    const embed = new EmbedBuilder()
      .setTitle('🪑 كراسي')
      .setDescription('انضم للعبة! عند البداية، سيتم إقصاء لاعب عشوائي كل جولة حتى يبقى واحد.')
      .setColor(MAIN_COLOR);
    if (serverImg) embed.setThumbnail(serverImg);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('join_chairs').setLabel('🪑 انضم').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('start_chairs').setLabel('▶️ ابدأ').setStyle(ButtonStyle.Success)
    );
    const msg = await message.channel.send({ embeds: [embed], components: [row] });
    db.musicalChairs[guildId].messageId = msg.id;
    saveDB();
    return message.delete().catch(()=>{});
  }

  // ========== [ اكس او ] ==========
  if (cmd === 'اكس_او' || cmd === 'xo') {
    const opponent = message.mentions.members.first();
    if (!opponent || opponent.id === message.author.id) return message.reply('⚠️ منشن خصمك.');
    if (db.ticTacToe[guildId]) return message.reply('⚠️ لعبة XO جارية.');
    const board = Array(9).fill(null);
    db.ticTacToe[guildId] = { players: [message.author.id, opponent.id], turn: message.author.id, board, messageId: null };
    const embed = new EmbedBuilder()
      .setTitle('❌⭕ اكس او')
      .setDescription(`<@${message.author.id}> (X) vs <@${opponent.id}> (O)\nدور <@${message.author.id}>`)
      .setColor(MAIN_COLOR);
    if (serverImg) embed.setThumbnail(serverImg);
    const rows = createTTTButtons(board);
    const msg = await message.channel.send({ embeds: [embed], components: rows });
    db.ticTacToe[guildId].messageId = msg.id;
    saveDB();
    return message.delete().catch(()=>{});
  }

  // ========== [ مافيا ] ==========
  if (cmd === 'مافيا' || cmd === 'mafia') {
    if (db.mafia[guildId]) return message.reply('⚠️ لعبة مافيا جارية.');
    db.mafia[guildId] = { players: [], phase: 'joining', roles: {}, nightKill: null, detectiveCheck: null, doctorSave: null, votes: {}, messageId: null };
    const embed = new EmbedBuilder()
      .setTitle('🕵️ مافيا')
      .setDescription('انضم للعبة (5 لاعبين فأكثر).\nستوزع الأدوار تلقائياً.\nمافيا - محقق - طبيب - مواطنين.')
      .setColor(MAIN_COLOR);
    if (serverImg) embed.setThumbnail(serverImg);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('join_mafia').setLabel('🕵️ انضم').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('start_mafia').setLabel('▶️ ابدأ').setStyle(ButtonStyle.Success)
    );
    const msg = await message.channel.send({ embeds: [embed], components: [row] });
    db.mafia[guildId].messageId = msg.id;
    saveDB();
    return message.delete().catch(()=>{});
  }
});

// ================== [ Interactions ] ==================
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;
  const guildId = interaction.guild.id;
  const config = getGuildConfig(guildId);
  const serverImg = getServerImage(interaction.guild, config);

  // --- Roulette Join/Leave ---
  if (interaction.customId === 'join_roulette') {
    const session = db.roulette[guildId];
    if (!session) return interaction.reply({ content: '⚠️ لا جلسة.', ephemeral: true });
    if (session.players.includes(interaction.user.id)) return interaction.reply({ content: '⚠️ منضم.', ephemeral: true });
    session.players.push(interaction.user.id);
    const msg = await interaction.channel.messages.fetch(session.messageId).catch(()=>null);
    if (msg) {
      const players = await fetchPlayers(interaction.guild, session.players);
      const buf = drawWheel(players);
      const att = new AttachmentBuilder(buf,{name:'wheel.png'});
      const embed = EmbedBuilder.from(msg.embeds[0])
        .setDescription(`**${session.players.length} لاعبين**\nاضغط للانضمام!\n\`!سحب\` للبدء\n**المشاركون:** ${session.players.map(p=>`<@${p}>`).join(', ')}`)
        .setImage('attachment://wheel.png');
      if (serverImg) embed.setThumbnail(serverImg);
      await msg.edit({ embeds: [embed], files: [att] });
    }
    saveDB();
    return interaction.reply({ content: '✅ انضممت.', ephemeral: true });
  }

  if (interaction.customId === 'leave_roulette') {
    const session = db.roulette[guildId];
    if (!session || !session.players.includes(interaction.user.id)) return interaction.reply({ content: '⚠️ غير منضم.', ephemeral: true });
    session.players = session.players.filter(id=>id!==interaction.user.id);
    const msg = await interaction.channel.messages.fetch(session.messageId).catch(()=>null);
    if (msg) {
      const players = await fetchPlayers(interaction.guild, session.players);
      const buf = drawWheel(players);
      const att = new AttachmentBuilder(buf,{name:'wheel.png'});
      const part = session.players.length ? session.players.map(p=>`<@${p}>`).join(', ') : 'لا أحد';
      const embed = EmbedBuilder.from(msg.embeds[0])
        .setDescription(`**${session.players.length} لاعبين**\n**المشاركون:** ${part}`)
        .setImage('attachment://wheel.png');
      if (serverImg) embed.setThumbnail(serverImg);
      await msg.edit({ embeds: [embed], files: [att] });
    }
    saveDB();
    return interaction.reply({ content: '🚫 خرجت.', ephemeral: true });
  }

  // --- Hide & Seek ---
  if (interaction.customId === 'join_hide') {
    const game = db.hideSeek[guildId];
    if (!game || game.phase !== 'joining') return interaction.reply({ content: '⚠️ لا يمكن.', ephemeral: true });
    if (game.players.includes(interaction.user.id)) return interaction.reply({ content: '⚠️ منضم.', ephemeral: true });
    game.players.push(interaction.user.id);
    interaction.reply({ content: '✅ انضممت.', ephemeral: true });
    saveDB();
  }

  if (interaction.customId === 'start_hide') {
    const game = db.hideSeek[guildId];
    if (!game || game.phase !== 'joining') return interaction.reply({ content: '⚠️ لا يمكن.', ephemeral: true });
    if (game.players.length < 3) return interaction.reply({ content: '⚠️ تحتاج 3 لاعبين.', ephemeral: true });
    game.phase = 'voting';
    game.hiderId = game.players[Math.floor(Math.random() * game.players.length)];
    game.votes = {};
    const msg = await interaction.channel.messages.fetch(game.messageId).catch(()=>null);
    if (msg) {
      const embed = new EmbedBuilder()
        .setTitle('🙈 بدأت!')
        .setDescription(`تم اختيار المختبئ.\nتناقشوا وصوتوا.\nاستخدم \`!تصويت @شخص\`\nاللاعبون: ${game.players.map(p=>`<@${p}>`).join(', ')}`)
        .setColor(MAIN_COLOR);
      if (serverImg) embed.setThumbnail(serverImg);
      await msg.edit({ embeds: [embed], components: [] });
    }
    try { await interaction.guild.members.cache.get(game.hiderId)?.send('🕵️ أنت المختبئ!'); } catch(e){}
    interaction.reply({ content: '✅ بدأت.', ephemeral: true });
    saveDB();
  }

  // --- Chairs ---
  if (interaction.customId === 'join_chairs') {
    const game = db.musicalChairs[guildId];
    if (!game || game.active) return interaction.reply({ content: '⚠️ لا يمكن.', ephemeral: true });
    if (game.players.includes(interaction.user.id)) return interaction.reply({ content: '⚠️ منضم.', ephemeral: true });
    game.players.push(interaction.user.id);
    interaction.reply({ content: '✅ انضممت.', ephemeral: true });
    saveDB();
  }

  if (interaction.customId === 'start_chairs') {
    const game = db.musicalChairs[guildId];
    if (!game || game.active) return interaction.reply({ content: '⚠️ لا يمكن.', ephemeral: true });
    if (game.players.length < 3) return interaction.reply({ content: '⚠️ تحتاج 3+.', ephemeral: true });
    game.active = true;
    interaction.reply('✅ بدأت!');
    const msg = await interaction.channel.messages.fetch(game.messageId).catch(()=>null);
    if (!msg) return;
    let remaining = [...game.players];
    while (remaining.length > 1) {
      const eliminated = remaining.splice(Math.floor(Math.random() * remaining.length), 1)[0];
      const embed = new EmbedBuilder()
        .setTitle('🪑 كراسي')
        .setDescription(`**المتبقون:** ${remaining.map(p=>`<@${p}>`).join(', ')}\n\n❌ **أقصي:** <@${eliminated}>`)
        .setColor(MAIN_COLOR);
      if (serverImg) embed.setThumbnail(serverImg);
      await msg.edit({ embeds: [embed] });
      await new Promise(r=>setTimeout(r,3000));
    }
    const winner = remaining[0];
    const embed = new EmbedBuilder()
      .setTitle('🏆 الفائز')
      .setDescription(`🎉 **<@${winner}>** ربح!`)
      .setColor(0x00ff00);
    if (serverImg) embed.setThumbnail(serverImg);
    await msg.edit({ embeds: [embed], components: [] });
    delete db.musicalChairs[guildId];
    saveDB();
  }

  // --- Tic Tac Toe ---
  if (interaction.customId.startsWith('ttt_')) {
    const game = db.ticTacToe[guildId];
    if (!game) return interaction.reply({ content: '⚠️ لا لعبة.', ephemeral: true });
    if (interaction.user.id !== game.turn) return interaction.reply({ content: '⚠️ ليس دورك.', ephemeral: true });
    const idx = parseInt(interaction.customId.split('_')[1]);
    if (game.board[idx] !== null) return interaction.reply({ content: '⚠️ مشغول.', ephemeral: true });
    const symbol = game.turn === game.players[0] ? 'X' : 'O';
    game.board[idx] = symbol;
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    let winner = null;
    for (const [a,b,c] of wins) if (game.board[a] && game.board[a]===game.board[b] && game.board[a]===game.board[c]) winner = game.board[a];
    if (winner || !game.board.includes(null)) {
      const desc = winner ? `🏆 **${winner === 'X' ? `<@${game.players[0]}>` : `<@${game.players[1]}>`}** فاز!` : '🤝 تعادل';
      const embed = new EmbedBuilder().setTitle('XO').setDescription(desc).setColor(MAIN_COLOR);
      if (serverImg) embed.setThumbnail(serverImg);
      await interaction.update({ embeds: [embed], components: [] });
      delete db.ticTacToe[guildId];
      saveDB();
      return;
    }
    game.turn = game.turn === game.players[0] ? game.players[1] : game.players[0];
    const rows = createTTTButtons(game.board);
    const embed = new EmbedBuilder().setTitle('XO').setDescription(`دور <@${game.turn}>`).setColor(MAIN_COLOR);
    if (serverImg) embed.setThumbnail(serverImg);
    await interaction.update({ embeds: [embed], components: rows });
    saveDB();
  }

  // --- Mafia ---
  if (interaction.customId === 'join_mafia') {
    const game = db.mafia[guildId];
    if (!game || game.phase !== 'joining') return interaction.reply({ content: '⚠️ لا يمكن.', ephemeral: true });
    if (game.players.includes(interaction.user.id)) return interaction.reply({ content: '⚠️ منضم.', ephemeral: true });
    game.players.push(interaction.user.id);
    interaction.reply({ content: '✅ انضممت.', ephemeral: true });
    saveDB();
  }

  if (interaction.customId === 'start_mafia') {
    const game = db.mafia[guildId];
    if (!game || game.phase !== 'joining') return interaction.reply({ content: '⚠️ لا يمكن.', ephemeral: true });
    if (game.players.length < 5) return interaction.reply({ content: '⚠️ تحتاج 5+.', ephemeral: true });
    const shuffled = shuffle([...game.players]);
    const mafiaCount = Math.max(1, Math.floor(shuffled.length / 3));
    const mafia = shuffled.slice(0, mafiaCount);
    const detective = shuffled[mafiaCount];
    const doctor = shuffled[mafiaCount + 1];
    game.roles = {};
    shuffled.forEach(id => {
      if (mafia.includes(id)) game.roles[id] = 'mafia';
      else if (id === detective) game.roles[id] = 'detective';
      else if (id === doctor) game.roles[id] = 'doctor';
      else game.roles[id] = 'citizen';
    });
    game.phase = 'night';
    for (const id of game.players) {
      try {
        const member = await interaction.guild.members.fetch(id);
        const roleName = game.roles[id] === 'mafia' ? 'مافيا' : game.roles[id] === 'detective' ? 'محقق' : game.roles[id] === 'doctor' ? 'طبيب' : 'مواطن';
        let extra = '';
        if (game.roles[id] === 'mafia') extra = '\nزملاؤك: ' + mafia.filter(i=>i!==id).map(i=>`<@${i}>`).join(', ');
        await member.send(`دورك: **${roleName}**${extra}`);
      } catch(e) {}
    }
    const msg = await interaction.channel.messages.fetch(game.messageId).catch(()=>null);
    if (msg) {
      const embed = new EmbedBuilder().setTitle('🕵️ مافيا - الليل').setDescription('الليل حل. المافيا تختار ضحية (خاص). المحقق يتحقق. الطبيب يحمي.').setColor(MAIN_COLOR);
      if (serverImg) embed.setThumbnail(serverImg);
      await msg.edit({ embeds: [embed], components: [] });
    }
    interaction.reply('✅ بدأت! تفقد الخاص.');
    saveDB();
  }
});

// ================== [ Login ] ==================
client.login(TOKEN).catch(e => { console.error('❌ Login failed:', e); process.exit(1); });
