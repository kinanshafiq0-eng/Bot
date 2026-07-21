const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActivityType,
} = require('discord.js');
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

// ========== تخزين جلسات الروليت ==========
const rouletteSessions = {};

// ========== صور GIF للعجلة ==========
const WHEEL_STATIC = 'https://i.imgur.com/YOUR_STATIC_WHEEL.gif'; // عجلة ثابتة
const WHEEL_SPINNING = 'https://i.imgur.com/YOUR_SPINNING_WHEEL.gif'; // عجلة تدور
const WHEEL_STOPPED = 'https://i.imgur.com/YOUR_STOPPED_WHEEL.gif'; // عجلة متوقفة

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
      return message.reply('⚠️ هناك جلسة روليت نشطة بالفعل. استخدم `!روليت_سحب` لاختيار فائز.');
    }

    rouletteSessions[guildId] = {
      players: [],
      messageId: null,
      channelId: message.channel.id,
    };

    const embed = new EmbedBuilder()
      .setTitle('🎡 روليت السيرفر')
      .setDescription(
        `**0 لاعبين مسجلين**\n\n` +
        `اضغط على الزر للانضمام!\n` +
        `للسحب: استخدم \`!روليت_سحب\`\n` +
        `للإلغاء: استخدم \`!روليت_الغاء\``
      )
      .setColor(0xcc0000)
      .setImage(WHEEL_STATIC)
      .setFooter({ text: '🎡 روليت | انتظر الدوران' })
      .setTimestamp();

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

    const msg = await message.channel.send({ embeds: [embed], components: [row] });
    rouletteSessions[guildId].messageId = msg.id;
    await message.delete().catch(() => {});
    return;
  }

  // ========== سحب فائز مع العجلة المتحركة ==========
  if (cmd === 'روليت_سحب') {
    const session = rouletteSessions[guildId];
    if (!session || session.players.length === 0) {
      return message.reply('⚠️ لا توجد جلسة روليت نشطة أو لا يوجد لاعبين.');
    }

    const msg = await message.channel.messages.fetch(session.messageId).catch(() => null);
    if (!msg) {
      delete rouletteSessions[guildId];
      return message.reply('❌ رسالة الروليت غير موجودة.');
    }

    // إظهار اسم اللاعبين أعلى العجلة
    const playersText = session.players.map((p, i) => `**${i + 1}.** <@${p}>`).join('\n');

    // المرحلة 1: العد التنازلي
    const countdownEmbed = new EmbedBuilder()
      .setTitle('🎡 جاري السحب...')
      .setDescription(`**اللاعبون:**\n${playersText}\n\n🔄 **3**...`)
      .setColor(0xffaa00)
      .setImage(WHEEL_STATIC)
      .setFooter({ text: '🎡 استعد...' })
      .setTimestamp();
    await msg.edit({ embeds: [countdownEmbed], components: [] });
    await new Promise(r => setTimeout(r, 1000));

    // 2...
    countdownEmbed.setDescription(`**اللاعبون:**\n${playersText}\n\n🔄 **2**...`);
    await msg.edit({ embeds: [countdownEmbed] });
    await new Promise(r => setTimeout(r, 1000));

    // 1...
    countdownEmbed.setDescription(`**اللاعبون:**\n${playersText}\n\n🔄 **1**...`);
    await msg.edit({ embeds: [countdownEmbed] });
    await new Promise(r => setTimeout(r, 1000));

    // المرحلة 2: العجلة تدور (GIF)
    const spinningEmbed = new EmbedBuilder()
      .setTitle('🎡 العجلة تدور!')
      .setDescription(`**اللاعبون:**\n${playersText}\n\n🔄 العجلة تدور...`)
      .setColor(0xffaa00)
      .setImage(WHEEL_SPINNING)
      .setFooter({ text: '🎡 جاري الدوران...' })
      .setTimestamp();
    await msg.edit({ embeds: [spinningEmbed] });

    // انتظار 5 ثواني (مدة دوران الـ GIF)
    await new Promise(r => setTimeout(r, 5000));

    // المرحلة 3: اختيار فائز عشوائي وتوقف العجلة
    const winnerIndex = Math.floor(Math.random() * session.players.length);
    const winnerId = session.players[winnerIndex];

    const winnerEmbed = new EmbedBuilder()
      .setTitle('🏆 لدينا فائز!')
      .setDescription(
        `**اللاعبون:**\n${playersText}\n\n` +
        `🎉 **الفائز:** <@${winnerId}>`
      )
      .setColor(0x00ff00)
      .setImage(WHEEL_STOPPED)
      .setFooter({ text: '🎡 انتهى السحب' })
      .setTimestamp();
    await msg.edit({ embeds: [winnerEmbed] });

    // رسالة تهنئة
    const congratsEmbed = new EmbedBuilder()
      .setTitle('🎉 مبروك!')
      .setDescription(`🏆 **<@${winnerId}>** هو الفائز!\n\n🎊 تهانينا للفائز وحظ أوفر للبقية.`)
      .setColor(0x00ff00)
      .setTimestamp();
    await message.channel.send({ embeds: [congratsEmbed] });

    delete rouletteSessions[guildId];
    return;
  }

  // ========== إلغاء الروليت ==========
  if (cmd === 'روليت_الغاء') {
    const session = rouletteSessions[guildId];
    if (!session) return message.reply('⚠️ لا توجد جلسة روليت نشطة.');

    const msg = await message.channel.messages.fetch(session.messageId).catch(() => null);
    if (msg) {
      const embed = EmbedBuilder.from(msg.embeds[0])
        .setTitle('🚫 ألغيت')
        .setDescription('تم إلغاء جلسة الروليت.')
        .setColor(0xff0000);
      await msg.edit({ embeds: [embed], components: [] }).catch(() => {});
    }

    delete rouletteSessions[guildId];
    await message.reply('✅ تم إلغاء جلسة الروليت.');
    return;
  }
});

// ========== التعامل مع الأزرار ==========
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  const guildId = interaction.guild.id;
  const session = rouletteSessions[guildId];
  if (!session) return interaction.reply({ content: '⚠️ لا توجد جلسة روليت نشطة.', ephemeral: true });

  if (interaction.customId === 'roulette_join') {
    if (session.players.includes(interaction.user.id)) {
      return interaction.reply({ content: '⚠️ أنت منضم بالفعل.', ephemeral: true });
    }
    session.players.push(interaction.user.id);

    const msg = await interaction.channel.messages.fetch(session.messageId).catch(() => null);
    if (msg) {
      const embed = EmbedBuilder.from(msg.embeds[0])
        .setDescription(
          `**${session.players.length} لاعبين مسجلين**\n\n` +
          `اضغط على الزر للانضمام!\n` +
          `للسحب: استخدم \`!روليت_سحب\`\n` +
          `للإلغاء: استخدم \`!روليت_الغاء\`\n\n` +
          `**المشاركون:** ${session.players.map(p => `<@${p}>`).join(', ')}`
        );
      await msg.edit({ embeds: [embed] });
    }
    await interaction.reply({ content: '✅ انضممت للروليت!', ephemeral: true });
  }

  if (interaction.customId === 'roulette_leave') {
    if (!session.players.includes(interaction.user.id)) {
      return interaction.reply({ content: '⚠️ أنت غير منضم.', ephemeral: true });
    }
    session.players = session.players.filter(id => id !== interaction.user.id);

    const msg = await interaction.channel.messages.fetch(session.messageId).catch(() => null);
    if (msg) {
      const embed = EmbedBuilder.from(msg.embeds[0])
        .setDescription(
          `**${session.players.length} لاعبين مسجلين**\n\n` +
          `اضغط على الزر للانضمام!\n` +
          `للسحب: استخدم \`!روليت_سحب\`\n` +
          `للإلغاء: استخدم \`!روليت_الغاء\`\n\n` +
          `**المشاركون:** ${session.players.length > 0 ? session.players.map(p => `<@${p}>`).join(', ') : 'لا أحد'}`
        );
      await msg.edit({ embeds: [embed] });
    }
    await interaction.reply({ content: '🚫 خرجت من الروليت.', ephemeral: true });
  }
});

// ========== تشغيل البوت ==========
client.login(TOKEN).catch(err => {
  console.error('❌ فشل تسجيل الدخول:', err);
  process.exit(1);
});
