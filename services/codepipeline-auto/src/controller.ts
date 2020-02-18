const CodePipeline = require('aws-sdk/clients/codepipeline');
const codepipeline = new CodePipeline({ apiVersion: '2015-07-09' });
import { BaseS3Object } from '../../shared/src/model';
import { SnsEvent } from '../../shared/src/interfaces';
import { invoke_lambda } from '../../codepipeline-shared/src/controller';
import { approvalCondition } from './condition';
import { ApprovalParams } from './interface';
const rejected_bucket_name: string = process.env.REJECTED_BUCKET_NAME;
const filename_to_remove: string = process.env.REJECTED_FILENAME;
const lambda_function_name: string = process.env.CODEPIPELINE_AUTO_INVOKE_LAMBDA_FUNCTION_NAME;
// const codepipeline_auto_approve: string = process.env.CODEPIPELINE_AUTO_APPROVE;

async function removeLatestVersion(bucketname: string, filename: string) {
  return new BaseS3Object(bucketname, filename, null, filename).deleteObjectLatestVersion();
}

export async function processApproval(event: SnsEvent) {
  let params: ApprovalParams = await approvalCondition(event);
  // if (typeof codepipeline_auto_approve === 'string') {
  //   params.result.status === 'Approved';
  // }
  const promise = new Promise(function(resolve, reject) {
    return codepipeline.putApprovalResult(params, async function(err: any, data: any) {
      if (err) {
        reject(err);
      } else {
        if (
          params.result.status === 'Rejected' &&
          typeof filename_to_remove == 'string' &&
          filename_to_remove.length > 0
        ) {
          await removeLatestVersion(rejected_bucket_name, filename_to_remove);
        }
        if (params.result.status === 'Rejected' && typeof lambda_function_name === 'string') {
          // Upload file to Slack channel if failed
          const invoked_lambda_response = await invoke_lambda(lambda_function_name, 'my payload');
          console.log(`Invoked lambda response: ${JSON.stringify(invoked_lambda_response)}`);
        }
        resolve(data);
      }
    });
  });
  return promise
    .then(function(result) {
      return result;
    })
    .catch(function(err) {
      return err;
    });
}

export { SnsEvent } from '../../shared/src/interfaces';
