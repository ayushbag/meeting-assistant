import { Queue } from 'bullmq';

import type { QueueConfig } from '../types.js';
import { QUEUE_NAMES } from '../queue-names.js';
import type { MaintenanceJob } from '../job-types.js';

export const createMaintenanceQueue = (config: QueueConfig) => {
    return new Queue<MaintenanceJob>(QUEUE_NAMES.MEETING_MAINTENANCE, {
        connection: config.connection,
        defaultJobOptions: config.defaultJobOptions,
    });
};
