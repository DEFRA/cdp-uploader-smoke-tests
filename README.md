# cdp-uploader-smoke-tests

Run smoke tests against the `CDP Uploader`.

- [Requirements](#requirements)
  - [Node.js](#nodejs)
- [Local](#local)
  - [Setup](#setup)
  - [Local config](#local-config)
  - [Running tests](#running-tests)
  - [Generate report](#report)
- [Production](#environment-production)
  - [Environment config](#config)
- [Requirements of CDP Environment Tests](#requirements-of-cdp-environment-tests)
- [Licence](#licence)
  - [About the licence](#about-the-licence)

## Local Development

### Setup

Install application dependencies:

```bash
npm install
```

### Local config

Set local environment variables

```bash
export UPLOADER_BUCKET=my-bucket
export CDP_UPLOADER_BASE_URL=http://localhost:7337
```

_E.g. [direnv.net](https://direnv.net/)_

### Running tests

Start application you are testing on the url specified in a `baseUrl` in `src/config/index.js`

```bash
npm run test
```

### Reports

Generate report

```bash
npm run report
```

View report

```bash
open allure-results/index.html
```

## Production

### Environment Config

As the environment runner is isolated it does not get injected with `cdp-app-config`
so the environment variables are set `~/src/config/index.js`.

`CDP_UPLOADER_BASE_URL` is assumed to be

```
https://cdp-uploader.${process.env.ENVIRONMENT}.cdp-int.defra.cloud
```

Whilst the `UPLOADER_BUCKET` is hardcoded per environment underneath

```
s3UploadBucket.environments: {}
```

### Running the tests

Tests are run from the CDP-Portal under the Test Suites section. Before any changes can be run, a new docker image must be built, this will happen automatically when a pull request is merged into the `main` branch.
You can check the progress of the build under the actions section of this repository. Builds typically take around 1-2 minutes.

The results of the test run are made available in the portal.

## Requirements of CDP Environment Tests

1. Your service builds as a docker container using the `.github/workflows/publish.yml`
   The workflow tags the docker images allowing the CDP Portal to identify how the container should be run on the platform.
   It also ensures its published to the correct docker repository.

2. The Dockerfile's entrypoint script should return exit

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government licence v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable
information providers in the public sector to license the use and re-use of their information under a common open
licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
