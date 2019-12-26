import { BaseS3Object } from '../services/shared/src/model';
const valid_bucket_name = 'my-app-is-great';
test('valid bucket name', () => {
    let obj = new BaseS3Object(valid_bucket_name, '123');
    expect(() => {
        obj.Bucket !== undefined && typeof obj.Bucket == 'string';
    }).toBeTruthy();
});

test('invalid bucket name - dots', () => {
    const bucketName = 'my..app-is-great';
    expect(() => {
        new BaseS3Object(bucketName, '123');
    }).toThrow();
});

test('invalid bucket name - uppercase', () => {
    const bucketName = 'my.App-is-great';
    expect(() => {
        new BaseS3Object(bucketName, '123');
    }).toThrow();
});
