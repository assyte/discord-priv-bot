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
  }

  async loadComponents(): Promise<void> {
    const modulesPath = join(__dirname, '..', 'modules');
    const modules = readdirSync(modulesPath);

    for (const module of modules) {
      const componentsPath = join(modulesPath, module, 'components');
      try {
        const files = readdirSync(componentsPath).filter(f => f.endsWith('.js') && !f.endsWith('.d.ts') && !f.endsWith('.d.ts.map'));
        for (const file of files) {
          const imported = await import(join(componentsPath, file));
          if (imported.customId) {
            if (imported.isModal) {
              this.modals.set(imported.customId, imported);
              this.client.logger.debug(`Modal yüklendi: ${imported.customId}`);
            } else {
              this.buttons.set(imported.customId, imported);
              this.client.logger.debug(`Component yüklendi: ${imported.customId}`);
            }
          }
          // prefix, prefix2, prefix3 ... şeklindeki tüm prefix export'larını kayıt et
          for (const key of Object.keys(imported)) {
            if (key === 'prefix' || key.match(/^prefix\d+$/)) {
              const prefixVal = imported[key];
              if (typeof prefixVal === 'string') {
                this.buttons.set(prefixVal, imported);
                this.client.logger.debug(`Prefix component yüklendi: ${prefixVal}`);
              }
            }
          }
        }

      } catch (err) {
        this.client.logger.debug(`Component yüklenemedi (${module}): ${err}`);
        continue;
      }
    }
  }

  async handleComponent(interaction: ButtonInteraction | StringSelectMenuInteraction): Promise<void> {
    let component = this.buttons.get(interaction.customId);
    if (!component) {
      for (const [key, val] of this.buttons.entries()) {
        if (interaction.customId.startsWith(key)) {
          component = val;
          break;
        }
      }
    }
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
