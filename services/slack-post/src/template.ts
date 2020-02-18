const fs = require('fs');
import { getS3Object } from '../../shared/src/controller';
import { promiseGet } from '../../slack-shared/src/controller';
const stage: string = process.env.STAGE;
const slack_post_template_path: string = process.env.SLACK_POST_TEMPLATE_PATH;
const slack_post_channel = process.env.SLACK_POST_CHANNEL;
const slack_post_metadata_bucket_name: any = process.env.SLACK_POST_METADATA_BUCKET_NAME;
const slack_post_metadata_file_name: any = process.env.SLACK_POST_METADATA_FILE_NAME;

async function getGithubDetails(actor_id: string) {
  const github_url = `https://api.github.com/user/${actor_id}`;
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
  };
  return promiseGet(github_url, headers)
    .then(function(details: any) {
      return details.data;
    })
    .catch(function(error) {
      return { name: 'Manual-Invocation', avatar_url: 'https://picsum.photos/536/354', error: error };
    });
}

function setGithubLink(s3object: any) {
  const baseUrl = s3object.Metadata['repo_url'];
  if (s3object.Metadata['webhook_event'].indexOf('PUSH') > -1) {
    return baseUrl + '/commit/' + s3object.Metadata['source_id'];
  } else {
    const source_id = s3object.Metadata['webhook_trigger'].split('/')[1];
    return baseUrl + '/pull/' + source_id;
  }
}

function isCodeBuildEvent(event: any): boolean {
  if (event['source'] && event['source'] === 'aws.codebuild') {
    return true;
  } else {
    return false;
  }
}

function isSnsEvent(event: any): boolean {
  if (event['Records'] && event['Records'][0] && event['Records'][0]['Sns']) {
    return true;
  } else {
    return false;
  }
}

async function getTemplateParameters(event: any) {
  let parameters_array: any[] = [];
  const s3object = await getS3Object(slack_post_metadata_file_name, slack_post_metadata_bucket_name);
  let link_github = setGithubLink(s3object);
  const github_details = await getGithubDetails(s3object.Metadata['webhook_actor']);
  const s3_metadata = [
    { key: 'GitHubName', value: github_details.name },
    { key: 'GitHubAvatar', value: github_details.avatar_url },
    { key: 'QaStatus', value: s3object.Metadata['qa_status'] },
    { key: 'ETag', value: s3object.Metadata['etag'] },
    { key: 'LinkGitHub', value: link_github },
    { key: 'SourceId', value: s3object.Metadata['source_id'] },
    { key: 'VersionId', value: s3object.VersionId },
    { key: 'WebhookActorId', value: s3object.Metadata['webhook_actor'] },
    { key: 'WebhookBaseRef', value: s3object.Metadata['webhook_base_ref'] },
    { key: 'WebhookEvent', value: s3object.Metadata['webhook_event'] },
    { key: 'WebhookHeadRef', value: s3object.Metadata['webhook_head_ref'] },
    { key: 'WebhookTrigger', value: s3object.Metadata['webhook_trigger'] },
  ];
  parameters_array = parameters_array.concat(s3_metadata);
  if (isSnsEvent(event)) {
    const msg = JSON.parse(event['Records'][0]['Sns']['Message']);
    parameters_array = parameters_array.concat([
      { key: 'PipelineName', value: msg.approval.pipelineName },
      { key: 'ActionName', value: msg.approval.actionName },
      { key: 'StageName', value: msg.approval.stageName },
      { key: 'Token', value: msg.approval.token },
      { key: 'ApprovalReviewLink', value: msg.approval.approvalReviewLink },
      { key: 'ApprovalExpirationDate', value: msg.approval.expires },
    ]);
  }

  if (isCodeBuildEvent(event)) {
    const build_status =
      event['detail']['build-status'] === 'SUCCEEDED' ? ':heavy_check_mark: Succeeded' : ':x: Failed';
    parameters_array = parameters_array.concat([
      { key: 'BuildStatus', value: build_status },
      { key: 'CodeBuildProjectName', value: event['detail']['project-name'] },
    ]);
  }

  parameters_array = parameters_array.concat([
    { key: 'Stage', value: stage },
    { key: 'Channel', value: slack_post_channel },
  ]);
  return parameters_array;
}

export async function getTemplate(event: any) {
  let template_json = JSON.stringify(JSON.parse(fs.readFileSync(slack_post_template_path).toString()));
  const template_params = await getTemplateParameters(event);
  template_params.forEach(function(element: any) {
    try {
      var replace = '{' + element.key + '}';
      var re = new RegExp(replace, 'g');
      template_json = template_json.replace(re, '' + element.value);
    } catch (error) {
      // Didn't find key in template .. Do nothing
    }
  });
  return JSON.parse(template_json);
}
