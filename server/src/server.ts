import { app } from './app.js';
import { config } from './config/index.js';
import { initDb } from './database/index.js';

async function startServer() {
  await initDb();

  app.listen(config.port, () => {
    console.log(`[Server] No Soul Media Backend running on http://localhost:${config.port}`);
  });
}

startServer().catch((err) => {
  console.error('[Fatal] Server failed to start:', err);
});
