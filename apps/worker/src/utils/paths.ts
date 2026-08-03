import os from 'node:os';
import path from 'node:path';

export const TEMP_DIR = path.join(os.tmpdir(), 'meetinglens');