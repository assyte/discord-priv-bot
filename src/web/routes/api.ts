import { Router } from 'express';
import { config } from 'dotenv';
import { Logger } from '../../utils/logger.js';
import { handleMatchReady, handleMatchFinished } from '../../bot/services/voiceMover.js';

config();

const logger = new Logger('API_Routes');
const router = Router();

// FACEIT Webhook Endpoint
router.post('/faceit-webhook', async (req, res) => {
  // Basit Authorization (İsteğe bağlı, Faceit ayarlarına bağlı)
  const authHeader = req.headers.authorization;
  if (process.env.FACEIT_WEBHOOK_SECRET && authHeader !== `Bearer ${process.env.FACEIT_WEBHOOK_SECRET}`) {
    return res.status(401).send('Unauthorized');
  }

  const payload = req.body;
  const event = payload.event;
  
  logger.info(`FACEIT Webhook alındı: ${event}`);

  try {
    if (event === 'match_status_ready') {
      await handleMatchReady(payload.payload);
    } else if (event === 'match_status_finished' || event === 'match_status_aborted' || event === 'match_status_cancelled') {
      await handleMatchFinished(payload.payload);
    }

    res.status(200).send('OK');
  } catch (error) {
    logger.error('Webhook işlenirken hata oluştu:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
