# codepipeline-actions

Improve the use of CodePipeline by adding the following features:

1. Approve Manual Approval step via Slack
1. (Under development) Copy files according to condition
1. (Under development) Automatically approve/reject Manual Approval step according to QA results

**Note**: to shorten the resources' names, you'll sometimes see `cpa` instead of `codepipeline-actions`

## Getting Started

### Prerequisites

1. AWS user with Administrator privileges
1. [yarn](https://yarnpkg.com/lang/en/docs/install/)
1. [bash](https://www.gnu.org/software/bash/)
1. [Docker](https://docs.docker.com/install/)
1. [Docker Compose](https://docs.docker.com/compose/install/)
1. Integrate CodeBuild with your GitHub account
   - Create CodeBuild project
   - Source Provider: GitHub, Repository in my GitHub account and click Connect
   - Discard the CodeBuild project

### Installing

`codepipeline-actions:` - means we're in this project's root folder

Clone this repository

```
codepipeline-actions: git git@github.com:devops-internal/codepipeline-actions.git
```

### Usage

#### Run docker-compose container

`codepipeline-actions:` - means we're in this project's root folder
`bash-5.0#` - means we're in the container

```
codepipeline-actions: yarn docker:run
...
bash-5.0:
```

**[aws-vault](https://github.com/99designs/aws-vault) users** - Update `env` file with your `AWS_VAULT_PROFILE` and run `yarn docker:run:aws-vault`

1. Installs dependencies for Lambda Layers and services (Lambda Functions)
1. Creates two S3 buckets and updates `.env` file

#### Slack

1. Create a Slack channel: `codepipeline_notifications`
1. Create a [Slack application](https://api.slack.com/apps)
1. Create a Slack Bot for your Slack application, and add the bot to your channel
1. Update `.env` file with the values
   - `SLACK_SIGNING_SECRET`
   - `SLACK_BOT_OAUTH_TOKEN`

#### Build and deploy

Run inside the running container

```
bash-5.0#  yarn build
...
bash-5.0#  yarn deploy:all
...
>> Go to Slack apps: https://api.slack.com/apps --> Select your app
>> Go to Interactive Components --> Update Request URL with:
>> https://hashedstr.execute-api.eu-west-1.amazonaws.com/prod/codepipeline/release

bash-5.0#
```

1. Builds services (Lambda Functions) and outputs `dist` folder in each service
1. Deploys lambda layers - [axios](https://www.npmjs.com/package/axios)
1. Deploys services - Lambda Functions
1. Deploys CodeBuild
1. Deploys CodePipeline

#### Trigger a build

Create a pull-request, from any branch to `develop` branch, now look at `codepipeline_notifications` channel in Slack

## Troubleshooting

### Forgot to update `.env` with Slack secrets

No worries, update the `.env` file and then run:

```
bash-5.0#  yarn deploy:cpa
```

This will re-deploy the Lambda Functions (services) with the updated secrets.

### Not getting Approval messages in Slack

If you updated the SNS-Topic, then the link to it in CodePipeline might be broken.
Re-deploy CodePipeline with a different SNS-Topic, and then re-deploy CodePipeline with the corrent SNS-Topic.
