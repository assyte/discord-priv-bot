import 'dotenv/config';

const UYE_ROLE_ID = '1521879823855779950';
const TOKEN = process.env.BOT_TOKEN || process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const API = 'https://discord.com/api/v10';

if (!TOKEN) { console.log('TOKEN yok'); process.exit(1); }
if (!GUILD_ID) { console.log('GUILD_ID yok'); process.exit(1); }

async function api(method: string, path: string, body?: any) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Authorization': `Bot ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  // Consume body to free resources
  const text = await res.text().catch(() => '');
  if (res.status === 429) {
    let retry = 5;
    try { retry = JSON.parse(text)?.retry_after || 5; } catch {}
    console.log(`[429] ${retry}s`);
    await new Promise(r => setTimeout(r, retry * 1000 + 1000));
    return api(method, path, body);
  }
  if (!res.ok && res.status !== 404 && res.status !== 204) {
    throw new Error(`${res.status} ${path}: ${text.slice(0, 250)}`);
  }
  return { status: res.status, body: text };
}

async function main() {
  console.log('Rol atama basliyor...');

  // Use the main bot to get member list via API
  const members: any[] = [];
  let lastId = '0';

  while (true) {
    const res = await api('GET', `/guilds/${GUILD_ID}/members?limit=1000&after=${lastId}`);
    let batch;
    try { batch = JSON.parse(res.body); } catch { break; }
    if (!Array.isArray(batch) || batch.length === 0) break;
    for (const m of batch) {
      if (!m.user?.bot && !m.roles?.includes(UYE_ROLE_ID) && (m.roles?.length ?? 0) <= 1) {
        members.push(m);
      }
    }
    lastId = batch[batch.length - 1]?.user?.id;
    if (batch.length < 1000) break;
  }

  console.log(`Hedef: ${members.length} uye`);
  if (!members.length) { console.log('Islem yok'); return; }

  let added = 0;
  let errors = 0;
  let consecutive429 = 0;

  for (let i = 0; i < members.length; i++) {
    try {
      const res = await api('PUT', `/guilds/${GUILD_ID}/members/${members[i].user.id}/roles/${UYE_ROLE_ID}`);
      if (res.status === 429) {
        consecutive429++;
        errors++;
        i--;
        if (consecutive429 > 5) {
          console.log('Cok fazla 429, 30sn mola');
          await new Promise(r => setTimeout(r, 30000));
          consecutive429 = 0;
        }
        continue;
      }
      if (res.status < 400) {
        added++;
        consecutive429 = 0;
      } else {
        errors++;
      }
    } catch (e: any) {
      errors++;
      if (errors <= 5) console.log(`HATA[${i}]: ${e?.message?.slice(0, 100)}`);
    }

    if (added % 100 === 0 && added > 0) {
      console.log(`+${added} (${Math.round(added*100/members.length)}%)`);
    }

    await new Promise(r => setTimeout(r, 1100));
  }

  console.log(`\nTamam: ${added}/${members.length}, Hata: ${errors}`);
}

main().catch(e => { console.error('CRASH:', e); process.exit(1); });
