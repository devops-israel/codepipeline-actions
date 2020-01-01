const S3 = require('aws-sdk/clients/s3');
const s3 = new S3({ apiVersion: '2006-03-01', region: process.env.AWS_REGION });
import { isBucketNameValid } from './controller';
import { KeyedCollection } from './interfaces';

export class BaseS3Object {
  private _Bucket: string;
  private _Key: string;
  private _Body: Buffer;
  private _CopySource: string;
  ETag: any;
  Expires: Date;
  ACL: string;
  ContentType: string;
  CacheControl: string;
  Prefix: string;
  VerisionsId: object[];
  LatestVersionId: any;
  LastModified: Date;
  Metadata: any;

  get Body(): Buffer {
    return this._Body;
  }

  set Body(buffer: Buffer) {
    this._Body = buffer;
  }

  get Bucket(): string {
    return this._Bucket;
  }

  set Bucket(bucketName: string) {
    if (isBucketNameValid(bucketName)) {
      this._Bucket = bucketName;
    } else {
      throw new Error('Invalid bucket name');
    }
  }

  get CopySource(): string {
    return this._CopySource;
  }

  set CopySource(copysource: string) {
    this._CopySource = copysource;
  }

  get Key(): string {
    return this._Key;
  }

  set Key(key: string) {
    this._Key = key;
  }

  constructor(bucketName: string, key: string, body?: Buffer, prefix?: string) {
    this.Bucket = bucketName;
    this.Key = key;
    if (body) {
      this.Body = body;
    }
    if (prefix) {
      this.Prefix = prefix;
    }
  }

  private serialize() {
    let my_obj = this;
    let temp_dict = {
      Key: my_obj.Key ? my_obj.Key : undefined,
      Bucket: my_obj.Bucket ? my_obj.Bucket : undefined,
      Body: my_obj.Body ? my_obj.Body : undefined,
      Expires: my_obj.Expires ? my_obj.Expires : undefined,
      ACL: my_obj.ACL ? my_obj.ACL : undefined,
      ContentType: my_obj.ContentType ? my_obj.CacheControl : undefined,
      CacheControl: my_obj.CacheControl ? my_obj.CacheControl : undefined,
      Prefix: my_obj.Prefix ? my_obj.Prefix : undefined,
      CopySource: my_obj.CopySource ? my_obj.CopySource : undefined,
    };
    let final_dict = new KeyedCollection();
    for (let [key, value] of Object.entries(temp_dict)) {
      if (typeof value !== 'undefined') {
        final_dict.Add(key, value);
      }
    }
    return final_dict.items;
  }

  public async uploadObject() {
    let my_obj = this;
    let params = my_obj.serialize();
    let putObjectPromise = s3.putObject(params).promise();
    return putObjectPromise
      .then(function(data: { ETag: any }) {
        my_obj.ETag = data.ETag;
        return data.ETag;
      })
      .catch(function(err: any) {
        const errorMessage = `Failed to upload file to S3: ${err}`;
        return errorMessage;
      });
  }

  public async copyObject() {
    let my_obj = this;
    const params = my_obj.serialize();
    const promise = new Promise(function(resolve, reject) {
      s3.copyObject(params, function(err: any, data: any) {
        if (err) {
          reject(err.stack);
        } else {
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

  public async getObject() {
    let my_obj = this;
    const params = my_obj.serialize();
    const getObjectPromise = s3
      .getObject({
        Key: params.Key,
        Bucket: params.Bucket,
      })
      .promise();
    return getObjectPromise
      .then(function(data: any) {
        return data; // return S3 Object
      })
      .catch(function(err: any) {
        const errorMessage = `Error: ${JSON.stringify(err)}`;
        console.log(errorMessage);
        return errorMessage;
      });
  }

  private async _promiseListObjectVersion() {
    let my_obj = this;
    const params = my_obj.serialize();
    return new Promise(function(resolve, reject) {
      s3.listObjectVersions(
        {
          Bucket: params.Bucket,
          Prefix: params.Prefix,
        },
        function(err: any, objects_list: any) {
          if (err) {
            // console.log(err, err.stack);
            reject(err);
          } else {
            // console.log(objects_list);
            my_obj.VerisionsId = objects_list;
            resolve(objects_list);
          }
        },
      );
    });
  }

  private async _promiseGetLatestVersionId() {
    let my_obj = this;
    return new Promise(function(resolve, reject) {
      my_obj
        ._promiseListObjectVersion()
        .then(function(objects_list: any) {
          for (let i = 0; i < objects_list['Versions'].length; i++) {
            if (objects_list['Versions'][i]['IsLatest'] == true) {
              my_obj.LatestVersionId = objects_list['Versions'][i]['VersionId'];
              resolve(my_obj.LatestVersionId);
            }
          }
          if ((my_obj.LatestVersionId = '')) {
            reject(new Error('Could find latest version id'));
          }
        })
        .catch(function(err) {
          throw new Error(err);
        });
    });
  }

  public async getLatestVersionId() {
    let my_obj = this;
    const result = await my_obj._promiseGetLatestVersionId().then(function(result) {
      return result;
    });
    my_obj.LatestVersionId = result;
    return result;
  }

  private async _deleteObjectVersion(latest_version_id: any) {
    let my_obj = this;
    console.log(latest_version_id);
    return new Promise(function(resolve, reject) {
      const params = {
        Bucket: my_obj.serialize().Bucket,
        VersionId: latest_version_id,
        Key: my_obj.Key,
      };
      s3.deleteObject(params, function(err: any, data: any) {
        if (err) {
          console.log(err, err.stack); // an error occurred
          reject(err);
        } else {
          console.log(data); // successful response
          resolve(data);
        }
      });
    });
  }

  public async deleteObjectLatestVersion() {
    let my_obj = this;
    return my_obj
      ._promiseGetLatestVersionId()
      .then(function(result) {
        return result;
      })
      .then(latest_version_id => my_obj._deleteObjectVersion(latest_version_id))
      .then(function(result) {
        return result;
      });
  }
}
