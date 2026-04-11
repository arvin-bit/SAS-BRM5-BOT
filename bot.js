require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

// Rank mapping based on your role IDs
const RANK_MAP = {
  '1479932842879221901': 'Captain',
  '1479932608023498792': 'Colonel',
  '1479932649538850918': 'Lieutenant Colonel',
  '1479931890504044646': 'ADMINS',
  '1479932981731922004': 'Lieutenant',
  '1479933066993598565': 'Sergeant',
  '1479933135230734441': 'Corporal',
  '1479933245331345469': 'Lance Corporal',
  '1479933135230734441': 'Lieutenant',
  '1492237941899268267': 'Private',
  '1484979782872469674': 'Major',
  '1484979782872469674': 'Chancellor',
  '1479931742612885716': 'General',
  '1479932018975571988': 'Brigadier General',
  '1479932144536260679': 'Lieutenant General',
  '1479932549206642718': 'Brigadier',
  '1484979921704194129': 'Legionary'
};

const SAS_MEMBER_ROLE = '1484330769206874193';
const MANAGEMENT_ROLE = '1491007183473872927';

const commands = [
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all available commands'),

  new SlashCommandBuilder()
    .setName('canannounce')
    .setDescription('Toggle announcement permission for a user (Admin only)')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .addBooleanOption(o => o.setName('value').setDescription('Allow announcements?').setRequired(true)),

  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Post application button (Admin only)'),

  new SlashCommandBuilder()
    .setName('syncranks')
    .setDescription('Sync all server members to database (Admin only)'),

  new SlashCommandBuilder()
    .setName('addpersonnel')
    .setDescription('Add member to database (Admin only)')
    .addUserOption(o => o.setName('user').setDescription('Discord user').setRequired(true))
    .addStringOption(o => o.setName('roblox').setDescription('Roblox username').setRequired(true))
    .addStringOption(o => o.setName('rank').setDescription('Starting rank').setRequired(true))
    .addBooleanOption(o => o.setName('admin').setDescription('Is admin?').setRequired(false)),

  new SlashCommandBuilder()
    .setName('makesquadron')
    .setDescription('Create new squadron (Admin only)')
    .addStringOption(o => o.setName('name').setDescription('Squadron name').setRequired(true))
    .addStringOption(o => o.setName('callsign').setDescription('Radio callsign (e.g. ALPHA)').setRequired(true))
    .addUserOption(o => o.setName('leader').setDescription('Squadron leader').setRequired(true)),

  new SlashCommandBuilder()
  .setName('removesquadron')
  .setDescription('Remove a squadron (Admin only)')
  .addStringOption(o =>
    o.setName('callsign')
      .setDescription('Squadron callsign (e.g. BRAVO)')
      .setRequired(true)
  ),

  new SlashCommandBuilder()
    .setName('startop')
    .setDescription('Start new operation (Admin only)')
    .addStringOption(o => o.setName('name').setDescription('Operation name').setRequired(true))
    .addStringOption(o => o.setName('callsign').setDescription('Op callsign (e.g. OP-001)').setRequired(true))
    .addStringOption(o => o.setName('squadron').setDescription('Squadron callsign').setRequired(true))
    .addStringOption(o => o.setName('type').setDescription('Operation type').setRequired(true))
    .addStringOption(o => o.setName('description').setDescription('Operation details').setRequired(true)),

  new SlashCommandBuilder()
    .setName('endop')
    .setDescription('End operation (Admin only)')
    .addStringOption(o => o.setName('callsign').setDescription('Operation callsign').setRequired(true)),

  new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Send announcement to site and Discord')
    .addStringOption(o => o.setName('message').setDescription('Announcement text').setRequired(true))
    .addBooleanOption(o => o.setName('pin').setDescription('Pin to site?').setRequired(false)),

  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member')
    .addUserOption(o => o.setName('user').setDescription('User to warn').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for warning').setRequired(true)),

  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member')
    .addUserOption(o => o.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for kick').setRequired(true)),

  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member')
    .addUserOption(o => o.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for ban').setRequired(true)),

  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Set unit status (Admin only)')
    .addStringOption(o =>
      o.setName('state')
        .setDescription('Status')
        .setRequired(true)
        .addChoices(
          { name: 'Operational', value: 'Operational' },
          { name: 'Standby', value: 'Standby' },
          { name: 'Stand Down', value: 'Stand Down' }
        )
    )
    .addStringOption(o => o.setName('message').setDescription('Status message').setRequired(true)),

  new SlashCommandBuilder()
    .setName('approve')
    .setDescription('Approve application (Admin only)')
    .addUserOption(o => o.setName('user').setDescription('Applicant').setRequired(true))
    .addStringOption(o => o.setName('rank').setDescription('Starting rank').setRequired(true)),

  new SlashCommandBuilder()
    .setName('reject')
    .setDescription('Reject application (Admin only)')
    .addUserOption(o => o.setName('user').setDescription('Applicant').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Rejection reason').setRequired(true)),

  new SlashCommandBuilder()
    .setName('reason')
    .setDescription('View application reason (Admin only)')
    .addUserOption(o => o.setName('user').setDescription('Applicant').setRequired(true))
];

async function isAdmin(userId) {
  const { data } = await supabase
    .from('personnel')
    .select('is_admin')
    .eq('discord_id', userId)
    .single();
  return data?.is_admin || false;
}

client.on('interactionCreate', async interaction => {
  // Application button
  if (interaction.isButton() && interaction.customId === 'apply_sas') {
    const modal = new ModalBuilder()
      .setCustomId('application_modal')
      .setTitle('Apply for SAS');

    const robloxInput = new TextInputBuilder()
      .setCustomId('roblox_username')
      .setLabel('Roblox Username')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const levelInput = new TextInputBuilder()
      .setCustomId('brm5_level')
      .setLabel('BRM5 Level')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const reasonInput = new TextInputBuilder()
      .setCustomId('reason')
      .setLabel('Why would you like to join SAS?')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const foundInput = new TextInputBuilder()
      .setCustomId('found_us')
      .setLabel('How did you find us?')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(robloxInput),
      new ActionRowBuilder().addComponents(levelInput),
      new ActionRowBuilder().addComponents(reasonInput),
      new ActionRowBuilder().addComponents(foundInput)
    );

    return interaction.showModal(modal);
  }

  // Modal submit
  if (interaction.isModalSubmit() && interaction.customId === 'application_modal') {
    const app = {
      roblox_username: interaction.fields.getTextInputValue('roblox_username'),
      discord_id: interaction.user.id,
      discord_username: interaction.user.username,
      brm5_level: parseInt(interaction.fields.getTextInputValue('brm5_level')),
      reason: interaction.fields.getTextInputValue('reason'),
      found_us: interaction.fields.getTextInputValue('found_us') || null
    };

    const { error } = await supabase.from('applications').insert(app);

    if (error) {
      console.error(error);
      return interaction.reply({ content: 'Error submitting application.', ephemeral: true });
    }

    const logChannel = await client.channels.fetch('1492118287260323961');

    const appEmbed = new EmbedBuilder()
      .setTitle('📥 New SAS Application')
      .addFields(
        { name: 'Discord', value: `${interaction.user.tag} (${interaction.user.id})`, inline: false },
        { name: 'Roblox Username', value: app.roblox_username, inline: true },
        { name: 'BRM5 Level', value: app.brm5_level.toString(), inline: true },
        { name: 'Reason', value: app.reason, inline: false },
        { name: 'Found Us', value: app.found_us || 'N/A', inline: false }
      )
      .setColor(0x5865F2)
      .setTimestamp();

    await logChannel.send({ embeds: [appEmbed] });

    return interaction.reply({
      content: '✅ Application submitted! You will be DMd when reviewed.',
      ephemeral: true
    });
  }

  if (!interaction.isChatInputCommand()) return;

  // /help is public
  if (interaction.commandName === 'help') {
    const commandList = commands
      .map(cmd => `\`/${cmd.name}\` — ${cmd.description}`)
      .join('\n');

    const helpEmbed = new EmbedBuilder()
      .setTitle('📘 SAS Bot Help Menu')
      .setDescription('Here are all available commands:')
      .addFields({ name: 'Commands', value: commandList })
      .setColor(0x5865F2)
      .setTimestamp();

    return interaction.reply({ embeds: [helpEmbed], ephemeral: true });
  }

  // Admin check for all other commands
  if (!await isAdmin(interaction.user.id)) {
    return interaction.reply({ content: '❌ Admin only.', ephemeral: true });
  }

  try {
    switch (interaction.commandName) {
      case 'setup': {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('apply_sas')
            .setLabel('Apply for SAS')
            .setStyle(ButtonStyle.Primary)
        );

        await interaction.channel.send({
          content: '# 🎖️ Apply for Special Air Service\nClick the button below to submit your application.',
          components: [row]
        });
        await interaction.reply({ content: '✅ Application button posted!', ephemeral: true });
        break;
      }

      case 'syncranks': {
        await interaction.deferReply({ ephemeral: true });

        const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);
        await guild.members.fetch();

        let inserted = 0;
        let updated = 0;
        let preserved = 0;

        for (const [, member] of guild.members.cache) {
          if (member.user.bot) continue;

          const { data: existing } = await supabase
            .from('personnel')
            .select('is_admin')
            .eq('discord_id', member.id)
            .single();

          let highestRank = 'Recruit';
          let isAdminFlag = existing?.is_admin || false;

          for (const [roleId] of member.roles.cache) {
            if (RANK_MAP[roleId]) {
              const rank = RANK_MAP[roleId];
              if (['High Command', 'Colonel', 'Major', 'Captain'].includes(rank)) {
                isAdminFlag = true;
              }
              highestRank = rank;
            }
          }

          const { error } = await supabase.from('personnel').upsert({
            discord_id: member.id,
            discord_username: member.user.username,
            nickname: member.nickname || member.user.username,
            rank: highestRank,
            is_admin: isAdminFlag,
            joined_at: member.joinedAt?.toISOString() || new Date().toISOString()
          }, {
            onConflict: 'discord_id'
          });

          if (error) {
            console.error(`Failed to sync ${member.user.username}:`, error);
          } else {
            if (existing) updated++;
            else inserted++;
            if (existing?.is_admin && !isAdminFlag) preserved++;
          }
        }

        await interaction.editReply(
          `✅ Inserted: ${inserted}\n` +
          `🔄 Updated: ${updated}\n` +
          `👑 Preserved admins: ${preserved}`
        );
        break;
      }

      case 'addpersonnel': {
        const user = interaction.options.getUser('user');
        const { error: addError } = await supabase.from('personnel').insert({
          discord_id: user.id,
          discord_username: user.username,
          roblox_username: interaction.options.getString('roblox'),
          rank: interaction.options.getString('rank'),
          is_admin: interaction.options.getBoolean('admin') || false
        });

        if (addError?.code === '23505') {
          await interaction.reply({ content: '❌ User already in personnel database.', ephemeral: true });
        } else if (addError) {
          throw addError;
        } else {
          await interaction.reply(`✅ Added **${user.username}** as **${interaction.options.getString('rank')}**`);
        }
        break;
      }

      case 'makesquadron': {
        const leader = interaction.options.getUser('leader');
        const { error: sqError } = await supabase.from('squadrons').insert({
          name: interaction.options.getString('name'),
          callsign: interaction.options.getString('callsign').toUpperCase(),
          leader_id: leader.id
        });

        if (sqError?.code === '23505') {
          await interaction.reply({ content: '❌ Callsign already exists.', ephemeral: true });
        } else if (sqError) {
          throw sqError;
        } else {
          await interaction.reply(
            `✅ Squadron **${interaction.options.getString('name')}** (${interaction.options.getString('callsign').toUpperCase()}) created with leader ${leader.username}`
          );
        }
        break;
      }
      case 'removesquadron': {
  const callsign = interaction.options.getString('callsign').toUpperCase();

  // Check if squadron exists
  const { data: squadron } = await supabase
    .from('squadrons')
    .select('id')
    .eq('callsign', callsign)
    .single();

  if (!squadron) {
    return interaction.reply({
      content: `❌ Squadron **${callsign}** does not exist.`,
      ephemeral: true
    });
  }

  // Delete squadron
  const { error } = await supabase
    .from('squadrons')
    .delete()
    .eq('id', squadron.id);

  if (error) {
    console.error(error);
    return interaction.reply({
      content: '❌ Failed to remove squadron.',
      ephemeral: true
    });
  }

  await interaction.reply({
    content: `🗑️ Squadron **${callsign}** has been removed.`,
    ephemeral: true
  });

  break;
}

      case 'startop': {
        const { data: sq } = await supabase
          .from('squadrons')
          .select('id')
          .eq('callsign', interaction.options.getString('squadron').toUpperCase())
          .single();

        if (!sq) {
          return interaction.reply({ content: '❌ Squadron not found.', ephemeral: true });
        }

        await supabase.from('operations').insert({
          name: interaction.options.getString('name'),
          callsign: interaction.options.getString('callsign').toUpperCase(),
          squadron_id: sq.id,
          type: interaction.options.getString('type'),
          description: interaction.options.getString('description'),
          status: 'active',
          started_at: new Date().toISOString(),
          created_by: interaction.user.id
        });

        await interaction.reply(
          `🎯 **OPERATION ACTIVE**\n**${interaction.options.getString('callsign').toUpperCase()}** - ${interaction.options.getString('name')}`
        );
        break;
      }

      case 'endop': {
        const { data: ended } = await supabase
          .from('operations')
          .update({ status: 'completed', ended_at: new Date().toISOString() })
          .eq('callsign', interaction.options.getString('callsign').toUpperCase())
          .eq('status', 'active')
          .select()
          .single();

        if (!ended) {
          return interaction.reply({ content: '❌ Active operation not found.', ephemeral: true });
        }

        await interaction.reply(`✅ Operation **${interaction.options.getString('callsign').toUpperCase()}** ended.`);
        break;
      }

      case 'canannounce': {
        const targetUser = interaction.options.getUser('user');
        const value = interaction.options.getBoolean('value');

        const { error } = await supabase.from('personnel').upsert({
          discord_id: targetUser.id,
          discord_username: targetUser.username,
          can_announce: value
        }, {
          onConflict: 'discord_id'
        });

        if (error) {
          console.error(error);
          return interaction.reply({ content: '❌ Failed to update permission.', ephemeral: true });
        }

        await interaction.reply({
          content: `✅ Updated announcement permission for **${targetUser.username}** to **${value ? 'ENABLED' : 'DISABLED'}**`,
          ephemeral: true
        });
        break;
      }

      case 'announce': {
        const announcer = interaction.user.id;

        const { data: perm } = await supabase
          .from('personnel')
          .select('can_announce, is_admin')
          .eq('discord_id', announcer)
          .single();

        if (!perm?.is_admin && !perm?.can_announce) {
          return interaction.reply({ content: '❌ You are not allowed to send announcements.', ephemeral: true });
        }

        const msg = interaction.options.getString('message');
        const pin = interaction.options.getBoolean('pin') || false;

        const embed = new EmbedBuilder()
          .setTitle(pin ? '📌 ANNOUNCEMENT' : '📢 Announcement')
          .setDescription(msg)
          .setColor(pin ? 0xDC2626 : 0x5865F2)
          .setFooter({ text: `Posted by ${interaction.user.username}` })
          .setTimestamp();

        const sent = await interaction.channel.send({ embeds: [embed] });

        await supabase.from('announcements').insert({
          discord_message_id: sent.id,
          author_id: interaction.user.id,
          author_name: interaction.user.username,
          content: msg,
          pinned: pin
        });

        await interaction.reply({ content: '✅ Announced!', ephemeral: true });
        break;
      }

      case 'status': {
        await supabase.from('config').upsert({
          key: 'unit_status',
          value: {
            status: interaction.options.getString('state'),
            message: interaction.options.getString('message'),
            updated_at: new Date().toISOString(),
            updated_by: interaction.user.id
          }
        });

        const state = interaction.options.getString('state');
        const statusEmbed = new EmbedBuilder()
          .setTitle('📊 UNIT STATUS UPDATE')
          .setDescription(`**${state}**\n${interaction.options.getString('message')}`)
          .setColor(
            state === 'Operational'
              ? 0x10B981
              : state === 'Standby'
              ? 0xF59E0B
              : 0xEF4444
          )
          .setFooter({ text: `Updated by ${interaction.user.username}` })
          .setTimestamp();

        await interaction.channel.send({ embeds: [statusEmbed] });
        await interaction.reply({ content: '✅ Status updated!', ephemeral: true });
        break;
      }

      case 'approve': {
        const target = interaction.options.getUser('user');

        const { data: app } = await supabase
          .from('applications')
          .select('*')
          .eq('discord_id', target.id)
          .eq('status', 'pending')
          .single();

        if (!app) {
          return interaction.reply({ content: '❌ No pending application found.', ephemeral: true });
        }

        await supabase.from('applications')
          .update({
            status: 'approved',
            processed_by: interaction.user.id,
            processed_at: new Date().toISOString()
          })
          .eq('id', app.id);

        await supabase.from('personnel').insert({
          discord_id: target.id,
          discord_username: target.username,
          roblox_username: app.roblox_username,
          rank: interaction.options.getString('rank')
        });

        try {
          await target.send(
            `🎉 **APPLICATION APPROVED✅.** Welcome to the Special Air Service.\n\nYour application has been **APPROVED**.\nStarting Rank: **${interaction.options.getString('rank')}**`
          );
        } catch {
          console.log('Could not DM user');
        }

        await interaction.reply(`✅ Approved **${target.username}** as **${interaction.options.getString('rank')}**`);
        break;
      }

      case 'reject': {
        const rejTarget = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

        await supabase.from('applications')
          .update({
            status: 'rejected',
            processed_by: interaction.user.id,
            processed_at: new Date().toISOString(),
            rejection_reason: reason
          })
          .eq('discord_id', rejTarget.id)
          .eq('status', 'pending');

        try {
          await rejTarget.send(`❌ **APPLICATION DENIED**\n\nReason: ${reason}`);
        } catch {
          console.log('Could not DM user');
        }

        await interaction.reply(`❌ Rejected **${rejTarget.username}**`);
        break;
      }

      case 'warn': {
        const warnTarget = interaction.options.getUser('user');
        const warnReason = interaction.options.getString('reason');

        const warnEmbed = new EmbedBuilder()
          .setTitle('⚠️ Warning Issued')
          .addFields(
            { name: 'Member', value: `<@${warnTarget.id}>`, inline: true },
            { name: 'Reason', value: warnReason, inline: true }
          )
          .setColor(0xFBBF24)
          .setTimestamp();

        const warnChannel = await client.channels.fetch('1491822614681747652');
        await warnChannel.send({ embeds: [warnEmbed] });

        try {
          await warnTarget.send(`⚠️ You have been warned.\nReason: **${warnReason}**`);
        } catch {}

        await interaction.reply({ content: `⚠️ Warned **${warnTarget.username}**`, ephemeral: true });
        break;
      }

      case 'kick': {
        const kickTarget = interaction.options.getUser('user');
        const kickReason = interaction.options.getString('reason');

        const kickMember = await interaction.guild.members.fetch(kickTarget.id).catch(() => null);
        if (!kickMember) {
          return interaction.reply({ content: '❌ User not found in server.', ephemeral: true });
        }

        await kickMember.kick(kickReason);

        const kickEmbed = new EmbedBuilder()
          .setTitle('👢 Member Kicked')
          .addFields(
            { name: 'Member', value: `<@${kickTarget.id}>`, inline: true },
            { name: 'Reason', value: kickReason, inline: true }
          )
          .setColor(0xDC2626)
          .setTimestamp();

        const kickChannel = await client.channels.fetch('1483582665188970510');
        await kickChannel.send({ embeds: [kickEmbed] });

        await interaction.reply({ content: `👢 Kicked **${kickTarget.username}**`, ephemeral: true });
        break;
      }

      case 'ban': {
        const banTarget = interaction.options.getUser('user');
        const banReason = interaction.options.getString('reason');

        await interaction.guild.members.ban(banTarget.id, { reason: banReason });

        const banEmbed = new EmbedBuilder()
          .setTitle('⛔ Member Banned')
          .addFields(
            { name: 'Member', value: `<@${banTarget.id}>`, inline: true },
            { name: 'Reason', value: banReason, inline: true }
          )
          .setColor(0xB91C1C)
          .setTimestamp();

        const banChannel = await client.channels.fetch('1483582665188970510');
        await banChannel.send({ embeds: [banEmbed] });

        await interaction.reply({ content: `⛔ Banned **${banTarget.username}**`, ephemeral: true });
        break;
      }

      case 'reason': {
        const viewTarget = interaction.options.getUser('user');

        const { data: viewApp } = await supabase
          .from('applications')
          .select('reason, brm5_level, roblox_username, found_us')
          .eq('discord_id', viewTarget.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!viewApp) {
          return interaction.reply({ content: '❌ No application found.', ephemeral: true });
        }

        const reasonEmbed = new EmbedBuilder()
          .setTitle(`📝 Application: ${viewTarget.username}`)
          .addFields(
            { name: 'Roblox', value: viewApp.roblox_username, inline: true },
            { name: 'BRM5 Level', value: viewApp.brm5_level.toString(), inline: true },
            { name: 'Found Us', value: viewApp.found_us || 'N/A', inline: true },
            { name: 'Reason', value: viewApp.reason }
          )
          .setColor(0x5865F2);

        await interaction.reply({ embeds: [reasonEmbed], ephemeral: true });
        break;
      }
    }
  } catch (err) {
    console.error(err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: `❌ Error: ${err.message}`, ephemeral: true });
    }
  }
});

client.once('ready', async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);

  // Auto-sync existing members with SAS Member role
  try {
    const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);
    const members = await guild.members.fetch();

    console.log(`Checking ${members.size} members for SAS role...`);
    let added = 0;

    for (const [, member] of members) {
      if (member.user.bot) continue;

      const { data: existing } = await supabase
        .from('personnel')
        .select('discord_id')
        .eq('discord_id', member.id)
        .single();

      if (existing) continue;

      if (member.roles.cache.has(SAS_MEMBER_ROLE)) {
        const isAdminFlag = member.roles.cache.has(MANAGEMENT_ROLE);

        let rank = 'Private';
        for (const [roleId] of member.roles.cache) {
          if (RANK_MAP[roleId]) {
            rank = RANK_MAP[roleId];
            break;
          }
        }

        await supabase.from('personnel').insert({
          discord_id: member.id,
          discord_username: member.user.username,
          nickname: member.nickname || member.user.username,
          rank: rank,
          is_admin: isAdminFlag,
          joined_at: member.joinedAt?.toISOString() || new Date().toISOString()
        });

        console.log(`✅ Auto-added: ${member.user.username} (${rank})${isAdminFlag ? ' [ADMIN]' : ''}`);
        added++;
      }
    }

    console.log(`✅ Sync complete. Added ${added} new members.`);
  } catch (err) {
    console.error('Auto-sync error:', err);
  }

  // Register slash commands
  const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands.map(c => c.toJSON()) }
  );
  console.log('✅ Commands registered');
});

// Also add members when they get the role
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  const hadRole = oldMember.roles.cache.has(SAS_MEMBER_ROLE);
  const hasRoleNow = newMember.roles.cache.has(SAS_MEMBER_ROLE);

  if (!hadRole && hasRoleNow) {
    console.log(`Member ${newMember.user.username} got SAS role, adding to DB...`);

    const isAdminFlag = newMember.roles.cache.has(MANAGEMENT_ROLE);
    let rank = 'Private';

    for (const [roleId] of newMember.roles.cache) {
      if (RANK_MAP[roleId]) {
        rank = RANK_MAP[roleId];
        break;
      }
    }

    await supabase.from('personnel').upsert({
      discord_id: newMember.id,
      discord_username: newMember.user.username,
      nickname: newMember.nickname || newMember.user.username,
      rank: rank,
      is_admin: isAdminFlag,
      joined_at: newMember.joinedAt?.toISOString() || new Date().toISOString()
    }, {
      onConflict: 'discord_id',
      ignoreDuplicates: false
    });

    console.log(`✅ Added/Updated: ${newMember.user.username}`);
  }

  if (!oldMember.roles.cache.has(MANAGEMENT_ROLE) &&
      newMember.roles.cache.has(MANAGEMENT_ROLE)) {
    await supabase.from('personnel')
      .update({ is_admin: true })
      .eq('discord_id', newMember.id);
    console.log(`👑 Promoted ${newMember.user.username} to admin`);
  }
});

client.login(process.env.BOT_TOKEN);
