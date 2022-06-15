const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../../', `.env.${process.env.NODE_ENV === 'test' ? 'test' : 'dev'}`);

dotenv.config({ path: envPath });

class Config {
  default = {
    aws: {
      s3: {},
    },
  };

  get config() {
    return {
      aws: {
        s3: {
          access_key_id: process.env.AMAUI_AWS_S3_ACCESS_KEY_ID || this.default.aws.s3.access_key_id,
          secret_access_key: process.env.AMAUI_AWS_S3_SECRET_ACCESS_KEY || this.default.aws.s3.secret_access_key,
          bucket_name: process.env.AMAUI_AWS_S3_BUCKET_NAME || this.default.aws.s3.bucket_name,
          endpoint: process.env.AMAUI_AWS_S3_ENDPOINT || this.default.aws.s3.endpoint,
          region: process.env.AMAUI_AWS_S3_REGION || this.default.aws.s3.region,
        },
      },
    };
  }
}

module.exports = new Config();
