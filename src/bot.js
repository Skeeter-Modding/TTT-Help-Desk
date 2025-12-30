const { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits } = require('discord.js');
const dotenv = require('dotenv');

dotenv.config();

const requiredEnv = ['DISCORD_TOKEN', 'GUILD_ID', 'STAFF_ROLE_ID'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

const createTicketId = () => {
  const now = Date.now().toString();
  return now.slice(-6);
};

const sanitizeChannelName = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  await guild.commands.set([
    {
      name: 'ticket',
      description: 'Open a support ticket with the TTT Help Desk.',
      options: [
        {
          name: 'issue',
          description: 'Briefly describe your issue.',
          type: 3,
          required: false,
        },
      ],
    },
    {
      name: 'close',
      description: 'Close the current ticket channel.',
    },
  ]);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  if (interaction.commandName === 'ticket') {
    const guild = interaction.guild;
    const member = interaction.member;
    const staffRoleId = process.env.STAFF_ROLE_ID;
    const ticketCategoryId = process.env.TICKET_CATEGORY_ID || null;
    const staffCategoryId = process.env.STAFF_PRIVATE_CATEGORY_ID || ticketCategoryId;

    const ticketId = createTicketId();
    const channelSlug = sanitizeChannelName(interaction.user.username) || 'player';
    const ticketChannelName = `ticket-${channelSlug}-${ticketId}`;
    const staffChannelName = `staff-${ticketId}`;

    const basePermissions = [
      {
        id: guild.roles.everyone,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: staffRoleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
      {
        id: interaction.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
    ];

    const ticketChannel = await guild.channels.create({
      name: ticketChannelName,
      type: ChannelType.GuildText,
      parent: ticketCategoryId,
      permissionOverwrites: basePermissions,
      topic: `TTT Help Desk ticket for ${interaction.user.tag} (${ticketId})`,
    });

    const staffChannel = await guild.channels.create({
      name: staffChannelName,
      type: ChannelType.GuildText,
      parent: staffCategoryId,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: staffRoleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
      ],
      topic: `Private staff discussion for ticket ${ticketId}`,
    });

    const issue = interaction.options.getString('issue');
    await ticketChannel.send({
      content: [
        `👋 Welcome, ${interaction.user}!`,
        'A staff member will be with you shortly.',
        issue ? `**Issue:** ${issue}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    });

    await staffChannel.send({
      content: [
        `🗂️ Staff discussion channel for ticket **${ticketId}**.`,
        `Ticket channel: ${ticketChannel}`,
        `Opened by: ${interaction.user.tag}`,
        issue ? `**Issue:** ${issue}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    });

    await interaction.reply({
      content: `✅ Your ticket has been created: ${ticketChannel}`,
      ephemeral: true,
    });
  }

  if (interaction.commandName === 'close') {
    const staffRoleId = process.env.STAFF_ROLE_ID;

    if (!interaction.member.roles.cache.has(staffRoleId)) {
      await interaction.reply({
        content: 'Only staff members can close tickets.',
        ephemeral: true,
      });
      return;
    }

    const channel = interaction.channel;
    await channel.setName(`closed-${channel.name}`);
    await channel.send('🔒 This ticket has been closed by staff.');
    await interaction.reply({
      content: 'Ticket closed.',
      ephemeral: true,
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
