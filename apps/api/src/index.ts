import 'dotenv/config';
import { env } from './config/app.config.js';
import { app } from './app.js';
import { logger } from '@repo/logger';

const PORT = env.PORT;

app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});
