import { BaseS3Object } from '../../shared/src/model';
var output_bucket_name = process.env.OUTPUT_BUCKET_NAME;
var output_filename = process.env.OUTPUT_FILENAME;

export async function copyObject(event: any) {
    const inputArtifact = event['CodePipeline.job'].data.inputArtifacts[0];
    const input_bucketName = inputArtifact.location.s3Location.bucketName;
    const input_filename = inputArtifact.location.s3Location.objectKey;
    const s3_object = new BaseS3Object(output_bucket_name, output_filename);
    s3_object.CopySource = input_bucketName + '/' + input_filename;
    const promise = new Promise(function(resolve, reject) {
        try {
            resolve(s3_object.copyObject());
        } catch (err) {
            reject(err);
        }
    });
    return promise;
}
