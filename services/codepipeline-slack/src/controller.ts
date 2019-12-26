const Lambda = require('aws-sdk/clients/lambda');
const lambda = new Lambda({ apiVersion: '2015-03-31' });
const querystring = require('querystring');
const CodePipeline = require('aws-sdk/clients/codepipeline');
const codepipeline = new CodePipeline({ apiVersion: '2015-07-09' });
import { ApprovalParams } from './interface';
import { removeLatestVersion } from '../../codepipeline-shared/src/controller';
import { createHmac } from 'crypto';
const lambda_function_name: string = process.env.CODEPIPELINE_INVOKE_LAMBDA_FUNCTION_NAME;
const slack_signing_secret = process.env.SLACK_SIGNING_SECRET;
const rejected_bucket_name: any = process.env.REJECTED_BUCKET_NAME;
const rejected_file_name: any = process.env.REJECTED_FILE_NAME;

var payload: any;

function setPayload(event: any) {
  try {
    payload = JSON.parse(querystring.parse(event['body']).payload);
  } catch (err) {
    throw new Error(err + ' Could not parse payload body');
  }
}

export function getPayload() {
  return payload;
}

function getResponseObject(status: string, message: any) {
  if (status === 'success') {
    return {
      statusCode: 200,
      body: JSON.stringify(message),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
    };
  } else {
    return {
      statusCode: 404,
      body: JSON.stringify(message),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
    };
  }
}

async function invoke_lambda(function_name: any, payload: any) {
  return new Promise(function(resolve, reject) {
    var params = {
      FunctionName: function_name,
      Payload: JSON.stringify(payload),
      InvocationType: 'Event', // async
    };
    console.log(`Invoking Lambda Function: ${lambda_function_name}`);
    lambda.invoke(params, function(err: any, data: any) {
      if (err) {
        console.log(err, err.stack);
        reject(err);
      } else {
        console.log(data);
        resolve(data);
      }
    });
  });
}

function isVerified(event: any) {
  const timestamp: number = parseInt(event.multiValueHeaders['X-Slack-Request-Timestamp'][0]);
  const slack_signature: string = event.multiValueHeaders['X-Slack-Signature'][0];
  const sig_version: string = slack_signature.split('=')[0];
  // if (Math.abs(Date.now() - timestamp) > 300) {
  //   // The request timestamp is more than five minutes from local time.
  //   // It could be a replay attack, so let's ignore it.
  //   return;
  // }
  const sig_basestring: string = `${sig_version}:${timestamp}:${event.body}`;
  const my_hash: string = createHmac('sha256', slack_signing_secret)
    .update(sig_basestring)
    .digest('hex');
  const my_signature: string = `${sig_version}=${my_hash}`;
  console.log(`my_signature    = ${my_signature}`);
  console.log(`slack_signature = ${slack_signature}`);
  if (slack_signature === my_signature) {
    return true;
  } else {
    return false;
  }
}

export function getParams(event: any) {
  const payload = getPayload();
  const values = JSON.parse(payload.actions[0]['value']);
  if (isVerified) {
    // if (payload.token === slack_verification_token) {
    const result_status = values.action;
    const result_summary = `Slack ${result_status}`;
    return {
      actionName: values.actionName,
      pipelineName: values.pipelineName,
      result: {
        summary: result_summary,
        status: result_status,
      },
      stageName: values.stageName,
      token: values.token,
    };
  } else {
    throw new Error('Invalid Signature Token');
  }
}

export async function processApproval(event: any) {
  // console.log(JSON.stringify(event));
  if (event['path'].indexOf('/codepipeline/') === -1) {
    return 'Not Slack SNS Payload';
  }
  if (!isVerified(event)) {
    return 'Request is from unknown source';
  }
  // console.log(JSON.stringify(event));
  setPayload(event);
  const params: ApprovalParams = getParams(event);
  const codepipeline_response: any = await new Promise(function(resolve, reject) {
    return codepipeline.putApprovalResult(params, async function(err: any, data: any) {
      if (err) {
        reject(err);
      } else {
        // If rejected, remove latest version
        if (
          params.result.status === 'Rejected' &&
          typeof rejected_file_name == 'string' &&
          rejected_file_name.length > 0
        ) {
          await removeLatestVersion(rejected_bucket_name, rejected_file_name);
        }
        resolve(data);
      }
    });
  })
    .then(function(result) {
      return result;
    })
    .catch(function(err) {
      return err;
    });

  console.log(`Codepipeline response: ${JSON.stringify(codepipeline_response)}`);
  const invoked_lambda_response = await invoke_lambda(lambda_function_name, getPayload());
  console.log(`Invoked lambda response: ${JSON.stringify(invoked_lambda_response)}`);

  if (codepipeline_response['approvedAt']) {
    return getResponseObject('success', getPayload());
  } else if (codepipeline_response['message']) {
    return getResponseObject('failed', codepipeline_response.message);
  } else {
    return getResponseObject('failed', getPayload());
  }
}

export { SnsEvent } from '../../shared/src/interfaces';
