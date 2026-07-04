import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { Logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logger = new Logger('BotClient');

export class ClutchClient extends Client {
  public commands: Collection<string, any>;

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers
      ]
    });
    this.commands = new Collection();
  }

  public async init() {
    await this.loadCommands();
    await this.loadEvents();
    
    if (!process.env.BOT_TOKEN) {
      logger.error('BOT_TOKEN bulunamadı!');
      return;
    }

    await this.login(process.env.BOT_TOKEN);
  }

  private async loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');
    if (!fs.existsSync(commandsPath)) fs.mkdirSync(commandsPath, { recursive: true });
    
    const commandFiles = fs.readdirSync(commandsPath).filter(file => 
      (file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.d.ts')
    );
    const slashCommands: any[] = [];

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      // Windows için file:// eklentisi (dinamik import)
      const command = await import(`file://${filePath}`);
      if (command.default && command.default.data && command.default.execute) {
        this.commands.set(command.default.data.name, command.default);
        slashCommands.push(command.default.data.toJSON());
      } else {
        logger.warn(`${file} geçerli bir komut yapısına sahip değil.`);
      }
    }

    // Register Slash Commands
    if (slashCommands.length > 0) {
      const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN!);
      try {
        logger.info(`Started refreshing ${slashCommands.length} application (/) commands.`);
        await rest.put(
          Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!),
          { body: slashCommands },
        );
        logger.info('Successfully reloaded application (/) commands.');
      } catch (error) {
        logger.error('Slash komutları yüklenirken hata oluştu:', error);
      }
    }
  }

  private async loadEvents() {
    const eventsPath = path.join(__dirname, 'events');
    if (!fs.existsSync(eventsPath)) fs.mkdirSync(eventsPath, { recursive: true });

    const eventFiles = fs.readdirSync(eventsPath).filter(file => 
      (file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.d.ts')
    );

    for (const file of eventFiles) {
      const filePath = path.join(eventsPath, file);
      const event = await import(`file://${filePath}`);
      if (event.default && event.default.name) {
        if (event.default.once) {
          this.once(event.default.name, (...args) => event.default.execute(this, ...args));
        } else {
          this.on(event.default.name, (...args) => event.default.execute(this, ...args));
        }
      }
    }
  }
}

let clientInstance: ClutchClient;

export async function startBot() {
  clientInstance = new ClutchClient();
  await clientInstance.init();
  return clientInstance;
}

export function getClient() {
  return clientInstance;
}
