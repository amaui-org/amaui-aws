import aws from 'aws-sdk';
import express from 'express';

import is from '@amaui/utils/is';
import merge from '@amaui/utils/merge';
import parse from '@amaui/utils/parse';
import stringify from '@amaui/utils/stringify';
import { AmauiAwsError } from '@amaui/errors';
import AmauiDate from '@amaui/date/amaui-date';
import duration from '@amaui/date/duration';
import AmauiLog from '@amaui/log';

export interface IOptionsAccessCredentials {
  accessKeyId: string;
  secretAccessKey: string;
};

export interface IOptionsAccess {
  endpoint: string;
  credentials: IOptionsAccessCredentials;

  [p: string]: any;
}

export interface IOptionsConfig {
  region?: string;
  apiVersion?: string;
  signatureVersion?: string;
  s3ForcePathStyle?: boolean;

  [p: string]: any;
}

export interface IOptionsAdd {
  bucket_name?: string
}

export interface IOptionsGet {
  bucket_name?: string;
  type: 'buffer' | 'json' | 'text';
  pure?: boolean;
}

export interface IOptionsRemove {
  bucket_name?: string;
  pure?: boolean;
}

export interface IOptionsRemoveMany {
  bucket_name?: string;
  pure?: boolean;
}

export interface IOptionsS3 {
  access: IOptionsAccess;
  bucket_name?: string;
}

export interface IOptions {
  s3: IOptionsS3;
  config?: IOptionsConfig;
}

export interface IConnections {
  s3?: aws.S3;
}

const optionsDefault = {
  config: {
    apiVersion: '2006-03-01',
    signatureVersion: 'v4',
    s3ForcePathStyle: true
  }
};

export class AmauiAws {
  private options: IOptions;
  private connections_: IConnections = {};
  private amalog: AmauiLog;

  public get connections(): IConnections {
    if (!this.connections_.s3) this.connections_.s3 = new aws.S3(this.options.s3.access);

    return this.connections_;
  }

  public constructor(options: IOptions) {
    this.options = merge(options, optionsDefault);

    // Set AWS global config
    this.setup();

    // Get initial connection
    this.connections;

    this.amalog = new AmauiLog({
      arguments: {
        pre: ['AWS', 'S3'],
      },
    });
  }

  public get s3() {
    const thisClass = this;

    return {
      async add(id: string, value_: any, options: IOptionsAdd = {}): Promise<aws.S3.PutObjectOutput> {
        const connection = thisClass.connections.s3;
        const start = AmauiDate.utc.milliseconds;

        const bucket_name = options.bucket_name || thisClass.options.s3.bucket_name;

        let value = value_;

        if (!(is('string', value) || is('buffer', value))) value = stringify(value);

        try {
          const response = await connection.putObject({
            Key: String(id),
            Body: Buffer.from(value, 'binary'),
            Bucket: bucket_name,
          }).promise();

          return thisClass.response(start, bucket_name, 'add', response);
        }
        catch (error) {
          thisClass.response(start, bucket_name, 'add');

          throw new AmauiAwsError(error);
        }
      },

      async get(id: string, options: IOptionsGet = { type: 'buffer' }): Promise<aws.S3.GetObjectOutput | Buffer | string | object> {
        const connection = thisClass.connections.s3;
        const start = AmauiDate.utc.milliseconds;

        const { type, pure } = options;
        const bucket_name = options.bucket_name || thisClass.options.s3.bucket_name;

        try {
          const response = await connection.getObject({
            Key: String(id),
            Bucket: bucket_name,
          }).promise();

          let value = response.Body;

          if (value !== undefined) {
            if (['json', 'text'].indexOf(type) > -1) value = value.toString('utf-8');

            if (['json'].indexOf(type) > -1) value = parse(value);
          }

          return thisClass.response(start, bucket_name, 'get', pure ? response : value);
        }
        catch (error) {
          if (['NoSuchKey'].indexOf(error.code) > -1) return thisClass.response(start, bucket_name, 'get');

          thisClass.response(start, bucket_name, 'get');

          throw new AmauiAwsError(error);
        }
      },

      async remove(id: string, options: IOptionsRemove = {}): Promise<aws.S3.DeleteObjectOutput | boolean> {
        const connection = thisClass.connections.s3;
        const start = AmauiDate.utc.milliseconds;

        const { pure } = options;
        const bucket_name = options.bucket_name || thisClass.options.s3.bucket_name;

        try {
          const response = await connection.deleteObject({
            Key: String(id),
            Bucket: bucket_name,
          }).promise();

          const value = response.DeleteMarker;

          return thisClass.response(start, bucket_name, 'remove', pure ? response : value);
        }
        catch (error) {
          if (['NoSuchKey'].indexOf(error.code) > -1) return thisClass.response(start, bucket_name, 'remove');

          thisClass.response(start, bucket_name, 'remove');

          throw new AmauiAwsError(error);
        }
      },

      async removeMany(ids: string[], options: IOptionsRemoveMany = {}): Promise<Array<aws.S3.DeleteObjectOutput | boolean | Error>> {
        const responses = [];
        const start = AmauiDate.utc.milliseconds;

        const bucket_name = options.bucket_name || thisClass.options.s3.bucket_name;

        for (const id of ids) {
          try {
            const response = await thisClass.s3.remove(id, options);

            responses.push(response);
          }
          catch (error) {
            responses.push(error);
          }
        }

        return thisClass.response(start, bucket_name, 'removeMany', responses);
      }
    };
  }

  private setup() {
    aws.config.update(this.options.config);
  }

  protected response(
    start: number,
    bucket_name: string,
    method: string,
    value?: any,
    req?: express.Request
  ): any {
    if (is('number', start)) {
      const arguments_ = [];

      if (bucket_name) arguments_.push(`Bucket: ${bucket_name}`);
      if (method) arguments_.push(`Method: ${method}`);
      if ((req as any)?.id) arguments_.push(`Request ID: ${(req as any).id}`);

      arguments_.push(`Duration: ${duration(AmauiDate.utc.milliseconds - start, true)}`);

      this.amalog.debug(...arguments_);
    }

    return value;
  }

}

export default AmauiAws;
