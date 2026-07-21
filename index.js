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
  ChannelType,
  StringSelectMenuBuilder,
} = require('discord.js');
const { createCanvas, registerFont } = require('@napi-rs/canvas');
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

// ================== [ Web Server ] ==================
app.get('/', (req, res) => res.send('🟢 Games Bot is online'));
app.listen(port, () => console.log(`✅ Web server on port ${port}`));

// ================== [ Bot Init ] ==================
const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) { console.error('❌ DISCORD_TOKEN missing'); process.exit(1); }

// تسجيل الخط العربي
try {
  registerFont(path.join(__dirname, 'Cairo-Regular.ttf'), { family: 'Cairo' });
  console.log('✅ Arabic font registered');
} catch (e) { console.error('⚠️ Font registration failed:', e.message); }

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

// ================== [ Database ] ==================
const db = {
  roulette: {},      // { guildId: { players, messageId, channelId } }
  hideSeek: {},      // { guildId: { players, hiderId, phase, votes, messageId } }
  musicalChairs: {}, // { guildId: { players, messageId, round, active } }
  ticTacToe: {},     // { guildId: { challenge, board, turn, players } }
  mafia: {},         // { guildId: { players, roles, phase, nightKill, detectiveCheck, doctorSave, votes, messageId } }
};

function saveDB() { fs.writeFileSync('./db.json', JSON.stringify(db)); }
function loadDB() { try { Object.assign(db, JSON.parse(fs.readFileSync('./db.json', 'utf8'))); } catch(e){} }
loadDB();
setInterval(saveDB, 300000); // كل 5 دقائق

// ================== [ Theme Colors ] ==================
const MAIN_COLOR = 0xcc0000;
const DARK_BG = '#1a1a1a';
const ACCENT = '#ff4444';

// ================== [ Helper Functions ] ==================
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shuffle(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } return array; }

// ================== [ Roulette Canvas ] ==================
function drawWheel(players, rotationDegrees = 0, highlightIndex = -1) {
  const size = 600;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const centerX = size / 2, centerY = size / 2, radius = 240;

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, size, size);

  const colors = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#e67e22', '#1abc9c', '#e84393'];
  const numPlayers = players.length || 1;
  const anglePerSlice = (2 * Math.PI) / numPlayers;

  for (let i = 0; i < numPlayers; i++) {
    const startAngle = i * anglePerSlice + (rotationDegrees * Math.PI) / 180 - Math.PI / 2;
    const endAngle = startAngle + anglePerSlice;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = i === highlightIndex ? '#ffd700' : colors[i % colors.length];
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    const textAngle = startAngle + anglePerSlice / 2;
    const textX = centerX + Math.cos(textAngle) * radius * 0.65;
    const textY = centerY + Math.sin(textAngle) * radius * 0.65;

    ctx.save();
    ctx.translate(textX, textY);
    ctx.rotate(textAngle + Math.PI / 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px "Cairo", Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let name = players[i]?.displayName || `لاعب ${i+1}`;
    if (name.length > 10) name = name.slice(0,9)+'…';
    ctx.fillText(name, 0, 0);
    ctx.restore();
  }

  // مركز
  ctx.beginPath();
  ctx.arc(centerX, centerY, 55, 0, 2*Math.PI);
  ctx.fillStyle = '#2c3e50';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎡', centerX, centerY);

  // مؤشر
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - radius -5);
  ctx.lineTo(centerX-25, centerY - radius -40);
  ctx.lineTo(centerX+25, centerY - radius -40);
  ctx.closePath();
  ctx.fillStyle = '#ff0000';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.stroke();

  // إطار
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius+18, 0, 2*Math.PI);
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 8;
  ctx.stroke();

  return canvas.toBuffer('image/png');
}

async function fetchPlayers(guild, ids) {
  const arr = [];
  for (const id of ids) {
    const m = await guild.members.fetch(id).catch(() => null);
    arr.push(m ? { displayName: m.displayName } : { displayName: 'غير معروف' });
  }
  return arr;
}

// ================== [ Ready Event ] ==================
client.once('ready', () => {
  console.log(`✅ ${client.user.tag} ready`);
  client.user.setActivity('🎲 !ألعاب', { type: ActivityType.Playing });
});

// ================== [ Main Command Handler ] ==================
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith('!')) return;
  const args = message.content.slice(1).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();
  const guildId = message.guild.id;

  // ========== [ قائمة الألعاب ] ==========
  if (cmd === 'العاب' || cmd === 'games') {
    const embed = new EmbedBuilder()
      .setTitle('🎮 قائمة الألعاب')
      .setColor(MAIN_COLOR)
      .setDescription(
        `🎡 **روليت** \`!روليت\`\n`+
        `🙈 **اختباء** \`!اختباء\`\n`+
        `🪑 **كراسي** \`!كراسي\`\n`+
        `❌⭕ **اكس او** \`!اكس_او\`\n`+
        `🕵️ **مافيا** \`!مافيا\`\n`+
        `\n استخدم الأمر لبدء اللعبة`
      )
      .setImage('https://i.imgur.com/8qSkMlQ.png') // صورة عامة
      .setFooter({ text: 'جميع الألعاب بثيم الأسود والأحمر الداكن' });
    return message.channel.send({ embeds: [embed] });
  }

  // ========== [ ROULETTE ] ==========
  if (cmd === 'روليت' || cmd === 'roulette') {
    // existing roulette code (simplified: we'll call start)
    if (!db.roulette[guildId]) {
      db.roulette[guildId] = { players: [], messageId: null, channelId: message.channel.id };
    }
    const session = db.roulette[guildId];
    if (session.players.length > 0) return message.reply('⚠️ جلسة روليت نشطة بالفعل.');
    const buf = drawWheel([]);
    const att = new AttachmentBuilder(buf, { name: 'wheel.png' });
    const embed = new EmbedBuilder()
      .setTitle('🎡 روليت السيرفر')
      .setDescription(`**0 لاعبين**\nاضغط للانضمام!\n\`!سحب\` لبدء السحب\n\`!الغاء\` للإلغاء`)
      .setColor(MAIN_COLOR)
      .setImage('attachment://wheel.png')
      .setFooter({ text: '🎡 استعد' });
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('join_roulette').setLabel('🎯 انضم').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('leave_roulette').setLabel('🚫 خروج').setStyle(ButtonStyle.Danger)
    );
    const msg = await message.channel.send({ embeds: [embed], components: [row], files: [att] });
    session.messageId = msg.id;
    session.channelId = message.channel.id;
    session.players = [];
    saveDB();
    return message.delete().catch(()=>{});
  }

  if (cmd === 'سحب' || cmd === 'spin') {
    const session = db.roulette[guildId];
    if (!session || session.players.length < 2) return message.reply('⚠️ جلسة غير متاحة أو تحتاج لاعبين.');
    const msg = await message.channel.messages.fetch(session.messageId).catch(()=>null);
    if (!msg) { delete db.roulette[guildId]; return message.reply('❌ انتهت الجلسة.'); }
    const players = await fetchPlayers(message.guild, session.players);
    const listText = session.players.map((id,i)=>`**${i+1}.** <@${id}>`).join('\n');

    for (let c=3; c>=1; c--) {
      const b = drawWheel(players);
      const a = new AttachmentBuilder(b,{name:'wheel.png'});
      await msg.edit({ embeds: [new EmbedBuilder().setTitle('🎡 جاري السحب').setDescription(`${listText}\n🔄 **${c}**`).setColor(0xffaa00).setImage('attachment://wheel.png')], files:[a] });
      await new Promise(r=>setTimeout(r,1000));
    }

    const totalDeg = 360*3+Math.floor(Math.random()*360);
    for (let f=0; f<=20; f++) {
      const rot = f*(totalDeg/20);
      const b = drawWheel(players, rot);
      const a = new AttachmentBuilder(b,{name:'wheel.png'});
      await msg.edit({ embeds: [new EmbedBuilder().setTitle('🎡 تدور!').setDescription(`${listText}\n🔄 تدور...`).setColor(0xffaa00).setImage('attachment://wheel.png')], files:[a] });
      await new Promise(r=>setTimeout(r,250));
    }

    const finalRot = totalDeg % 360;
    const anglePerSlice = 360 / session.players.length;
    const normalized = (360 - (finalRot % 360)) % 360;
    const winIdx = Math.floor(normalized / anglePerSlice) % session.players.length;
    const winner = session.players[winIdx];
    const finalBuf = drawWheel(players, finalRot, winIdx);
    const finalAtt = new AttachmentBuilder(finalBuf,{name:'wheel.png'});
    await msg.edit({ embeds: [new EmbedBuilder().setTitle('🏆 فائز!').setDescription(`${listText}\n🎉 **<@${winner}>**`).setColor(0x00ff00).setImage('attachment://wheel.png')], files:[finalAtt] });
    message.channel.send({ embeds: [new EmbedBuilder().setTitle('🎉 مبروك').setDescription(`**<@${winner}>** فاز!`).setColor(0x00ff00)] });
    delete db.roulette[guildId];
    saveDB();
    return;
  }

  if (cmd === 'الغاء' || cmd === 'cancel') {
    const session = db.roulette[guildId];
    if (!session) return message.reply('⚠️ لا جلسة.');
    const msg = await message.channel.messages.fetch(session.messageId).catch(()=>null);
    if (msg) await msg.edit({ embeds: [new EmbedBuilder().setTitle('🚫 ألغيت').setColor(0xff0000).setDescription('تم الإلغاء')], components:[] });
    delete db.roulette[guildId];
    saveDB();
    return message.reply('✅ ألغيت.');
  }

  // ========== [ HIDE AND SEEK ] ==========
  if (cmd === 'اختباء' || cmd === 'hide') {
    if (db.hideSeek[guildId]) return message.reply('⚠️ لعبة اختباء جارية.');
    db.hideSeek[guildId] = { players: [], phase: 'joining', votes: {}, messageId: null, hiderId: null };
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('join_hide').setLabel('🙈 انضم').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('start_hide').setLabel('▶️ ابدأ').setStyle(ButtonStyle.Success)
    );
    const embed = new EmbedBuilder()
      .setTitle('🙈 اختباء')
      .setDescription('انضم للعبة! بعد البداية، سيختار البوت مختبئاً واحداً.\nعلى الآخرين مناقشة والتصويت على من هو المختبئ.')
      .setColor(MAIN_COLOR);
    const msg = await message.channel.send({ embeds: [embed], components: [row] });
    db.hideSeek[guildId].messageId = msg.id;
    saveDB();
    return message.delete().catch(()=>{});
  }

  if (cmd === 'تصويت' || cmd === 'vote') {
    const game = db.hideSeek[guildId];
    if (!game || game.phase !== 'voting') return message.reply('⚠️ لا يوجد تصويت الآن.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('⚠️ منشن الشخص.');
    if (!game.players.includes(target.id)) return message.reply('⚠️ ليس لاعباً.');
    if (game.votes[message.author.id]) return message.reply('⚠️ صوتت بالفعل.');
    game.votes[message.author.id] = target.id;
    message.reply(`✅ صوتت لـ ${target}.`);
    const totalVotes = Object.keys(game.votes).length;
    if (totalVotes >= game.players.length - 1) {
      // انتهاء التصويت
      const counts = {};
      Object.values(game.votes).forEach(id => counts[id] = (counts[id]||0)+1);
      let max = 0, suspected = null;
      for (const [id, cnt] of Object.entries(counts)) if (cnt > max) { max = cnt; suspected = id; }
      if (suspected === game.hiderId) {
        message.channel.send(`🎉 **صح!** المختبئ كان <@${game.hiderId}>. فاز الباحثون!`);
      } else {
        message.channel.send(`❌ **خطأ!** المختبئ كان <@${game.hiderId}>. فاز المختبئ!`);
      }
      delete db.hideSeek[guildId];
      saveDB();
    }
    return;
  }

  // ========== [ MUSICAL CHAIRS ] ==========
  if (cmd === 'كراسي' || cmd === 'chairs') {
    if (db.musicalChairs[guildId]) return message.reply('⚠️ لعبة كراسي جارية.');
    db.musicalChairs[guildId] = { players: [], messageId: null, active: false };
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('join_chairs').setLabel('🪑 انضم').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('start_chairs').setLabel('▶️ ابدأ').setStyle(ButtonStyle.Success)
    );
    const embed = new EmbedBuilder().setTitle('🪑 كراسي').setDescription('انضم للعبة! عند البدء، سيُقصى لاعب عشوائي كل جولة حتى يبقى واحد.').setColor(MAIN_COLOR);
    const msg = await message.channel.send({ embeds: [embed], components: [row] });
    db.musicalChairs[guildId].messageId = msg.id;
    saveDB();
    return message.delete().catch(()=>{});
  }

  // ========== [ TIC TAC TOE ] ==========
  if (cmd === 'اكس_او' || cmd === 'tictactoe') {
    const opponent = message.mentions.members.first();
    if (!opponent || opponent.id === message.author.id) return message.reply('⚠️ منشن خصمك.');
    if (db.ticTacToe[guildId]) return message.reply('⚠️ لعبة XO جارية.');
    const board = Array(9).fill(null);
    db.ticTacToe[guildId] = {
      players: [message.author.id, opponent.id],
      turn: message.author.id,
      board,
      messageId: null,
    };
    const row = createTTTButtons(board);
    const embed = new EmbedBuilder().setTitle('❌⭕ اكس او').setDescription(`<@${message.author.id}> (X) vs <@${opponent.id}> (O)\nدور <@${message.author.id}>`).setColor(MAIN_COLOR);
    const msg = await message.channel.send({ embeds: [embed], components: [row] });
    db.ticTacToe[guildId].messageId = msg.id;
    saveDB();
    return message.delete().catch(()=>{});
  }

  // ========== [ MAFIA ] ==========
  if (cmd === 'مافيا' || cmd === 'mafia') {
    if (db.mafia[guildId]) return message.reply('⚠️ لعبة مافيا جارية.');
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('join_mafia').setLabel('🕵️ انضم').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('start_mafia').setLabel('▶️ ابدأ').setStyle(ButtonStyle.Success)
    );
    const embed = new EmbedBuilder().setTitle('🕵️ مافيا').setDescription('انضم للعبة (5-12 لاعب).\nستوزع الأدوار تلقائياً.\nمافيا - محقق - طبيب - مواطنين.').setColor(MAIN_COLOR);
    const msg = await message.channel.send({ embeds: [embed], components: [row] });
    db.mafia[guildId] = { players: [], phase: 'joining', roles: {}, nightKill: null, detectiveCheck: null, doctorSave: null, votes: {}, messageId: msg.id };
    saveDB();
    return message.delete().catch(()=>{});
  }
});

// ================== [ Button Interactions ] ==================
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;
  const guildId = interaction.guild.id;

  // ---- Roulette ----
  if (interaction.customId === 'join_roulette') {
    const session = db.roulette[guildId];
    if (!session) return interaction.reply({ content: '⚠️ لا جلسة.', ephemeral: true });
    if (session.players.includes(interaction.user.id)) return interaction.reply({ content: '⚠️ منضم.', ephemeral: true });
    session.players.push(interaction.user.id);
    // update message
    const msg = await interaction.channel.messages.fetch(session.messageId).catch(()=>null);
    if (msg) {
      const players = await fetchPlayers(interaction.guild, session.players);
      const buf = drawWheel(players);
      const att = new AttachmentBuilder(buf,{name:'wheel.png'});
      const embed = EmbedBuilder.from(msg.embeds[0]).setDescription(`**${session.players.length} لاعبين**\nاضغط للانضمام!\n\`!سحب\` للبدء\n**المشاركون:** ${session.players.map(p=>`<@${p}>`).join(', ')}`).setImage('attachment://wheel.png');
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
      const embed = EmbedBuilder.from(msg.embeds[0]).setDescription(`**${session.players.length} لاعبين**\nاضغط للانضمام!\n**المشاركون:** ${part}`).setImage('attachment://wheel.png');
      await msg.edit({ embeds: [embed], files: [att] });
    }
    saveDB();
    return interaction.reply({ content: '🚫 خرجت.', ephemeral: true });
  }

  // ---- Hide and Seek ----
  if (interaction.customId === 'join_hide') {
    const game = db.hideSeek[guildId];
    if (!game || game.phase !== 'joining') return interaction.reply({ content: '⚠️ لا يمكن الآن.', ephemeral: true });
    if (game.players.includes(interaction.user.id)) return interaction.reply({ content: '⚠️ منضم.', ephemeral: true });
    game.players.push(interaction.user.id);
    interaction.reply({ content: '✅ انضممت.', ephemeral: true });
    saveDB();
  }
  if (interaction.customId === 'start_hide') {
    const game = db.hideSeek[guildId];
    if (!game || game.phase !== 'joining') return interaction.reply({ content: '⚠️ لا يمكن.', ephemeral: true });
    if (game.players.length < 3) return interaction.reply({ content: '⚠️ تحتاج 3 لاعبين على الأقل.', ephemeral: true });
    game.phase = 'voting';
    game.hiderId = game.players[Math.floor(Math.random() * game.players.length)];
    game.votes = {};
    // إرسال رسالة بدء
    const msg = await interaction.channel.messages.fetch(game.messageId).catch(()=>null);
    if (msg) {
      const embed = new EmbedBuilder()
        .setTitle('🙈 بدأت اللعبة!')
        .setDescription(`تم اختيار المختبئ.\nتناقشوا وصوتوا على الشخص الذي تشكون به.\nاستخدم \`!تصويت @شخص\` للتصويت.\nاللاعبون: ${game.players.map(p=>`<@${p}>`).join(', ')}`)
        .setColor(MAIN_COLOR);
      await msg.edit({ embeds: [embed], components: [] });
    }
    // إرسال للمختبئ سره
    try { await interaction.guild.members.cache.get(game.hiderId)?.send('🕵️ أنت المختبئ! حاول ألا ينكشف.'); } catch(e){}
    interaction.reply({ content: '✅ بدأت اللعبة.', ephemeral: true });
    saveDB();
  }

  // ---- Musical Chairs ----
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
    if (game.players.length < 3) return interaction.reply({ content: '⚠️ تحتاج 3+ لاعبين.', ephemeral: true });
    game.active = true;
    interaction.reply('✅ بدأت الكراسي!');
    const msg = await interaction.channel.messages.fetch(game.messageId).catch(()=>null);
    if (!msg) return;
    let remaining = [...game.players];
    while (remaining.length > 1) {
      // قائمة الكراسي
      const eliminated = remaining.splice(Math.floor(Math.random() * remaining.length), 1)[0];
      const embed = new EmbedBuilder()
        .setTitle('🪑 كراسي')
        .setDescription(`**اللاعبون المتبقون:** ${remaining.map(p=>`<@${p}>`).join(', ')}\n\n❌ **تم إقصاء:** <@${eliminated}>`)
        .setColor(MAIN_COLOR)
        .setFooter({ text: `العدد: ${remaining.length}` });
      await msg.edit({ embeds: [embed] });
      await new Promise(r=>setTimeout(r,3000));
    }
    const winner = remaining[0];
    const embed = new EmbedBuilder()
      .setTitle('🏆 الفائز')
      .setDescription(`🎉 **<@${winner}>** ربح لعبة الكراسي!`)
      .setColor(0x00ff00);
    await msg.edit({ embeds: [embed], components: [] });
    delete db.musicalChairs[guildId];
    saveDB();
  }

  // ---- Tic Tac Toe ----
  if (interaction.customId.startsWith('ttt_')) {
    const game = db.ticTacToe[guildId];
    if (!game) return interaction.reply({ content: '⚠️ لا لعبة.', ephemeral: true });
    if (interaction.user.id !== game.turn) return interaction.reply({ content: '⚠️ ليس دورك.', ephemeral: true });
    const idx = parseInt(interaction.customId.split('_')[1]);
    if (game.board[idx] !== null) return interaction.reply({ content: '⚠️ مربع مشغول.', ephemeral: true });
    const symbol = game.turn === game.players[0] ? 'X' : 'O';
    game.board[idx] = symbol;
    // فحص فوز
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    let winner = null;
    for (const [a,b,c] of wins) if (game.board[a] && game.board[a]===game.board[b] && game.board[a]===game.board[c]) winner = game.board[a];
    if (winner || !game.board.includes(null)) {
      const desc = winner ? `🏆 **${winner === 'X' ? `<@${game.players[0]}>` : `<@${game.players[1]}>`}** فاز!` : `🤝 تعادل`;
      await interaction.update({ embeds: [new EmbedBuilder().setTitle('XO').setDescription(desc).setColor(MAIN_COLOR)], components: [] });
      delete db.ticTacToe[guildId];
      saveDB();
      return;
    }
    game.turn = game.turn === game.players[0] ? game.players[1] : game.players[0];
    const row = createTTTButtons(game.board);
    const embed = new EmbedBuilder().setTitle('XO').setDescription(`دور <@${game.turn}>`).setColor(MAIN_COLOR);
    await interaction.update({ embeds: [embed], components: [row] });
    saveDB();
  }

  // ---- Mafia ----
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
    if (game.players.length < 5) return interaction.reply({ content: '⚠️ تحتاج 5 لاعبين على الأقل.', ephemeral: true });
    const shuffled = shuffle([...game.players]);
    const mafia = shuffled.slice(0, Math.floor(shuffled.length/3));
    const detective = shuffled[shuffled.length-2];
    const doctor = shuffled[shuffled.length-1];
    game.roles = {};
    shuffled.forEach(id => { if (mafia.includes(id)) game.roles[id] = 'mafia'; else if (id === detective) game.roles[id] = 'detective'; else if (id === doctor) game.roles[id] = 'doctor'; else game.roles[id] = 'citizen'; });
    game.phase = 'night';
    game.nightKill = null;
    game.detectiveCheck = null;
    game.doctorSave = null;
    // إرسال الأدوار في الخاص
    for (const id of game.players) {
      try {
        const member = await interaction.guild.members.fetch(id);
        await member.send(`دورك: **${game.roles[id] === 'mafia' ? 'مافيا' : game.roles[id] === 'detective' ? 'محقق' : game.roles[id] === 'doctor' ? 'طبيب' : 'مواطن'}**\n${game.roles[id] === 'mafia' ? 'زملاؤك: '+mafia.filter(i=>i!==id).map(i=>`<@${i}>`).join(', ') : ''}`);
      } catch(e) {}
    }
    const msg = await interaction.channel.messages.fetch(game.messageId).catch(()=>null);
    if (msg) {
      await msg.edit({ embeds: [new EmbedBuilder().setTitle('🕵️ مافيا - الليل').setDescription('الليل حل. المافيا تختار ضحية (خاص). المحقق يتحقق. الطبيب يحمي.').setColor(MAIN_COLOR)], components: [] });
    }
    interaction.reply('✅ بدأت اللعبة! تفقد الخاص.');
    saveDB();
    // هنا نكتفي بالدور الأول، ويمكن تبسيط باقي المراحل أوامر منفصلة للمستخدمين. سنتركها كمرحلة ليل فقط للاختصار.
  }
});

// ================== [ Tic Tac Toe Buttons ] ==================
function createTTTButtons(board) {
  const rows = [];
  for (let i=0; i<3; i++) {
    const row = new ActionRowBuilder();
    for (let j=0; j<3; j++) {
      const idx = i*3+j;
      const label = board[idx] || '⬛';
      row.addComponents(new ButtonBuilder().setCustomId(`ttt_${idx}`).setLabel(label).setStyle(ButtonStyle.Secondary).setDisabled(!!board[idx]));
    }
    rows.push(row);
  }
  return rows;
}

// ================== [ Bot Login ] ==================
client.login(TOKEN).catch(e => { console.error('❌ Login failed:', e); process.exit(1); });
