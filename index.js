const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  ActivityType,
} = require('discord.js');
const express = require('express');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('🟢 Bot is online'));
app.listen(port, () => console.log(`✅ Web server on port ${port}`));

const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) { console.error('❌ DISCORD_TOKEN غير موجود'); process.exit(1); }

// ========== قاعدة البيانات ==========
const db = {
  users: {},
  gameCooldowns: {},
};

function saveDB() { try { fs.writeFileSync('./database.json', JSON.stringify(db, null, 2)); } catch (e) {} }
function loadDB() { try { const data = fs.readFileSync('./database.json', 'utf8'); Object.assign(db, JSON.parse(data)); } catch (e) {} }
loadDB();
setInterval(saveDB, 60000);

// ========== دوال مساعدة ==========
function getUser(userId) {
  if (!db.users[userId]) {
    db.users[userId] = { balance: 1000, lastDaily: null, gamesPlayed: 0, wins: 0 };
  }
  return db.users[userId];
}

function getBalance(userId) {
  return getUser(userId).balance;
}

function setBalance(userId, amount) {
  const user = getUser(userId);
  user.balance = amount;
  return user.balance;
}

function checkCooldown(userId, game, cooldownSeconds = 10) {
  const key = `${userId}-${game}`;
  if (db.gameCooldowns[key] && Date.now() - db.gameCooldowns[key] < cooldownSeconds * 1000) {
    return Math.ceil((cooldownSeconds * 1000 - (Date.now() - db.gameCooldowns[key])) / 1000);
  }
  db.gameCooldowns[key] = Date.now();
  return 0;
}

function randomColor() {
  const colors = ['🔴', '⚫', '🟢'];
  const weights = [18, 18, 1];
  const total = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    rand -= weights[i];
    if (rand < 0) return colors[i];
  }
  return '⚫';
}

function randomNumber() {
  return Math.floor(Math.random() * 37);
}

// ========== العميل ==========
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once('ready', () => {
  console.log(`✅ البوت جاهز باسم ${client.user.tag}`);
  client.user.setActivity('🎮 !ألعاب', { type: ActivityType.Playing });
});

// ============================================================
// ========== الأوامر ==========
// ============================================================

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();
  const userId = message.author.id;
  const user = getUser(userId);

  // ========== الرصيد ==========
  if (cmd === 'رصيد') {
    const member = message.mentions.members.first() || message.member;
    const balance = getBalance(member.id);
    const embed = new EmbedBuilder()
      .setTitle(`💰 رصيد ${member.user.username}`)
      .setDescription(`الرصيد: **${balance}** دولار`)
      .setColor(0xcc0000)
      .setFooter({ text: `🎮 العاب | ${member.user.tag}` })
      .setTimestamp();
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // ========== يومية ==========
  if (cmd === 'يومية') {
    const userData = getUser(userId);
    if (userData.lastDaily) {
      const last = new Date(userData.lastDaily);
      const now = new Date();
      if (now - last < 86400000) {
        const remaining = 86400000 - (now - last);
        const hours = Math.floor(remaining / 3600000);
        const minutes = Math.floor((remaining % 3600000) / 60000);
        return message.reply(`⏳ متبقي: ${hours} ساعة و ${minutes} دقيقة.`);
      }
    }
    const reward = Math.floor(Math.random() * 500) + 200;
    userData.balance += reward;
    userData.lastDaily = new Date().toISOString();
    saveDB();
    await message.reply(`🎁 حصلت على **${reward}** دولار كهدية يومية!`);
    return;
  }

  // ========== قائمة الألعاب ==========
  if (cmd === 'ألعاب') {
    const embed = new EmbedBuilder()
      .setTitle('🎮 قائمة الألعاب')
      .setColor(0xcc0000)
      .setDescription(
        `🎰 **روليت** – !روليت [مبلغ] [لون/رقم]\n` +
        `   الألوان: 🔴 أحمر، ⚫ أسود، 🟢 أخضر (صفر)\n` +
        `   الأرقام: 0-36\n` +
        `♻️ **ريبيلكا** – !ريبيلكا [مبلغ]\n` +
        `✊ **حجر ورقة مقص** – !rps [مبلغ] [حجر/ورقة/مقص]\n` +
        `🎲 **رمية النرد** – !نرد [مبلغ] [رقم 1-6]\n` +
        `🔢 **تخمين الرقم** – !تخمين [مبلغ] [رقم 1-20]\n` +
        `🃏 **سحب بطاقة** – !بطاقة [مبلغ]\n` +
        `🎰 **سلوت** – !سلوت [مبلغ]\n` +
        `🃏 **بلاك جاك** – !بلاك [مبلغ]\n` +
        `\n💰 **رصيدك:** ${user.balance} دولار`
      )
      .setTimestamp();
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // ========== روليت ==========
  if (cmd === 'روليت') {
    const amount = parseInt(args[0]);
    const bet = args.slice(1).join(' ');
    if (!amount || amount <= 0) return message.reply('⚠️ أدخل مبلغاً موجباً.');
    if (amount > user.balance) return message.reply(`⚠️ رصيدك غير كافٍ. لديك ${user.balance} دولار.`);
    const cooldown = checkCooldown(userId, 'roulette', 5);
    if (cooldown) return message.reply(`⏳ انتظر ${cooldown} ثانية قبل اللعب مرة أخرى.`);

    let winMultiplier = 0;
    let resultColor = '';
    let resultNumber = 0;
    let win = false;

    const isNumber = !isNaN(bet) && parseInt(bet) >= 0 && parseInt(bet) <= 36;
    const isColor = ['🔴', '⚫', '🟢', 'أحمر', 'أسود', 'أخضر', 'red', 'black', 'green'].includes(bet?.toLowerCase());

    if (isNumber) {
      resultNumber = randomNumber();
      resultColor = resultNumber === 0 ? '🟢' : resultNumber % 2 === 0 ? '⚫' : '🔴';
      if (parseInt(bet) === resultNumber) { win = true; winMultiplier = 36; }
    } else if (isColor) {
      resultNumber = randomNumber();
      resultColor = resultNumber === 0 ? '🟢' : resultNumber % 2 === 0 ? '⚫' : '🔴';
      const betColor = bet.includes('أحمر') || bet.includes('red') ? '🔴'
        : bet.includes('أسود') || bet.includes('black') ? '⚫'
        : '🟢';
      if (betColor === resultColor) { win = true; winMultiplier = betColor === '🟢' ? 14 : 2; }
    } else {
      return message.reply('⚠️ راهن على لون (🔴 أحمر، ⚫ أسود، 🟢 أخضر) أو رقم (0-36)');
    }

    const winAmount = win ? amount * winMultiplier : 0;
    const newBalance = win ? user.balance + winAmount - amount : user.balance - amount;
    setBalance(userId, newBalance);
    user.gamesPlayed += 1;
    if (win) user.wins += 1;
    saveDB();

    const embed = new EmbedBuilder()
      .setTitle('🎰 روليت')
      .setColor(win ? 0x00ff00 : 0xff0000)
      .setDescription(
        `**النتيجة:** ${resultColor} **${resultNumber}**\n` +
        `${win ? `🎉 **فزت!** +${winAmount} دولار` : `😔 **خسرت!** -${amount} دولار`}\n` +
        `**الرصيد الجديد:** ${newBalance} دولار`
      )
      .setTimestamp();
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // ========== ريبيلكا ==========
  if (cmd === 'ريبيلكا') {
    const amount = parseInt(args[0]);
    if (!amount || amount <= 0) return message.reply('⚠️ أدخل مبلغاً موجباً.');
    if (amount > user.balance) return message.reply(`⚠️ رصيدك غير كافٍ. لديك ${user.balance} دولار.`);
    const cooldown = checkCooldown(userId, 'replica', 5);
    if (cooldown) return message.reply(`⏳ انتظر ${cooldown} ثانية قبل اللعب مرة أخرى.`);

    const symbols = ['🍒', '🍋', '🍊', '🍇', '🔔', '💎', '7️⃣', '⭐'];
    const reel1 = symbols[Math.floor(Math.random() * symbols.length)];
    const reel2 = symbols[Math.floor(Math.random() * symbols.length)];
    const reel3 = symbols[Math.floor(Math.random() * symbols.length)];

    let win = false;
    let winMultiplier = 0;

    if (reel1 === reel2 && reel2 === reel3) {
      win = true;
      winMultiplier = reel1 === '💎' ? 10 : reel1 === '7️⃣' ? 7 : reel1 === '⭐' ? 5 : 3;
    } else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
      win = true;
      winMultiplier = 2;
    }

    const winAmount = win ? amount * winMultiplier : 0;
    const newBalance = win ? user.balance + winAmount - amount : user.balance - amount;
    setBalance(userId, newBalance);
    user.gamesPlayed += 1;
    if (win) user.wins += 1;
    saveDB();

    const embed = new EmbedBuilder()
      .setTitle('♻️ ريبيلكا')
      .setColor(win ? 0x00ff00 : 0xff0000)
      .setDescription(
        `**${reel1} | ${reel2} | ${reel3}**\n` +
        `${win ? `🎉 **فزت!** +${winAmount} دولار (x${winMultiplier})` : `😔 **خسرت!** -${amount} دولار`}\n` +
        `**الرصيد الجديد:** ${newBalance} دولار`
      )
      .setTimestamp();
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // ========== حجر ورقة مقص ==========
  if (cmd === 'rps' || cmd === 'حجر') {
    const amount = parseInt(args[0]);
    const choice = args[1]?.toLowerCase();
    if (!amount || amount <= 0) return message.reply('⚠️ أدخل مبلغاً موجباً.');
    if (amount > user.balance) return message.reply(`⚠️ رصيدك غير كافٍ. لديك ${user.balance} دولار.`);
    if (!['حجر', 'ورقة', 'مقص'].includes(choice)) return message.reply('⚠️ اختر: حجر، ورقة، أو مقص.');
    const cooldown = checkCooldown(userId, 'rps', 3);
    if (cooldown) return message.reply(`⏳ انتظر ${cooldown} ثانية قبل اللعب مرة أخرى.`);

    const botChoice = ['حجر', 'ورقة', 'مقص'][Math.floor(Math.random() * 3)];
    const emojis = { 'حجر': '🪨', 'ورقة': '📄', 'مقص': '✂️' };
    let win = false;

    if (choice === botChoice) {
      const embed = new EmbedBuilder()
        .setTitle('✊ حجر ورقة مقص')
        .setColor(0xffaa00)
        .setDescription(
          `أنت: ${emojis[choice]} | البوت: ${emojis[botChoice]}\n` +
          `🤝 **تعادل!** استعد رصيدك.\n**الرصيد:** ${user.balance} دولار`
        )
        .setTimestamp();
      await message.channel.send({ embeds: [embed] });
      return;
    }

    if (
      (choice === 'حجر' && botChoice === 'مقص') ||
      (choice === 'ورقة' && botChoice === 'حجر') ||
      (choice === 'مقص' && botChoice === 'ورقة')
    ) {
      win = true;
    }

    const winAmount = win ? amount * 2 : 0;
    const newBalance = win ? user.balance + winAmount - amount : user.balance - amount;
    setBalance(userId, newBalance);
    user.gamesPlayed += 1;
    if (win) user.wins += 1;
    saveDB();

    const embed = new EmbedBuilder()
      .setTitle('✊ حجر ورقة مقص')
      .setColor(win ? 0x00ff00 : 0xff0000)
      .setDescription(
        `أنت: ${emojis[choice]} | البوت: ${emojis[botChoice]}\n` +
        `${win ? `🎉 **فزت!** +${winAmount} دولار` : `😔 **خسرت!** -${amount} دولار`}\n` +
        `**الرصيد الجديد:** ${newBalance} دولار`
      )
      .setTimestamp();
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // ========== نرد ==========
  if (cmd === 'نرد') {
    const amount = parseInt(args[0]);
    const guess = parseInt(args[1]);
    if (!amount || amount <= 0) return message.reply('⚠️ أدخل مبلغاً موجباً.');
    if (amount > user.balance) return message.reply(`⚠️ رصيدك غير كافٍ. لديك ${user.balance} دولار.`);
    if (!guess || guess < 1 || guess > 6) return message.reply('⚠️ خمّن رقماً بين 1 و 6.');
    const cooldown = checkCooldown(userId, 'dice', 3);
    if (cooldown) return message.reply(`⏳ انتظر ${cooldown} ثانية قبل اللعب مرة أخرى.`);

    const result = Math.floor(Math.random() * 6) + 1;
    const win = guess === result;
    const winAmount = win ? amount * 6 : 0;
    const newBalance = win ? user.balance + winAmount - amount : user.balance - amount;
    setBalance(userId, newBalance);
    user.gamesPlayed += 1;
    if (win) user.wins += 1;
    saveDB();

    const embed = new EmbedBuilder()
      .setTitle('🎲 رمية النرد')
      .setColor(win ? 0x00ff00 : 0xff0000)
      .setDescription(
        `🎲 النتيجة: **${result}**\n` +
        `${win ? `🎉 **فزت!** +${winAmount} دولار (x6)` : `😔 **خسرت!** -${amount} دولار`}\n` +
        `**الرصيد الجديد:** ${newBalance} دولار`
      )
      .setTimestamp();
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // ========== تخمين ==========
  if (cmd === 'تخمين') {
    const amount = parseInt(args[0]);
    const guess = parseInt(args[1]);
    if (!amount || amount <= 0) return message.reply('⚠️ أدخل مبلغاً موجباً.');
    if (amount > user.balance) return message.reply(`⚠️ رصيدك غير كافٍ. لديك ${user.balance} دولار.`);
    if (!guess || guess < 1 || guess > 20) return message.reply('⚠️ خمّن رقماً بين 1 و 20.');
    const cooldown = checkCooldown(userId, 'guess', 3);
    if (cooldown) return message.reply(`⏳ انتظر ${cooldown} ثانية قبل اللعب مرة أخرى.`);

    const result = Math.floor(Math.random() * 20) + 1;
    const diff = Math.abs(guess - result);
    let win = false;
    let winMultiplier = 0;

    if (guess === result) { win = true; winMultiplier = 10; }
    else if (diff <= 2) { win = true; winMultiplier = 3; }
    else if (diff <= 5) { win = true; winMultiplier = 1.5; }

    const winAmount = win ? Math.floor(amount * winMultiplier) : 0;
    const newBalance = win ? user.balance + winAmount - amount : user.balance - amount;
    setBalance(userId, newBalance);
    user.gamesPlayed += 1;
    if (win) user.wins += 1;
    saveDB();

    const embed = new EmbedBuilder()
      .setTitle('🔢 تخمين الرقم')
      .setColor(win ? 0x00ff00 : 0xff0000)
      .setDescription(
        `🔢 الرقم الصحيح: **${result}**\n` +
        `${win ? `🎉 **فزت!** +${winAmount} دولار (x${winMultiplier})` : `😔 **خسرت!** -${amount} دولار`}\n` +
        `**الرصيد الجديد:** ${newBalance} دولار`
      )
      .setTimestamp();
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // ========== بطاقة ==========
  if (cmd === 'بطاقة') {
    const amount = parseInt(args[0]);
    if (!amount || amount <= 0) return message.reply('⚠️ أدخل مبلغاً موجباً.');
    if (amount > user.balance) return message.reply(`⚠️ رصيدك غير كافٍ. لديك ${user.balance} دولار.`);
    const cooldown = checkCooldown(userId, 'card', 3);
    if (cooldown) return message.reply(`⏳ انتظر ${cooldown} ثانية قبل اللعب مرة أخرى.`);

    const suits = ['♠️', '♥️', '♦️', '♣️'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const value = values[Math.floor(Math.random() * values.length)];
    const win = Math.random() < 0.4;
    const winMultiplier = win ? 2.5 : 0;
    const winAmount = win ? Math.floor(amount * winMultiplier) : 0;
    const newBalance = win ? user.balance + winAmount - amount : user.balance - amount;
    setBalance(userId, newBalance);
    user.gamesPlayed += 1;
    if (win) user.wins += 1;
    saveDB();

    const embed = new EmbedBuilder()
      .setTitle('🃏 سحب بطاقة')
      .setColor(win ? 0x00ff00 : 0xff0000)
      .setDescription(
        `🃏 البطاقة: **${value}${suit}**\n` +
        `${win ? `🎉 **فزت!** +${winAmount} دولار (x${winMultiplier})` : `😔 **خسرت!** -${amount} دولار`}\n` +
        `**الرصيد الجديد:** ${newBalance} دولار`
      )
      .setTimestamp();
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // ========== سلوت ==========
  if (cmd === 'سلوت') {
    const amount = parseInt(args[0]);
    if (!amount || amount <= 0) return message.reply('⚠️ أدخل مبلغاً موجباً.');
    if (amount > user.balance) return message.reply(`⚠️ رصيدك غير كافٍ. لديك ${user.balance} دولار.`);
    const cooldown = checkCooldown(userId, 'slots', 5);
    if (cooldown) return message.reply(`⏳ انتظر ${cooldown} ثانية قبل اللعب مرة أخرى.`);

    const symbols = ['🍒', '🍋', '🍊', '🍇', '🔔', '💎', '7️⃣', '⭐'];
    const reel1 = symbols[Math.floor(Math.random() * symbols.length)];
    const reel2 = symbols[Math.floor(Math.random() * symbols.length)];
    const reel3 = symbols[Math.floor(Math.random() * symbols.length)];

    let win = false;
    let winMultiplier = 0;

    if (reel1 === reel2 && reel2 === reel3) {
      win = true;
      winMultiplier = reel1 === '💎' ? 15 : reel1 === '7️⃣' ? 10 : reel1 === '⭐' ? 7 : 4;
    } else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
      win = true;
      winMultiplier = 2;
    } else if (reel1 === '💎' || reel2 === '💎' || reel3 === '💎') {
      win = true;
      winMultiplier = 1.5;
    }

    const winAmount = win ? Math.floor(amount * winMultiplier) : 0;
    const newBalance = win ? user.balance + winAmount - amount : user.balance - amount;
    setBalance(userId, newBalance);
    user.gamesPlayed += 1;
    if (win) user.wins += 1;
    saveDB();

    const embed = new EmbedBuilder()
      .setTitle('🎰 سلوت')
      .setColor(win ? 0x00ff00 : 0xff0000)
      .setDescription(
        `**${reel1} | ${reel2} | ${reel3}**\n` +
        `${win ? `🎉 **فزت!** +${winAmount} دولار (x${winMultiplier})` : `😔 **خسرت!** -${amount} دولار`}\n` +
        `**الرصيد الجديد:** ${newBalance} دولار`
      )
      .setTimestamp();
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // ========== بلاك جاك ==========
  if (cmd === 'بلاك') {
    const amount = parseInt(args[0]);
    if (!amount || amount <= 0) return message.reply('⚠️ أدخل مبلغاً موجباً.');
    if (amount > user.balance) return message.reply(`⚠️ رصيدك غير كافٍ. لديك ${user.balance} دولار.`);
    const cooldown = checkCooldown(userId, 'blackjack', 10);
    if (cooldown) return message.reply(`⏳ انتظر ${cooldown} ثانية قبل اللعب مرة أخرى.`);

    const cards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const suits = ['♠️', '♥️', '♦️', '♣️'];

    function drawCard() {
      const card = cards[Math.floor(Math.random() * cards.length)];
      const suit = suits[Math.floor(Math.random() * suits.length)];
      return { card, suit, value: card === 'A' ? 11 : ['J', 'Q', 'K'].includes(card) ? 10 : parseInt(card) };
    }

    function handValue(hand) {
      let value = hand.reduce((sum, c) => sum + c.value, 0);
      let aces = hand.filter(c => c.card === 'A').length;
      while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
      }
      return value;
    }

    const playerHand = [drawCard(), drawCard()];
    const dealerHand = [drawCard(), drawCard()];

    let playerValue = handValue(playerHand);
    let dealerValue = handValue(dealerHand);

    while (dealerValue < 17) {
      dealerHand.push(drawCard());
      dealerValue = handValue(dealerHand);
    }

    let win = false;
    let push = false;

    if (playerValue > 21) { win = false; }
    else if (dealerValue > 21) { win = true; }
    else if (playerValue > dealerValue) { win = true; }
    else if (playerValue === dealerValue) { push = true; }

    const winAmount = win ? amount * 2 : 0;
    const newBalance = win ? user.balance + winAmount - amount : push ? user.balance : user.balance - amount;
    setBalance(userId, newBalance);
    user.gamesPlayed += 1;
    if (win) user.wins += 1;
    saveDB();

    const playerCards = playerHand.map(c => `${c.card}${c.suit}`).join(' ');
    const dealerCards = dealerHand.map(c => `${c.card}${c.suit}`).join(' ');

    const embed = new EmbedBuilder()
      .setTitle('🃏 بلاك جاك')
      .setColor(win ? 0x00ff00 : push ? 0xffaa00 : 0xff0000)
      .setDescription(
        `**أنت:** ${playerCards} (${playerValue})\n` +
        `**الموزع:** ${dealerCards} (${dealerValue})\n` +
        `${win ? `🎉 **فزت!** +${winAmount} دولار` : push ? `🤝 **تعادل!** استعد رصيدك.` : `😔 **خسرت!** -${amount} دولار`}\n` +
        `**الرصيد الجديد:** ${newBalance} دولار`
      )
      .setTimestamp();
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // ========== ترتيب اللاعبين ==========
  if (cmd === 'ترتيب_العاب') {
    const sorted = Object.entries(db.users)
      .sort((a, b) => b[1].balance - a[1].balance)
      .slice(0, 10);
    if (!sorted.length) return message.reply('📭 لا توجد بيانات.');
    let desc = '';
    sorted.forEach(([id, data], i) => {
      const member = message.guild.members.cache.get(id);
      const name = member ? member.user.username : `مستخدم ${id}`;
      desc += `#${i+1} ${name} - ${data.balance} دولار (${data.wins} فوز)\n`;
    });
    const embed = new EmbedBuilder()
      .setTitle('🏆 ترتيب اللاعبين')
      .setColor(0xcc0000)
      .setDescription(desc)
      .setTimestamp();
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // ========== المساعدة ==========
  if (cmd === 'مساعدة_العاب') {
    const embed = new EmbedBuilder()
      .setTitle('🎮 قائمة الأوامر')
      .setColor(0xcc0000)
      .addFields(
        { name: '💰 عام', value: '`!رصيد` `!يومية` `!ترتيب_العاب`' },
        { name: '🎰 روليت', value: '`!روليت [مبلغ] [لون/رقم]`' },
        { name: '♻️ ريبيلكا', value: '`!ريبيلكا [مبلغ]`' },
        { name: '✊ حجر ورقة مقص', value: '`!rps [مبلغ] [حجر/ورقة/مقص]`' },
        { name: '🎲 نرد', value: '`!نرد [مبلغ] [رقم 1-6]`' },
        { name: '🔢 تخمين', value: '`!تخمين [مبلغ] [رقم 1-20]`' },
        { name: '🃏 بطاقة', value: '`!بطاقة [مبلغ]`' },
        { name: '🎰 سلوت', value: '`!سلوت [مبلغ]`' },
        { name: '🃏 بلاك جاك', value: '`!بلاك [مبلغ]`' }
      )
      .setFooter({ text: '🎮 العاب البوت' })
      .setTimestamp();
    await message.channel.send({ embeds: [embed] });
    return;
  }
});

// ============================================================
// ========== تشغيل البوت ==========
// ============================================================

client.login(TOKEN).catch((err) => {
  console.error('❌ فشل تسجيل الدخول:', err);
  process.exit(1);
});
