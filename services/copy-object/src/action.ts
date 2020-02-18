import { BaseS3Object } from '../../shared/src/model';
var output_bucket_name = process.env.OUTPUT_BUCKET_NAME;
var output_filename = process.env.OUTPUT_FILENAME;
var source_bucket_name = process.env.SOURCE_BUCKET_NAME;
var source_file_name = process.env.SOURCE_FILE_NAME;

export async function copyObject(event: any) {
  let inputArtifact,
    input_bucketName,
    input_filename = '';
  if (
    event['CodePipeline.job'] &&
    event['CodePipeline.job'].data &&
    event['CodePipeline.job'].inputArtifacts &&
    event['CodePipeline.job'].inputArtifacts[0]
  ) {
    inputArtifact = event['CodePipeline.job'].data.inputArtifacts[0];
    input_bucketName = inputArtifact.location.s3Location.bucketName;
    input_filename = inputArtifact.location.s3Location.objectKey;
  } else if (typeof source_bucket_name === 'string' && typeof source_file_name === 'string') {
    input_bucketName = source_bucket_name;
    input_filename = source_file_name;
  } else {
    throw new Error('No input file to copy');
  }

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
