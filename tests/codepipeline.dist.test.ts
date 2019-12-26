import { readFileSync } from 'fs';
const process_approval_dist = require('../services/process-approval/dist/index');
const process_approval_dist_timeout = 8000;
let process_approval_dist_event = JSON.parse(readFileSync('./tests/.eventProcessApproval').toString());

test(
    'dist - test handler',
    async () => {
        const result = await process_approval_dist.handler(process_approval_dist_event, null, null);
        expect(result).toBeDefined();
    },
    process_approval_dist_timeout,
);

test(
    'dist - test handler',
    async () => {
        const result = await process_approval_dist.handler(process_approval_dist_event, null, null);
        expect(result).toBeDefined();
    },
    process_approval_dist_timeout,
);
