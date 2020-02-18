# codepipeline-actions

Improve the use of CodePipeline by adding the following features:

1. Approve Manual Approval step via Slack
1. Automatically approve/reject Manual Approval step according to QA results
1. Copy files according to condition, for example: passed auto-qa tests

**Note**: to shorten the resources' names, you'll sometimes see `cpa` instead of `codepipeline-actions`

![Approve-Example](./assets/cpa-approve-example.png 'Approve Example')

<details><summary>
More Examples
</summary>

![Build-Succeeded-Example](./assets/cpa-approve-example.png 'Build Succeeded Example')

![Approved-Example](./assets/cpa-approved-example.png 'Approved Example')

</details>

## Quick-start

### Deploy

[![Launch in Virginia](https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png) Virginia us-east-1](https://us-east-1.console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/quickcreate?templateURL=https://codepipeline-actions.s3-eu-west-1.amazonaws.com/cpa-cf-template.yml)

[![Launch in Ireland](https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png) Ireland eu-west-1](https://eu-west-1.console.aws.amazon.com/cloudformation/home?region=eu-west-1#/stacks/quickcreate?templateURL=https://codepipeline-actions.s3-eu-west-1.amazonaws.com/cpa-cf-template.yml)

[![Launch in Hong Kong](https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png) Hong Kong ap-east-1](https://eu-west-1.console.aws.amazon.com/cloudformation/home?region=eu-west-1#/stacks/quickcreate?templateURL=https://codepipeline-actions.s3-eu-west-1.amazonaws.com/cpa-cf-template.yml)

[![Launch in Canada](https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png) Canada ca-central-1](https://eu-west-1.console.aws.amazon.com/cloudformation/home?region=eu-west-1#/stacks/quickcreate?templateURL=https://codepipeline-actions.s3-eu-west-1.amazonaws.com/cpa-cf-template.yml)

<details><summary>
More regions
</summary>

To deploy in other regions, replace AWS_REGION with the region's code

```
https://AWS_REGION.console.aws.amazon.com/cloudformation/home?region=AWS_REGION#/stacks/quickcreate?templateURL=https://
codepipeline-actions.s3-eu-west-1.amazonaws.com/cpa-cf-template.yml
```

</details>

### Configure

#### CodeBuild

You need to create a metadata file which holds all of the information from GitHub.

- Example for creating a specific metadata.nfo file - [cpa-cf-codebuild-metadata.yml](./aws_resources/cpa-cf-codebuild-metadata.yml)
- Example for creating a adding metadata info to your build ZIP file - [cpa-cf-codebuild.yml](./aws_resources/cpa-cf-codebuild.yml)

1. Make sure your CodeBuild has permissions to copy files to the Metadata bucket
1. Add this to `build` or `install` phase in your `buildspec.yml`
   ```yml
   phases:
     ... # other phases
     install:
       runtime-versions:
         ... # your runtime
       commands:
         ... # other commands
         - echo ">> Creating ${METADATA_FILE_NAME} locally"
         - echo "my qa results" > ${METADATA_FILE_NAME}
   ```
1. Add this to `post_build` phase inr your `buildspec.yml`
   ```yml
   phases:
      ... # other phases
      post_build:
         commands:
            ... # other commands
            - echo ">> Copying ${METADATA_FILE_NAME} to the bucket ${METADATA_BUCKET_NAME}"
            - aws s3 cp ${METADATA_FILE_NAME} s3://${METADATA_BUCKET_NAME}/${METADATA_FILE_NAME} --metadata qa_status=success,source_id=${CODEBUILD_RESOLVED_SOURCE_VERSION},webhook_base_ref=${CODEBUILD_WEBHOOK_BASE_REF},webhook_head_ref=${CODEBUILD_WEBHOOK_HEAD_REF},webhook_event=${CODEBUILD_WEBHOOK_EVENT},webhook_actor=${CODEBUILD_WEBHOOK_ACTOR_ACCOUNT_ID},webhook_trigger=${CODEBUILD_WEBHOOK_TRIGGER},repo_url=${CODEBUILD_SOURCE_REPO_URL}
   ```

_TODO_: Add instructions on how to do it via AWS Console

#### CodePipeline

Add relevant topics in your CodePipeline, full example - [cpa-cf-codepipeline.yml](./aws_resources/cpa-cf-codepipeline.yml)

```yml
   Stages:
   ... # other stages
      - Name: Release
         Actions:
         - Name: ManualReleaseApproval
            ActionTypeId:
               Category: Approval
               Owner: AWS
               Provider: Manual
               Version: "1"
            Configuration:
               # This is where use the SNS Topic
               NotificationArn: !Sub "arn:aws:sns:${AWS::Region}:${AWS::AccountId}:${AppName}-cpa-Release-${Stage}"
               CustomData: !Sub "${Stage}"
            RunOrder: 1
```

_TODO_: Add instructions on how to do it via AWS Console

<details><summary>
<b>Contributing</b>
</summary>

### Prerequisites

1. AWS user with Administrator privileges
1. [aws cli](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html)
1. [yarn](https://yarnpkg.com/lang/en/docs/install/)
1. [bash](https://www.gnu.org/software/bash/)
1. [Docker](https://docs.docker.com/install/)
1. [Docker Compose](https://docs.docker.com/compose/install/)
1. Integrate CodeBuild with your GitHub account
   - Create CodeBuild project
   - Source Provider: GitHub, Repository in my GitHub account and click Connect
   - Discard the CodeBuild project
1. [aws-vault](https://github.com/99designs/aws-vault) (Optional, but recommended)

_TODO_: Create a Docker image of prerequisites

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

</details>

<details><summary>
<b>Troubleshooting</b>
</summary>

### Not getting Approval messages in Slack

If you updated the SNS-Topic, then the link to it in CodePipeline might be broken.
Re-deploy CodePipeline with a different SNS-Topic, and then re-deploy CodePipeline with the corrent SNS-Topic.

### Forgot to update `.env` with Slack secrets

No worries, update the `.env` file and then run:

```
bash-5.0#  yarn deploy:cpa
```

This will re-deploy the Lambda Functions (services) with the updated secrets.

</details>
