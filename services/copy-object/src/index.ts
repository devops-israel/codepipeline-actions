import { invokeLambda, InvokeLambdaEvent } from './controller';
exports.handler = async (event: InvokeLambdaEvent, context: any, _callback: any) => {
    const job_id = JSON.stringify(event['CodePipeline.job'].id);
    console.log(`
    Approve: aws codepipeline put-job-success-result --job-id ${job_id}
    Reject:  aws codepipeline put-job-failure-result --job-id ${job_id}`);
    const response = await invokeLambda(event, context);
    return response;
};
