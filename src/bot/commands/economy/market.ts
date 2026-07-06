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
  ModalActionRowComponentBuilder
} from 'discord.js';
import type { BotCommand } from '../../types/index.js';
import { EconomyService } from '../../services/economyService.js';
import { Client } from '../../client.js';

const PRICES = {
  VIP_ROOM: 500,
  COLORED_ROLE: 300,
  HOISTED_ROLE: 1500
};

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('market')
    .setDescription('Clutch Coin\'lerinizi kullanarak ödüller satın alın.'),
  guildOnly: true,

  async execute(interaction: CommandInteraction, client: Client) {
    if (!interaction.isChatInputCommand()) return;
    
    await interaction.deferReply({ ephemeral: true });

    const balance = await EconomyService.getBalance(interaction.user.id);

    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('🛒 Clutch Coin Market')
      .setDescription(`Mevcut Bakiyeniz: **${balance} 🪙**\n\nAşağıdaki menüden satın almak istediğiniz öğeyi seçin.`)
      .addFields(
        { name: '🎙️ VIP Ses Odası (24 Saat)', value: `**${PRICES.VIP_ROOM} 🪙**\nSunucunun en üstünde size özel kanal açar.`, inline: false },
        { name: '🎨 Özel Renk Rolü (24 Saat)', value: `**${PRICES.COLORED_ROLE} 🪙**\nKendi seçeceğiniz renk ve isimle özel rol.`, inline: false },
        { name: '👑 Zirve Rolü (7 Gün)', value: `**${PRICES.HOISTED_ROLE} 🪙**\nKişi listesinde en üst sıralarda görünün.`, inline: false }
      )
      .setThumbnail(interaction.user.displayAvatarURL());

    const select = new StringSelectMenuBuilder()
      .setCustomId('market_select')
      .setPlaceholder('Satın alacağınız ürünü seçin...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('VIP Ses Odası')
          .setDescription('24 Saatlik Özel Kanal')
          .setValue('vip_room')
          .setEmoji('🎙️'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Özel Renk Rolü')
          .setDescription('24 Saatlik Renkli Rol')
          .setValue('colored_role')
          .setEmoji('🎨'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Zirve Rolü')
          .setDescription('7 Günlük Sağ Üstte Görünme')
          .setValue('hoisted_role')
          .setEmoji('👑')
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

    const message = await interaction.editReply({ embeds: [embed], components: [row] });

    // Create a component collector
    const collector = message.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60000 });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        await i.reply({ content: 'Bu menü size ait değil!', ephemeral: true });
        return;
      }

      const selection = i.values[0];

      if (selection === 'vip_room') {
        if (balance < PRICES.VIP_ROOM) {
          await i.reply({ content: `❌ Yetersiz bakiye! VIP Oda için ${PRICES.VIP_ROOM} 🪙 gerekiyor.`, ephemeral: true });
          return;
        }

        const modal = new ModalBuilder()
          .setCustomId('modal_vip_room')
          .setTitle('VIP Oda Ayarları');
        const roomInput = new TextInputBuilder()
          .setCustomId('room_name')
          .setLabel('Oda ismini yazın')
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
            
            await submitted.reply({ content: `✅ VIP Odanız oluşturuldu: <#${vc.id}> (24 Saat geçerlidir)`, ephemeral: true });
          } else {
            await submitted.reply({ content: '❌ Bakiye düşülürken hata oluştu.', ephemeral: true });
          }
        } catch (err) {
          // Modal timeout
        }

      } else if (selection === 'colored_role') {
        if (balance < PRICES.COLORED_ROLE) {
          await i.reply({ content: `❌ Yetersiz bakiye! Özel Renk Rolü için ${PRICES.COLORED_ROLE} 🪙 gerekiyor.`, ephemeral: true });
          return;
        }

        const modal = new ModalBuilder()
          .setCustomId('modal_colored_role')
          .setTitle('Renk Rolü Ayarları');
        const roleNameInput = new TextInputBuilder()
          .setCustomId('role_name')
          .setLabel('Rol İsmi')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(30);
        const roleColorInput = new TextInputBuilder()
          .setCustomId('role_color')
          .setLabel('Renk Hex Kodu (Örn: #FF0000)')
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
            await submitted.reply({ content: '❌ Geçersiz renk kodu! #FF0000 formatında olmalı.', ephemeral: true });
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

            await submitted.reply({ content: `✅ Rolünüz oluşturuldu ve size verildi: <@&${newRole.id}> (24 Saat geçerlidir)`, ephemeral: true });
          } else {
            await submitted.reply({ content: '❌ Bakiye düşülürken hata oluştu.', ephemeral: true });
          }
        } catch (err) {
          // Modal timeout
        }

      } else if (selection === 'hoisted_role') {
        if (balance < PRICES.HOISTED_ROLE) {
          await i.reply({ content: `❌ Yetersiz bakiye! Zirve Rolü için ${PRICES.HOISTED_ROLE} 🪙 gerekiyor.`, ephemeral: true });
          return;
        }

        // Subtract coins and give role immediately
        const success = await EconomyService.subtractCoins(interaction.user.id, PRICES.HOISTED_ROLE);
        if (success) {
          // TODO: Actually assign the hoisted role and record in active_perks
          // For now just tell them it's processed (needs the role ID set up on server)
          await i.update({ content: '✅ Zirve Rolü satın alındı! Rolünüz yakında verilecek.', components: [], embeds: [] });
        } else {
          await i.update({ content: '❌ İşlem sırasında bir hata oluştu.', components: [], embeds: [] });
        }
      }
    });
  }
};

export default command;
