import { promisePost } from '../../slack-shared/src/controller';
import { getTemplate } from './template';
const slack_bot_oauth_token: string = process.env.SLACK_BOT_OAUTH_TOKEN;

export async function sendSlack(event: any) {
  console.log(JSON.stringify(event));
  if (event['Records']) {
    console.log('Post approval info');
    const post_body = await getTemplate(event);
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${slack_bot_oauth_token}`,
    };

    return promisePost('https://slack.com/api/chat.postMessage', post_body, headers)
      .then(function(postResponse: any) {
        return postResponse.data;
      })
      .catch(function(err: any) {
        console.log(err);
        return err;
      });
  } else {
    return 'Not SNS Event';
  }
}
