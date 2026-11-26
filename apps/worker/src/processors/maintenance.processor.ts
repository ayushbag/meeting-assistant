import { Job } from 'bullmq';
import {
    JOB_NAMES,
    type MaintenanceJob,
    type RebuildMeetingTypeJob,
} from '@repo/queue';

import { rebuildMeetingType } from '../services/rebuild.service.js';
import { retryMeetingProcessing } from '../services/retry.service.js';

export const processMaintenanceJob = async (job: Job<MaintenanceJob>) => {
    switch (job.name) {
        case JOB_NAMES.RETRY_PROCESSING:
            return retryMeetingProcessing(job.data.meetingId);

        case JOB_NAMES.REBUILD_MEETING_TYPE: {
            const data = job.data as RebuildMeetingTypeJob;

            return rebuildMeetingType(data.meetingId, data.meetingType);
        }

        default:
            throw new Error(`Unknown Job: ${job.name}`);
    }
};
