import { InvokeLambdaEvent } from '../../shared/src/interfaces';
import { copyObject } from './action';
const CodePipeline = require('aws-sdk/clients/codepipeline');
const codepipeline = new CodePipeline({ apiVersion: '2015-07-09' });

export async function invokeLambda(event: InvokeLambdaEvent, context: any) {
  const promiseSuccess = function(condition: boolean) {
    const promise = new Promise(function(resolve, reject) {
      if (!condition) {
        reject(new Error('Failed to perform action'));
      }
      const params = {
        jobId: event['CodePipeline.job'].id,
      };
      return codepipeline.putJobSuccessResult(params, function(err: any, data: any) {
        if (err) {
          reject(new Error(err));
        } else {
          resolve(data);
        }
      });
    });
    return promise;
  };
  const promiseFailed = function() {
    const promise = new Promise(function(resolve, reject) {
      const params = {
        failureDetails: {
          message: 'Failed to perform action',
          type: 'JobFailed',
        },
        jobId: event['CodePipeline.job'].id,
      };
      return codepipeline.putJobFailureResult(params, function(err: any, data: any) {
        if (err) {
          reject(new Error(err));
        } else {
          resolve(data);
        }
      });
    });
    return promise;
  };
  return copyObject(event)
    .then(function(result: any) {
      console.log(JSON.stringify(result));
      return result.CopyObjectResult ? true : false;
    })
    .then((condition: boolean) => promiseSuccess(condition))
    .catch(promiseFailed);
}

export { InvokeLambdaEvent } from '../../shared/src/interfaces';
