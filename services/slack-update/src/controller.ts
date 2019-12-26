import { promisePost, toTitleCase } from '../../slack-shared/src/controller';
const slack_bot_oauth_token: string = process.env.SLACK_BOT_OAUTH_TOKEN;

function cleanBlocks(blocks: any) {
  blocks.pop(); // remove divider
  blocks.pop(); // remove action buttons
  blocks.pop(); // remove approve question
  delete blocks[1]['accessory']['fallback'];
  delete blocks[1]['accessory']['image_width'];
  delete blocks[1]['accessory']['image_height'];
  delete blocks[1]['accessory']['image_bytes'];
  return blocks;
}

export async function sendSlack(event: any) {
  // Someone clicked Yes/No, update original message with status
  let blocks = null;
  if (event['message'] && event['actions']) {
    try {
      console.log('UserInteractionEvent');
      let action_taken = JSON.parse(event.actions[0]['value']);
      blocks = cleanBlocks(event['message']['blocks']);
      let emoji = ':x:';
      if (action_taken.action == 'Approved') {
        emoji = ':heavy_check_mark:';
      }
      let my_block = {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji} ${toTitleCase(event.user.name)} ${action_taken.action}`,
        },
      };
      blocks.push(my_block);
      blocks.push({
        type: 'divider',
      });
    } catch (e) {
      return e;
    }

    const post_body = {
      channel: event['channel']['id'],
      text: 'Text message',
      blocks: blocks,
      ts: event['message']['ts'], // original message time stamp
      as_user: true, // required for bot users
    };
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${slack_bot_oauth_token}`,
    };

    return promisePost('https://slack.com/api/chat.update', post_body, headers)
      .then(function(postResponse: any) {
        console.log('Update chat message:', postResponse.data);
        return postResponse.data;
      })
      .catch(function(err: any) {
        return err;
      });
  } else {
    return 'Not Slack Payload';
  }
}
