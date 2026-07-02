import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Client } from '../client/Client.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export class EventHandler {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async loadEvents(): Promise<void> {
    const modulesPath = join(__dirname, '..', 'modules');
    const modules = readdirSync(modulesPath);

    for (const module of modules) {
      const eventsPath = join(modulesPath, module, 'events');
      try {
        const files = readdirSync(eventsPath).filter(f => f.endsWith('.js') && !f.endsWith('.d.ts') && !f.endsWith('.d.ts.map'));
        for (const file of files) {
          const eventModule = await import(join(eventsPath, file));

          for (const [exportName, fn] of Object.entries(eventModule)) {
            if (typeof fn === 'function' && exportName !== 'default') {
              this.client.client.on(exportName, (...args: unknown[]) => fn(this.client, ...args));
              this.client.logger.debug(`Event yüklendi: ${exportName} (${module}/${file})`);
            }
          }
        }
      } catch (err) {
        this.client.logger.debug(`Event yüklenemedi (${module}): ${err}`);
        continue;
      }
    }
  }
}
