require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
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
  '1479932804434235473': 'Colonel', 
  '1479931890504044646': 'High Command',
  '1479932981731922004': 'Staff Sergeant',
  '1479933066993598565': 'Sergeant',
  '1479933245331345469': 'Corporal',
  '1479933135230734441': 'Lieutenant',
  '1492237941899268267': 'High Command',
  '1484979782872469674': 'Major'
};

const commands = [
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
    .setDescription('Send announcement to site and Discord (Admin only)')
    .addStringOption(o => o.setName('message').setDescription('Announcement text').setRequired(true))
    .addBooleanOption(o => o.setName('pin').setDescription('Pin to site?').setRequired(false)),
  
  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Set unit status (Admin only)')
    .addStringOption(o => o.setName('state').setDescription('Status').setRequired(true)
      .addChoices(
        { name: 'Operational', value: 'Operational' },
        { name: 'Standby', value: 'Standby' },
        { name: 'Stand Down', value: 'Stand Down' }
      ))
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
    .addUserOption(o => o.setName('user').setDescription('Applicant').setRequired(true)),
];

async function isAdmin(userId) {
  const { data } = await supabase.from('personnel').select('is_admin').eq('discord_id', userId).single();
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
    
    return interaction.reply({ 
      content: '✅ Application submitted! You will be DMd when reviewed.', 
      ephemeral: true 
    });
  }

  if (!interaction.isChatInputCommand()) return;
  
  // Admin check for all commands
  if (!await isAdmin(interaction.user.id)) {
    return interaction.reply({ content: '❌ Admin only.', ephemeral: true });
  }

  try {
    switch (interaction.commandName) {
      case 'setup':
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

      case 'syncranks':
        await interaction.deferReply({ ephemeral: true });
        
        const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);
        await guild.members.fetch();
        
        let inserted = 0;
        let errors = 0;
        const batch = [];
        
        for (const [memberId, member] of guild.members.cache) {
          if (member.user.bot) continue;
          
          let highestRank = 'Recruit';
          let isAdmin = false;
          
          for (const [roleId, role] of member.roles.cache) {
            if (RANK_MAP[roleId]) {
              const rank = RANK_MAP[roleId];
              if (['High Command', 'Colonel', 'Major', 'Captain'].includes(rank)) {
                isAdmin = true;
              }
              highestRank = rank;
            }
          }
          
          batch.push({
            discord_id: member.id,
            discord_username: member.user.username,
            nickname: member.nickname || member.user.username,
            rank: highestRank,
            is_admin: isAdmin,
            joined_at: member.joinedAt?.toISOString() || new Date().toISOString()
          });
          
          // Batch insert every 50
          if (batch.length >= 50) {
            const { error } = await supabase.from('personnel').upsert(batch, { 
              onConflict: 'discord_id',
              ignoreDuplicates: false 
            });
            if (error) {
              console.error('Batch error:', error);
              errors += batch.length;
            } else {
              inserted += batch.length;
            }
            batch.length = 0;
          }
        }
        
        // Insert remainder
        if (batch.length > 0) {
          const { error } = await supabase.from('personnel').upsert(batch, { 
            onConflict: 'discord_id',
            ignoreDuplicates: false 
          });
          if (error) {
            errors += batch.length;
          } else {
            inserted += batch.length;
          }
        }
        
        await interaction.editReply(`✅ Synced ${inserted} members\n❌ Errors: ${errors}`);
        break;

      case 'addpersonnel':
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

      case 'makesquadron':
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
          await interaction.reply(`✅ Squadron **${interaction.options.getString('name')}** (${interaction.options.getString('callsign').toUpperCase()}) created with leader ${leader.username}`);
        }
        break;

      case 'startop':
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
        
        await interaction.reply(`🎯 **OPERATION ACTIVE**\n**${interaction.options.getString('callsign').toUpperCase()}** - ${interaction.options.getString('name')}`);
        break;

      case 'endop':
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

      case 'announce':
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

      case 'status':
        await supabase.from('config').upsert({
          key: 'unit_status',
          value: {
            status: interaction.options.getString('state'),
            message: interaction.options.getString('message'),
            updated_at: new Date().toISOString(),
            updated_by: interaction.user.id
          }
        });
        
        const statusEmbed = new EmbedBuilder()
          .setTitle('📊 UNIT STATUS UPDATE')
          .setDescription(`**${interaction.options.getString('state')}**\n${interaction.options.getString('message')}`)
          .setColor(interaction.options.getString('state') === 'Operational' ? 0x10B981 : 
                     interaction.options.getString('state') === 'Standby' ? 0xF59E0B : 0xEF4444)
          .setFooter({ text: `Updated by ${interaction.user.username}` })
          .setTimestamp();
        
        await interaction.channel.send({ embeds: [statusEmbed] });
        await interaction.reply({ content: '✅ Status updated!', ephemeral: true });
        break;

      case 'approve':
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
          await target.send(`🎉 **WELCOME TO SAS!**\n\nYour application has been **APPROVED**.\nStarting Rank: **${interaction.options.getString('rank')}**`);
        } catch (e) {
          console.log('Could not DM user');
        }
        
        await interaction.reply(`✅ Approved **${target.username}** as **${interaction.options.getString('rank')}**`);
        break;

      case 'reject':
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
          await rejTarget.send(`❌ **APPLICATION REJECTED**\n\nReason: ${reason}`);
        } catch (e) {
          console.log('Could not DM user');
        }
        
        await interaction.reply(`❌ Rejected **${rejTarget.username}**`);
        break;

      case 'reason':
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
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: `❌ Error: ${err.message}`, ephemeral: true });
  }
});

client.once('ready', async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  
  const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands.map(c => c.toJSON()) }
  );
  console.log('✅ Commands registered');
});

client.login(process.env.BOT_TOKEN);
