import { BaseS3Object } from '../../shared/src/model';

var condition_bucket_name = process.env.CONDITION_BUCKET_NAME;
var condition_filename = process.env.CONDITION_FILENAME;
var condition_metadata_property = process.env.CONDITION_METADATA_PROPERTY;
var condition_metadata_success = process.env.CONDITION_METADATA_SUCCESS;

export async function approvalCondition(event: any) {
    const msg = JSON.parse(event['Records'][0]['Sns']['Message']);
    const s3_object = await new BaseS3Object(
        condition_bucket_name,
        condition_filename,
        null,
        condition_filename,
    ).getObject();
    const result_status =
        s3_object['Metadata'][condition_metadata_property] == condition_metadata_success ? 'Approved' : 'Rejected';
    const result_summary = `AutoQa ${result_status}`;
    return {
        actionName: msg.approval.actionName,
        pipelineName: msg.approval.pipelineName,
        result: {
            summary: result_summary,
            status: result_status,
        },
        stageName: msg.approval.stageName,
        token: msg.approval.token,
    };
}
