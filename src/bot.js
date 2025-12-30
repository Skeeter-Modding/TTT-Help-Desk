const {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');
const dotenv = require('dotenv');

dotenv.config();

const requiredEnv = ['DISCORD_TOKEN', 'GUILD_ID', 'STAFF_ROLE_ID', 'PANEL_CHANNEL_ID'];
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

const parseTicketRouting = () => {
  if (!process.env.TICKET_ROUTING) {
    return [
      {
        label: 'General Support',
        value: 'general',
        staffRoleId: process.env.STAFF_ROLE_ID,
      },
    ];
  }

  try {
    const parsed = JSON.parse(process.env.TICKET_ROUTING);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('TICKET_ROUTING must be a non-empty array.');
    }
    return parsed.map((route) => ({
      label: route.label || 'Support',
      value: route.value || 'support',
      staffRoleId: route.staffRoleId || process.env.STAFF_ROLE_ID,
    }));
  } catch (error) {
    console.error('Invalid TICKET_ROUTING JSON. Falling back to default routing.', error);
    return [
      {
        label: 'General Support',
        value: 'general',
        staffRoleId: process.env.STAFF_ROLE_ID,
      },
    ];
  }
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
      name: 'close',
      description: 'Close the current ticket channel.',
    },
  ]);

  const panelChannel = await guild.channels.fetch(process.env.PANEL_CHANNEL_ID);
  if (!panelChannel || panelChannel.type !== ChannelType.GuildText) {
    console.error('PANEL_CHANNEL_ID must point to a text channel.');
    return;
  }

  const ticketRouting = parseTicketRouting();
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('ticket-panel')
    .setPlaceholder('Select a ticket type')
    .addOptions(
      ticketRouting.map((route) => ({
        label: route.label,
        value: route.value,
      }))
    );

  const panelMessage = {
    content: [
      '🎫 **TTT Help Desk**',
      'Select the ticket type below to open a private support channel.',
    ].join('\n'),
    components: [new ActionRowBuilder().addComponents(selectMenu)],
  };

  if (process.env.PANEL_MESSAGE_ID) {
    try {
      const existing = await panelChannel.messages.fetch(process.env.PANEL_MESSAGE_ID);
      await existing.edit(panelMessage);
      return;
    } catch (error) {
      console.warn('Unable to edit PANEL_MESSAGE_ID message. Sending a new panel.', error);
    }
  }

  await panelChannel.send(panelMessage);
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isStringSelectMenu() && interaction.customId === 'ticket-panel') {
    const guild = interaction.guild;
    const ticketCategoryId = process.env.TICKET_CATEGORY_ID || null;
    const staffCategoryId = process.env.STAFF_PRIVATE_CATEGORY_ID || ticketCategoryId;
    const ticketRouting = parseTicketRouting();
    const selectedValue = interaction.values[0];
    const selectedRoute = ticketRouting.find((route) => route.value === selectedValue);
    const staffRoleId = selectedRoute?.staffRoleId || process.env.STAFF_ROLE_ID;

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

    try {
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

      await ticketChannel.send({
        content: [
          `👋 Welcome, ${interaction.user}!`,
          'A staff member will be with you shortly.',
          selectedRoute ? `**Type:** ${selectedRoute.label}` : null,
        ]
          .filter(Boolean)
          .join('\n'),
      });

      await staffChannel.send({
        content: [
          `🗂️ Staff discussion channel for ticket **${ticketId}**.`,
          `Ticket channel: ${ticketChannel}`,
          `Opened by: ${interaction.user.tag}`,
          selectedRoute ? `**Type:** ${selectedRoute.label}` : null,
        ]
          .filter(Boolean)
          .join('\n'),
      });

      await interaction.reply({
        content: `✅ Your ticket has been created: ${ticketChannel}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Failed to create ticket:', error);
      const errorMessage = {
        content: '❌ Failed to create your ticket. Please try again later or contact an administrator.',
        ephemeral: true,
      };
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
    return;
  }

  if (interaction.isChatInputCommand() && interaction.commandName === 'close') {
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
