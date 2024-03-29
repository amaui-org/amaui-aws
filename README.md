
</br>
</br>

<p align='center'>
  <a target='_blank' rel='noopener noreferrer' href='#'>
    <img src='utils/images/logo.svg' alt='amaui logo' />
  </a>
</p>

<h1 align='center'>amaui AWS</h1>

<p align='center'>
  AWS
</p>

<br />

<h3 align='center'>
  <sub>MIT license&nbsp;&nbsp;&nbsp;&nbsp;</sub>
  <sub>Production ready&nbsp;&nbsp;&nbsp;&nbsp;</sub>
  <sub>100% test cov&nbsp;&nbsp;&nbsp;&nbsp;</sub>
  <sub>Nodejs</sub>
</h3>

<p align='center'>
    <sub>Very simple code&nbsp;&nbsp;&nbsp;&nbsp;</sub>
    <sub>Modern code&nbsp;&nbsp;&nbsp;&nbsp;</sub>
    <sub>Junior friendly&nbsp;&nbsp;&nbsp;&nbsp;</sub>
    <sub>Typescript&nbsp;&nbsp;&nbsp;&nbsp;</sub>
    <sub>Made with :yellow_heart:</sub>
</p>

<br />

## Getting started

### Add

```sh
yarn add @amaui/aws
```

Add `@aws-sdk/client-s3` peer dependency.

```sh
yarn add @aws-sdk/client-s3
```

### Use

```javascript
  import AmauiAws from '@amaui/aws';

  // Make if you wanna a config file and
  // inside of it add all the process.env related props
  import Config from './config';

  // Make a new aws instance
  const amauiAws = new AmauiAws({
    s3: {
      bucketName: Config.aws.s3.bucketName,

      credentials: {
        accessKeyId: Config.aws.s3.accessKeyId,
        secretAccessKey: Config.aws.s3.secretAccessKey
      },

      endpoint: Config.aws.s3.endpoint,

      region: Config.aws.s3.region
    }
  });

  // Add
  await amauiAws.s3.add('a', 4);

  // Get
  await amauiAws.s3.get('a');

  // 4

  // Remove
  await amauiAws.s3.remove('a');

  await amauiAws.s3.get('a');

  // undefined
```

### Dev

Install

```sh
yarn
```

Test

```sh
yarn test
```

#### One time local setup

Install docker and docker-compose

  - https://docs.docker.com/get-docker
  - https://docs.docker.com/compose/install

Install aws

  - https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html

Make docker containers

```sh
yarn docker
```

### Prod

Build

```sh
yarn build
```
