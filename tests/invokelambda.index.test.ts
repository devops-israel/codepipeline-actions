import { readFileSync } from 'fs';
const indexts = require('../services/invoke-lambda/src/index');
const dev_event = JSON.parse(readFileSync('./tests/.eventCodePipeline').toString());
const dev_timeout = 6000;

test(
    'dev - index - Copy artifact',
    async () => {
        const result = await indexts.handler(dev_event, null, null);
        expect(result).toBeDefined();
    },
    dev_timeout,
);
