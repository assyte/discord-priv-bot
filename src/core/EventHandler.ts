import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Client } from '../client/Client.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export class EventHandler {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
    this.loadEvents();
  }

  private loadEvents(): void {
    const modulesPath = join(__dirname, '..', 'modules');
    const modules = readdirSync(modulesPath);

    for (const module of modules) {
      const eventsPath = join(modulesPath, module, 'events');
      try {
        const files = readdirSync(eventsPath).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
        for (const file of files) {
          const eventName = file.replace(/\.(ts|js)$/, '');
          const eventModule = require(join(eventsPath, file));
          const execute = eventModule.default || eventModule;

          const eventKey = eventName
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .replace(/^_/, '');

          this.client.client.on(eventKey, (...args: unknown[]) => execute(this.client, ...args));
          this.client.logger.debug(`Event yüklendi: ${eventKey} (${module})`);
        }
      } catch {
        continue;
      }
    }
  }
}
