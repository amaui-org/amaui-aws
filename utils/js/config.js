const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../../', `.env.${process.env.NODE_ENV === 'test' ? 'test' : 'dev'}`);

dotenv.config({ path: envPath });

class Config {
  default = {
    aws: {
      s3: {

      }
    }
  };

  get config() {
    return {
      aws: {
        s3: {
          accessKeyId: process.env.SERVICE_AWS_S3_ACCESS_KEY_ID || this.default.aws.s3.accessKeyId,
          secretAccessKey: process.env.SERVICE_AWS_S3_SECRET_ACCESS_KEY || this.default.aws.s3.secretAccessKey,
          bucketName: process.env.SERVICE_AWS_S3_BUCKET_NAME || this.default.aws.s3.bucketName,
          endpoint: process.env.SERVICE_AWS_S3_ENDPOINT || this.default.aws.s3.endpoint,
          region: process.env.SERVICE_AWS_S3_REGION || this.default.aws.s3.region
        }
      },
    };
  }
}

module.exports = new Config();
