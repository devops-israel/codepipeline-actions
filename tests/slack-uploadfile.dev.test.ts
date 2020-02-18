const indexts = require('../services/slack-uploadfile/src/index');
const sendslack_dev_timeout = 8000;

test(
  'spec - slack upload file',
  async () => {
    const result = await indexts.handler("{'some': 'event'}", null, null);
    expect(result).toBeDefined();
  },
  sendslack_dev_timeout,
);
