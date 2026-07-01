import { type ChatInputCommandInteraction, Collection, type RESTPostAPIChatInputApplicationCommandsJSONBody, Routes, type Snowflake } from 'discord.js';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Client } from '../client/Client.js';
import type { BotCommand } from '../types/index.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export class CommandHandler {
  private client: Client;
  public commands: Collection<string, BotCommand> = new Collection();
  public cooldowns: Collection<string, Collection<Snowflake, number>> = new Collection();

  constructor(client: Client) {
    this.client = client;
  }

  async loadCommands(): Promise<void> {
    const modulesPath = join(__dirname, '..', 'modules');
    const modules = readdirSync(modulesPath);

    for (const module of modules) {
      const commandsPath = join(modulesPath, module, 'commands');
      try {
        const files = readdirSync(commandsPath).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
        for (const file of files) {
          const command: BotCommand = await import(`file://${join(commandsPath, file)}`);
          if (command.data?.name) {
            this.commands.set(command.data.name, command);
            this.client.logger.debug(`Komut yüklendi: ${command.data.name} (${module})`);
          }
        }
      } catch {
        continue;
      }
    }

    this.client.logger.info(`${this.commands.size} komut yüklendi`);
  }

  async registerCommands(): Promise<void> {
    await this.loadCommands();

    const commandsData: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
    this.commands.forEach((cmd) => {
      commandsData.push(cmd.data.toJSON());
    });

    try {
      const rest = this.client.client.rest;
      const applicationId = this.client.client.user!.id;

      if (process.env.GUILD_ID) {
        await rest.put(
          Routes.applicationGuildCommands(applicationId, process.env.GUILD_ID),
          { body: commandsData },
        );
        this.client.logger.info(`Komutlar guild'e kaydedildi: ${process.env.GUILD_ID}`);
      } else {
        await rest.put(
          Routes.applicationCommands(applicationId),
          { body: commandsData },
        );
        this.client.logger.info('Komutlar global olarak kaydedildi');
      }
    } catch (error) {
      this.client.logger.error('Komut kaydetme hatası:', error);
    }
  }

  async handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    const command = this.commands.get(interaction.commandName);
    if (!command) return;

    if (command.guildOnly && !interaction.guild) {
      await interaction.reply({ content: 'Bu komut sadece sunucularda kullanılabilir.', ephemeral: true });
      return;
    }

    if (command.permissions) {
      const member = interaction.guild?.members.cache.get(interaction.user.id);
      if (member && !member.permissions.has(command.permissions)) {
        await interaction.reply({ content: 'Bu komutu kullanma yetkin yok.', ephemeral: true });
        return;
      }
    }

    if (command.cooldown) {
      if (!this.cooldowns.has(command.data.name)) {
        this.cooldowns.set(command.data.name, new Collection());
      }
      const now = Date.now();
      const timestamps = this.cooldowns.get(command.data.name)!;
      const cooldownAmount = command.cooldown * 1000;

      if (timestamps.has(interaction.user.id)) {
        const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount;
        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000;
          await interaction.reply({
            content: `Bu komutu tekrar kullanmak için ${timeLeft.toFixed(1)} saniye beklemelisin.`,
            ephemeral: true,
          });
          return;
        }
      }
      timestamps.set(interaction.user.id, now);
      setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
    }

    try {
      await command.execute(interaction, this.client);
    } catch (error) {
      this.client.logger.error(`Komut hatası (${command.data.name}):`, error);
      const reply = { content: 'Komut çalıştırılırken bir hata oluştu.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  }
}
