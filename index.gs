const { 
  Client, 
  GatewayIntentBits, 
  PermissionsBitField, 
  EmbedBuilder 
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const prefix = "!";
// ملاحظة: يفضل مستقبلاً استخدام قاعدة بيانات بدلاً من هذا المتغير
let levels = {}; 

client.once('ready', () => {
  console.log(`✅ تم تسجيل الدخول بنجاح باسم: ${client.user.tag}`);
});

// نظام الترحيب
client.on('guildMemberAdd', member => {
  const channel = member.guild.systemChannel;
  if (!channel) return;

  const welcomeEmbed = new EmbedBuilder()
    .setTitle("🎉 عضو جديد انضم إلينا!")
    .setDescription(`أهلاً بك ${member} في سيرفر **${member.guild.name}**! \nنتمنى لك وقتاً ممتعاً.`)
    .setThumbnail(member.user.displayAvatarURL())
    .setColor("Random")
    .setTimestamp();

  channel.send({ embeds: [welcomeEmbed] });
});

client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;

  // --- نظام المستويات المبسط ---
  const userId = message.author.id;
  levels[userId] = (levels[userId] || 0) + 1;
  
  let currentLevel = Math.floor(levels[userId] / 10);
  if (levels[userId] % 10 === 0 && levels[userId] !== 0) {
    message.reply(`🚀 كفو! ارتفع مستواك إلى اللفل **${currentLevel}**`);
  }

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  // --- الأوامر ---

  // أمر فحص اللفل
  if (cmd === "rank") {
    return message.reply(`📊 مستوى خبرتك الحالي: \`${levels[userId]}\` | اللفل: **${currentLevel}**`);
  }

  // أمر مسح الشات
  if (cmd === "clear") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) 
        return message.reply("❌ ليس لديك صلاحية مسح الرسائل.");
    
    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount <= 0 || amount > 100) 
        return message.reply("⚠️ يرجى تحديد عدد بين 1 و 100.");

    try {
        const deleted = await message.channel.bulkDelete(amount, true);
        const msg = await message.channel.send(`🧹 تم حذف \`${deleted.size}\` رسالة بنجاح.`);
        setTimeout(() => msg.delete(), 3000); // حذف رسالة التأكيد بعد 3 ثواني
    } catch (err) {
        message.reply("❌ حدث خطأ أثناء محاولة حذف الرسائل (ربما الرسائل قديمة جداً).");
    }
  }

  // أمر الطرد (Kick)
  if (cmd === "kick") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return;
    const target = message.mentions.members.first();
    if (!target) return message.reply("👤 منشن الشخص المراد طرده.");
    if (!target.kickable) return message.reply("🚫 لا يمكنني طرد هذا العضو (رتبته أعلى مني).");

    await target.kick();
    message.channel.send(`✅ تم طرد **${target.user.tag}** من السيرفر.`);
  }

  // أمر الميوت (بخاصية Timeout الجديدة)
  if (cmd === "mute") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;
    
    const target = message.mentions.members.first();
    const duration = parseInt(args[1]); // بالدقائق

    if (!target || isNaN(duration)) return message.reply("📝 الاستخدام الصحيح: `!mute @user [المدة بالدقائق]`");

    try {
        await target.timeout(duration * 60 * 1000);
        message.channel.send(`🔇 تم إسكات ${target.user.tag} لمدة ${duration} دقيقة.`);
    } catch (err) {
        message.reply("❌ تعذر تنفيذ الميوت.");
    }
  }
});

client.login("YOUR_BOT_TOKEN");
