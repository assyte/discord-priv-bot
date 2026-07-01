import { Client as DiscordClient, GatewayIntentBits, Partials, type ClientOptions, type Interaction } from 'discord.js';
import { CommandHandler } from '../core/CommandHandler.js';
import { ComponentHandler } from '../core/ComponentHandler.js';
import { EventHandler } from '../core/EventHandler.js';
import { Logger } from '../utils/logger.js';

export class Client {
  private static instance: Client;
  public client: DiscordClient;
  public logger: Logger;
  public commandHandler: CommandHandler;
  public componentHandler: ComponentHandler;
  public eventHandler: EventHandler;

  private constructor() {
    this.logger = new Logger('Client');

    const options: ClientOptions = {
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.DirectMessages,
      ],
      partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.User,
        Partials.GuildMember,
      ],
      presence: {
        activities: [{ name: '/yardım | premium bot', type: 3 }],
        status: 'online',
      },
    };

    this.client = new DiscordClient(options);
    this.commandHandler = new CommandHandler(this);
    this.componentHandler = new ComponentHandler(this);
    this.eventHandler = new EventHandler(this);

    this.setupListeners();
  }

  static getInstance(): Client {
    if (!Client.instance) {
      Client.instance = new Client();
    }
    return Client.instance;
  }

  private setupListeners(): void {
    this.client.once('ready', () => {
      this.logger.info(`${this.client.user?.tag} olarak giriş yapıldı!`);
      this.commandHandler.registerCommands();
    });

    this.client.on('interactionCreate', async (interaction: Interaction) => {
      try {
        if (interaction.isChatInputCommand()) {
          await this.commandHandler.handleCommand(interaction);
        } else if (interaction.isButton() || interaction.isStringSelectMenu()) {
          await this.componentHandler.handleComponent(interaction);
        } else if (interaction.isModalSubmit()) {
          await this.componentHandler.handleModal(interaction);
        }
      } catch (error) {
        this.logger.error('Interaction hatası:', error);
        const content = 'Bir hata oluştu.';
        if (interaction.isRepliable()) {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content, ephemeral: true });
          } else {
            await interaction.reply({ content, ephemeral: true });
          }
        }
      }
    });

    this.client.on('error', (error) => {
      this.logger.error('Discord istemci hatası:', error);
    });
  }

  async login(token: string): Promise<void> {
    await this.client.login(token);
  }
}
