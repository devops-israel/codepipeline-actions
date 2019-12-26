import { readFileSync } from 'fs';
const process_approval_dev = require('../services/codepipeline-slack/src/index');
const process_approval_dev_timeout = 8000;
let process_approval_dev_event = JSON.parse(readFileSync('./tests/.eventProcessApproval').toString());
let process_approval_payload = JSON.parse(readFileSync('./tests/.eventSlackPayload').toString());

test(
    'dev - test handler',
    async () => {
        const result = await process_approval_dev.handler(process_approval_dev_event, null, null);
        expect(result).toBeDefined();
    },
    process_approval_dev_timeout,
);

test(
    'dev - slack handler',
    async () => {
        const result = await process_approval_dev.handler(process_approval_payload, null, null);
        expect(result).toBeDefined();
    },
    process_approval_dev_timeout,
);
