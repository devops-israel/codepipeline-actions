export interface SerializedParams {
  Key: string;
  Bucket: string;
  Body: Buffer;
  Expires: Date;
  ACL: string;
  ContentType: string;
  CacheControl: string;
  Prefix: string;
}

export interface IKeyedCollection<T> {
  Add(key: string, value: T): any;
  ContainsKey(key: string): boolean;
  Count(): number;
  Item(key: string): T;
  Keys(): string[];
  Remove(key: string): T;
  Values(): T[];
}

export class KeyedCollection<T> implements IKeyedCollection<T> {
  public items: { [index: string]: T } = {};

  private count: number = 0;

  public ContainsKey(key: string): boolean {
    return this.items.hasOwnProperty(key);
  }

  public Count(): number {
    return this.count;
  }

  public Add(key: string, value: T) {
    if (!this.items.hasOwnProperty(key)) this.count++;

    this.items[key] = value;
  }

  public Remove(key: string): T {
    var val = this.items[key];
    delete this.items[key];
    this.count--;
    return val;
  }

  public Item(key: string): T {
    return this.items[key];
  }

  public Keys(): string[] {
    var keySet: string[] = [];

    for (var prop in this.items) {
      if (this.items.hasOwnProperty(prop)) {
        keySet.push(prop);
      }
    }

    return keySet;
  }

  public Values(): T[] {
    var values: T[] = [];

    for (var prop in this.items) {
      if (this.items.hasOwnProperty(prop)) {
        values.push(this.items[prop]);
      }
    }

    return values;
  }
}

interface Detail {
  // CodeBuild
  'project-name'?: string;
  'build-status'?: string;

  // CodePipeline
  pipeline?: string;
  state?: string;
  'execution-id'?: string;
  version?: number;
}

export interface LambdaEvent {
  detail: Detail;
  version?: string;
  id?: string;
  'build-id'?: string;
  'detail-type'?: string;
  source?: string;
  account?: string;
  time?: string;
  region?: string;
  resources?: object;
}

interface SnsDetails {
  Type: string;
  MessageId: string;
  TopicArn: string;
  Subject: string;
  Message: string;
  Timestamp: string;
  SignatureVersion: string;
  Signature: string;
  SigningCertUrl: string;
  UnsubscribeUrl: string;
  MessageAttributes: object;
}

interface SnsEventRecords {
  EventSource: string;
  EventVersion: string;
  EventSubscriptionArn: string;
  Sns: SnsDetails;
}

export interface SnsEvent {
  Records: SnsEventRecords[];
}

export interface InvokeLambdaEvent {
  'CodePipeline.job': {
    id: string;
    accountId: string;
    data: {
      actionConfiguration: {
        configuration: {
          FunctionName: string;
          UserParameters: string;
        };
      };
      inputArtifacts?: [
        {
          location: {
            s3Location: {
              bucketName: string;
              objectKey: string;
            };
          };
          revision: null;
          name: string;
        },
      ];
      outputArtifacts?: [];
      artifactCredentials: {
        secretAccessKey: string;
        sessionToken: string;
        accessKeyId: string;
      };
      continuationToken: string;
      encryptionKey: {
        id: string;
        type: string;
      };
    };
  };
}
