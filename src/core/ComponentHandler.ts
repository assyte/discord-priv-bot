import { type ButtonInteraction, type ModalSubmitInteraction, type StringSelectMenuInteraction, Collection } from 'discord.js';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Client } from '../client/Client.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

interface Component {
  customId: string;
  execute: (interaction: ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction, client: Client) => Promise<void>;
}

interface Modal {
  customId: string;
  execute: (interaction: ModalSubmitInteraction, client: Client) => Promise<void>;
}

export class ComponentHandler {
  private client: Client;
  public buttons: Collection<string, Component> = new Collection();
  public selectMenus: Collection<string, Component> = new Collection();
  public modals: Collection<string, Modal> = new Collection();

  constructor(client: Client) {
    this.client = client;
    this.loadComponents();
  }

  private loadComponents(): void {
    const modulesPath = join(__dirname, '..', 'modules');
    const modules = readdirSync(modulesPath);

    for (const module of modules) {
      const componentsPath = join(modulesPath, module, 'components');
      try {
        const files = readdirSync(componentsPath).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
        for (const file of files) {
          const component: Component = { customId: '', execute: async () => {} };
          const imported = { ...component, ...require(join(componentsPath, file)) };
          if (imported.customId) {
            this.buttons.set(imported.customId, imported);
            this.client.logger.debug(`Component yüklendi: ${imported.customId}`);
          }
        }
      } catch {
        continue;
      }
    }
  }

  async handleComponent(interaction: ButtonInteraction | StringSelectMenuInteraction): Promise<void> {
    const component = this.buttons.get(interaction.customId);
    if (!component) return;

    try {
      await component.execute(interaction, this.client);
    } catch (error) {
      this.client.logger.error(`Component hatası (${interaction.customId}):`, error);
      await interaction.reply({ content: 'Bir hata oluştu.', ephemeral: true });
    }
  }

  async handleModal(interaction: ModalSubmitInteraction): Promise<void> {
    const modal = this.modals.get(interaction.customId);
    if (!modal) return;

    try {
      await modal.execute(interaction, this.client);
    } catch (error) {
      this.client.logger.error(`Modal hatası (${interaction.customId}):`, error);
      await interaction.reply({ content: 'Bir hata oluştu.', ephemeral: true });
    }
  }
}
