import { readFileSync } from 'fs';
const indexts = require('../services/slack-post/src/index');
let sendslack_dev_event = JSON.parse(readFileSync('./tests/.eventSendSlack').toString());
let sendslack_postback_event = readFileSync('./tests/.eventPostback').toString();
const sendslack_dev_timeout = 8000;

test(
    'spec - slack post',
    async () => {
        const result = await indexts.handler(sendslack_dev_event, null, null);
        expect(result).toBeDefined();
    },
    sendslack_dev_timeout,
);

test(
    'dev - index - Slack postback',
    async () => {
        const result = await indexts.handler(sendslack_postback_event, null, null);
        expect(result).toBeDefined();
    },
    sendslack_dev_timeout,
);
