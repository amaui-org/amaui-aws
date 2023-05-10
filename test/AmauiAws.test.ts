/* tslint:disable: no-shadowed-variable */
import aws from 'aws-sdk';

import { assert } from '@amaui/test';

import * as AmauiUtils from '@amaui/utils';
import AmauiLog from '@amaui/log';

import AmauiAws from '../src';

import Config from '../utils/js/config';

const options = {
  access: {
    endpoint: Config.config.aws.s3.endpoint,
    credentials: {
      accessKeyId: Config.config.aws.s3.access_key_id,
      secretAccessKey: Config.config.aws.s3.secret_access_key,
    },
  },

  config: {
    region: Config.config.aws.s3.region,
  },

  bucket_name: Config.config.aws.s3.bucket_name,
};

group('@amaui/aws', () => {

  group('AmaAWSS3', () => {
    let awsS3: AmauiAws;
    const addedItems = [];

    pre(() => {
      awsS3 = new AmauiAws(options);

      AmauiLog.options.log.enabled = false;
    });

    post(async () => {
      await awsS3.removeMany(addedItems.map(item => item.id));

      AmauiLog.options.log.enabled = true;
    });

    to('connection', () => {
      assert((awsS3.connection as any)._clientId).eq(1);
    });

    group('add', () => {

      to('text', async () => {
        const response = await awsS3.add('1', 'a');

        assert(response.ETag).exist;

        (response as any).id = '1';

        addedItems.push(response);
      });

      to('object', async () => {
        const response = await awsS3.add('2', { a: 'a4' });

        assert(response.ETag).exist;

        (response as any).id = '2';

        addedItems.push(response);
      });

      to('buffer', async () => {
        const response = await awsS3.add('3', Buffer.from('a'));

        assert(response.ETag).exist;

        (response as any).id = '3';

        addedItems.push(response);
      });

    });

    group('get', () => {

      group('options', () => {

        to('pure', async () => {
          const response = await awsS3.get('1', { type: 'text', pure: true }) as aws.S3.GetObjectOutput;
          const response1 = await awsS3.get('1', { type: 'text', pure: false }) as aws.S3.GetObjectOutput;

          assert(response.AcceptRanges).eq('bytes');
          assert(AmauiUtils.is('buffer', response.Body)).eq(true);

          assert(response1).eq('a');
        });

      });

      to('text', async () => {
        const response = await awsS3.get('1', { type: 'text' });

        assert(response).eq('a');
      });

      to('object', async () => {
        const response = await awsS3.get('2', { type: 'json' });

        assert(response).eql({ a: 'a4' });
      });

      to('buffer', async () => {
        const response = await awsS3.get('3');

        assert(response.toString('utf-8')).eq('a');
      });

      to('Not found', async () => {
        const response = await awsS3.get('4');

        assert(response).eq(undefined);
      });

    });

    group('remove', async () => {

      group('options', () => {

        to('pure', async () => {
          const response = await awsS3.remove('1', { pure: true }) as aws.S3.DeleteObjectOutput;
          const response1 = await awsS3.remove('2', { pure: false }) as aws.S3.DeleteObjectOutput;

          assert(response).eql({});
          assert(await awsS3.get('1')).eq(undefined);

          addedItems.splice(0, 2);

          assert(response1).eq(undefined);
        });

      });

      to('remove', async () => {
        await awsS3.remove('3') as aws.S3.DeleteObjectOutput;

        assert(await awsS3.get('3')).eq(undefined);

        addedItems.splice(0, 1);
      });

      to('Not found', async () => {
        await awsS3.remove('4') as aws.S3.DeleteObjectOutput;
      });

    });

    group('removeMany', async () => {

      preTo(async () => {
        await awsS3.add('11', 'a');
        await awsS3.add('12', 'a');
        await awsS3.add('13', 'a');
        await awsS3.add('14', 'a');
      });

      group('options', () => {

        to('pure', async () => {
          const response = await awsS3.removeMany(['11', '12'], { pure: true }) as Array<aws.S3.DeleteObjectOutput>;
          const response1 = await awsS3.removeMany(['13', '14'], { pure: false }) as Array<aws.S3.DeleteObjectOutput>;

          assert(response).eql(new Array(2).fill({}));
          assert(await awsS3.get('11')).eq(undefined);
          assert(await awsS3.get('12')).eq(undefined);

          assert(response1).eql(new Array(2).fill(undefined));
        });

      });

      to('removeMany', async () => {
        await awsS3.removeMany(['11', '12']) as Array<aws.S3.DeleteObjectOutput>;

        assert(await awsS3.get('11')).eq(undefined);
        assert(await awsS3.get('12')).eq(undefined);
      });

    });

  });

});
