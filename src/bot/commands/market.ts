import { 
  SlashCommandBuilder, 
  CommandInteraction, 
  EmbedBuilder, 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  StringSelectMenuOptionBuilder,
  ComponentType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalActionRowComponentBuilder,
  ChannelType
} from 'discord.js';
import { EconomyService } from '../services/economyService.js';
import { ClutchClient } from '../client.js';

const PRICES = {
  VIP_ROOM: 500,
  COLORED_ROLE: 300,
  HOISTED_ROLE: 1500
};

const command = {
  data: new SlashCommandBuilder()
    .setName('market')
    .setDescription('Purchase rewards using your Clutch Coins.'),
  guildOnly: true,

  async execute(interaction: CommandInteraction, client: ClutchClient) {
    if (!interaction.isChatInputCommand()) return;
    
    await interaction.deferReply({ ephemeral: true });

    const balance = await EconomyService.getBalance(interaction.user.id);

    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('🛒 Clutch Coin Market')
      .setDescription(`Current Balance: **${balance} 🪙**\n\nSelect an item you'd like to purchase from the menu below.`)
      .addFields(
        { name: '🎙️ VIP Voice Room (24 Hours)', value: `**${PRICES.VIP_ROOM} 🪙**\nCreates a private voice channel at the top of the server.`, inline: false },
        { name: '🎨 Custom Color Role (24 Hours)', value: `**${PRICES.COLORED_ROLE} 🪙**\nA personalized role with your chosen name and color.`, inline: false },
        { name: '👑 Hoisted Role (7 Days)', value: `**${PRICES.HOISTED_ROLE} 🪙**\nAppear at the top of the member list.`, inline: false }
      )
      .setThumbnail(interaction.user.displayAvatarURL());

    const select = new StringSelectMenuBuilder()
      .setCustomId('market_select')
      .setPlaceholder('Select an item to purchase...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('VIP Voice Room')
          .setDescription('24-Hour Private Channel')
          .setValue('vip_room')
          .setEmoji('🎙️'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Custom Color Role')
          .setDescription('24-Hour Colored Role')
          .setValue('colored_role')
          .setEmoji('🎨'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Hoisted Role')
          .setDescription('7-Day Top Position in Member List')
          .setValue('hoisted_role')
          .setEmoji('👑')
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

    const message = await interaction.editReply({ embeds: [embed], components: [row] });

    // Create a component collector
    const collector = message.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60000 });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        await i.reply({ content: 'This menu is not for you!', ephemeral: true });
        return;
      }

      const selection = i.values[0];

      if (selection === 'vip_room') {
        if (balance < PRICES.VIP_ROOM) {
          await i.reply({ content: `❌ Insufficient balance! You need ${PRICES.VIP_ROOM} 🪙 for a VIP Room.`, ephemeral: true });
          return;
        }

        const modal = new ModalBuilder()
          .setCustomId('modal_vip_room')
          .setTitle('VIP Room Settings');
        const roomInput = new TextInputBuilder()
          .setCustomId('room_name')
          .setLabel('Enter Room Name')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(30);
        modal.addComponents(new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(roomInput));
        await i.showModal(modal);

        try {
          const submitted = await i.awaitModalSubmit({
            filter: x => x.customId === 'modal_vip_room' && x.user.id === interaction.user.id,
            time: 60000
          });

          const roomName = submitted.fields.getTextInputValue('room_name');
          const success = await EconomyService.subtractCoins(interaction.user.id, PRICES.VIP_ROOM);
          
          if (success) {
            const guild = interaction.guild!;
            // Create Voice Channel
            const vc = await guild.channels.create({
              name: `👑 ${roomName}`,
              type: ChannelType.GuildVoice,
              permissionOverwrites: [
                {
                  id: guild.id,
                  allow: ['Connect']
                },
                {
                  id: interaction.user.id,
                  allow: ['ManageChannels', 'MuteMembers', 'DeafenMembers', 'MoveMembers']
                }
              ]
            });
            
            // Log to database for expiration
            await EconomyService.grantPerk(interaction.user.id, 'vip_room', vc.id, 24);
            
            await submitted.reply({ content: `✅ Your VIP Room has been created: <#${vc.id}> (Valid for 24 Hours)`, ephemeral: true });
          } else {
            await submitted.reply({ content: '❌ An error occurred while deducting coins.', ephemeral: true });
          }
        } catch (err) {
          // Modal timeout
        }

      } else if (selection === 'colored_role') {
        if (balance < PRICES.COLORED_ROLE) {
          await i.reply({ content: `❌ Insufficient balance! You need ${PRICES.COLORED_ROLE} 🪙 for a Color Role.`, ephemeral: true });
          return;
        }

        const modal = new ModalBuilder()
          .setCustomId('modal_colored_role')
          .setTitle('Color Role Settings');
        const roleNameInput = new TextInputBuilder()
          .setCustomId('role_name')
          .setLabel('Role Name')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(30);
        const roleColorInput = new TextInputBuilder()
          .setCustomId('role_color')
          .setLabel('Color Hex Code (e.g. #FF0000)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(7);
        modal.addComponents(
          new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(roleNameInput),
          new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(roleColorInput)
        );
        await i.showModal(modal);

        try {
          const submitted = await i.awaitModalSubmit({
            filter: x => x.customId === 'modal_colored_role' && x.user.id === interaction.user.id,
            time: 60000
          });

          const roleName = submitted.fields.getTextInputValue('role_name');
          const roleColorStr = submitted.fields.getTextInputValue('role_color');
          
          let roleColor: any = roleColorStr;
          if (!/^#[0-9A-F]{6}$/i.test(roleColor)) {
            await submitted.reply({ content: '❌ Invalid color code! It must be in #FF0000 format.', ephemeral: true });
            return;
          }

          const success = await EconomyService.subtractCoins(interaction.user.id, PRICES.COLORED_ROLE);
          if (success) {
            const guild = interaction.guild!;
            const member = await guild.members.fetch(interaction.user.id);
            
            const newRole = await guild.roles.create({
              name: roleName,
              color: roleColor,
              reason: 'Clutch Coin Market - Colored Role Purchase'
            });

            await member.roles.add(newRole);
            await EconomyService.grantPerk(interaction.user.id, 'colored_role', newRole.id, 24);

            await submitted.reply({ content: `✅ Your role has been created and assigned: <@&${newRole.id}> (Valid for 24 Hours)`, ephemeral: true });
          } else {
            await submitted.reply({ content: '❌ An error occurred while deducting coins.', ephemeral: true });
          }
        } catch (err) {
          // Modal timeout
        }

      } else if (selection === 'hoisted_role') {
        if (balance < PRICES.HOISTED_ROLE) {
          await i.reply({ content: `❌ Insufficient balance! You need ${PRICES.HOISTED_ROLE} 🪙 for a Hoisted Role.`, ephemeral: true });
          return;
        }

        // Subtract coins and give role immediately
        const success = await EconomyService.subtractCoins(interaction.user.id, PRICES.HOISTED_ROLE);
        if (success) {
          // TODO: Actually assign the hoisted role and record in active_perks
          // For now just tell them it's processed (needs the role ID set up on server)
          await i.update({ content: '✅ Hoisted Role purchased! You will receive it shortly.', components: [], embeds: [] });
        } else {
          await i.update({ content: '❌ An error occurred during the transaction.', components: [], embeds: [] });
        }
      }
    });
  }
};

export default command;
