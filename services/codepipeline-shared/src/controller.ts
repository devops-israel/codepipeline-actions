const Lambda = require('aws-sdk/clients/lambda');
const lambda = new Lambda({ apiVersion: '2015-03-31' });
import { BaseS3Object } from '../../shared/src/model';

export async function removeLatestVersion(bucketname: string, filename: string) {
  return new BaseS3Object(bucketname, filename, null, filename).deleteObjectLatestVersion();
}

export { SnsEvent } from '../../shared/src/interfaces';

export async function invoke_lambda(function_name: any, payload: any) {
  return new Promise(function(resolve, reject) {
    var params = {
      FunctionName: function_name,
      Payload: JSON.stringify(payload),
      InvocationType: 'Event', // async
    };
    console.log(`Invoking Lambda Function: ${function_name}`);
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
