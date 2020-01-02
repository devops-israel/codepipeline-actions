import { promisePost } from '../../slack-shared/src/controller';
import { getS3Object } from '../../shared/src/controller';
const FormData = require('form-data');
const slack_upload_channel = process.env.SLACK_UPLOAD_CHANNEL;
const slack_bot_oauth_token: string = process.env.SLACK_BOT_OAUTH_TOKEN;
const slack_upload_file_name: string = process.env.SLACK_UPLOAD_FILE_NAME;
const slack_upload_bucket_name: string = process.env.SLACK_UPLOAD_BUCKET_NAME;
const slack_upload_message: string = process.env.SLACK_UPLOAD_MESSAGE;

export async function uploadFileToSlack(event: any) {
  console.log('Upload file to slack channel');
  const s3_object = await getS3Object(slack_upload_file_name, slack_upload_bucket_name);
  const form_data = new FormData();
  if (event['thread_ts']) {
    form_data.append('thread_ts', event['thread_ts']);
  }
  form_data.append('channels', slack_upload_channel);
  form_data.append('filename', slack_upload_file_name);
  form_data.append('filetype', 'auto');
  form_data.append('title', slack_upload_file_name);
  form_data.append('initial_comment', slack_upload_message);
  form_data.append('content', Buffer.from(s3_object.Body).toString());
  const headers = {
    'Content-Type': `multipart/form-data; boundary=${form_data._boundary}`,
    Authorization: `Bearer ${slack_bot_oauth_token}`,
  };

  return promisePost('https://slack.com/api/files.upload', form_data, headers)
    .then(function(postResponse: any) {
      return postResponse.data;
    })
    .catch(function(err: any) {
      console.log(err);
      return err;
    });
}
