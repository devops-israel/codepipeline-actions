import { BaseS3Object } from '../../shared/src/model';

export async function removeLatestVersion(bucketname: string, filename: string) {
    return new BaseS3Object(bucketname, filename, null, filename).deleteObjectLatestVersion();
}

export { SnsEvent } from '../../shared/src/interfaces';
