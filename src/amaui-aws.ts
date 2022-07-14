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

interface IOptions {
  access: {
    endpoint: string;
    credentials: {
      accessKeyId: string;
      secretAccessKey: string;
    };

    [p: string]: any;
  };

  config?: {
    region?: string;
    apiVersion?: string;
    signatureVersion?: string;
    s3ForcePathStyle?: boolean;

    [p: string]: any;
  };

  bucket_name?: string;
}

const optionsDefault = {
  config: {
    apiVersion: '2006-03-01',
    signatureVersion: 'v4',
    s3ForcePathStyle: true,
  },
};

export class AmauiAws {
  private connection_: aws.S3;
  private options: IOptions;
  private amalog: AmauiLog;

  public get connection(): aws.S3 {
    if (!this.connection_) this.connection_ = new aws.S3(this.options.access);

    return this.connection_;
  }

  public constructor(options: IOptions) {
    this.options = merge(options, optionsDefault);

    // Set AWS global config
    this.setup();

    // Get initial connection
    this.connection;

    this.amalog = new AmauiLog({
      arguments: {
        pre: ['AWS', 'S3'],
      },
    });
  }

  public async add(id: string, value_: any, options: { bucket_name?: string } = {}): Promise<aws.S3.PutObjectOutput> {
    const connection = this.connection;
    const start = AmauiDate.utc.milliseconds;

    const bucket_name = options.bucket_name || this.options.bucket_name;

    let value = value_;

    if (!(is('string', value) || is('buffer', value))) value = stringify(value);

    try {
      const response = await connection.putObject({
        Key: String(id),
        Body: Buffer.from(value, 'binary'),
        Bucket: bucket_name,
      }).promise();

      return this.response(start, bucket_name, 'add', response);
    }
    catch (error) {
      this.response(start, bucket_name, 'add');

      throw new AmauiAwsError(error);
    }
  }

  public async get(id: string, options: { bucket_name?: string; type: 'buffer' | 'json' | 'text'; pure?: boolean; } = { type: 'buffer' }): Promise<aws.S3.GetObjectOutput | Buffer | string | object> {
    const connection = this.connection;
    const start = AmauiDate.utc.milliseconds;

    const { type, pure } = options;
    const bucket_name = options.bucket_name || this.options.bucket_name;

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

      return this.response(start, bucket_name, 'get', pure ? response : value);
    }
    catch (error) {
      if (['NoSuchKey'].indexOf(error.code) > -1) return this.response(start, bucket_name, 'get');

      this.response(start, bucket_name, 'get');

      throw new AmauiAwsError(error);
    }
  }

  public async remove(id: string, options: { bucket_name?: string; pure?: boolean; } = {}): Promise<aws.S3.DeleteObjectOutput | boolean> {
    const connection = this.connection;
    const start = AmauiDate.utc.milliseconds;

    const { pure } = options;
    const bucket_name = options.bucket_name || this.options.bucket_name;

    try {
      const response = await connection.deleteObject({
        Key: String(id),
        Bucket: bucket_name,
      }).promise();

      const value = response.DeleteMarker;

      return this.response(start, bucket_name, 'remove', pure ? response : value);
    }
    catch (error) {
      if (['NoSuchKey'].indexOf(error.code) > -1) return this.response(start, bucket_name, 'remove');

      this.response(start, bucket_name, 'remove');

      throw new AmauiAwsError(error);
    }
  }

  public async removeMany(ids: string[], options: { bucket_name?: string; pure?: boolean; } = {}): Promise<Array<aws.S3.DeleteObjectOutput | boolean | Error>> {
    const responses = [];
    const start = AmauiDate.utc.milliseconds;

    const bucket_name = options.bucket_name || this.options.bucket_name;

    for (const id of ids) {
      try {
        const response = await this.remove(id, options);

        responses.push(response);
      }
      catch (error) {
        responses.push(error);
      }
    }

    return this.response(start, bucket_name, 'removeMany', responses);
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
