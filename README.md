# Process

Assuming you only have one environment, and it's production, let's use `prod`
Image-from-draw-io

# Structure

## env file

```
AWS_ACCOUNT_NUMBER=YOUR_AWS_ACCOUNT_NUMBER
APP_NAME=my-app
STAGE=prod
```

# Prerequisites

## Slack

1. Create a channel
   - In Slack App, create a channel where the notifications will be posted
   - When prompted to add users to the channel, click Skip for now
   - slack-create-channel.png
2. Create a Slack application
   - Go to [https://api.slack.com/apps](https://api.slack.com/apps) and create an application
   - slack-01-create-slack-app.png
3. Signing Secret
   - Go to Settings > Basic Information > App Credentials
   - Save the Signing Secret somewhere, we'll use it later on
   - slack-03-app-credentials.png
4. Create a Bot
   - Go to Features > Bot Users
   - Click Add Bot User, give it a Display Name and User name
   - slack-05-add-bot-user.png
5. Add OAuth Permissions
   - Go to Features > OAuth & Permissions
   - Scroll down to Scopes and add the following scopes
   - slack-add-oauth-scopes.png
6. Install Application
   - Go to Features > OAuth & Permissions, scroll up and Install App to Workspace
   - Select the notifications channel you've created earlier and click Allow
   - slack-select-channel.png
7. Bot OAuth token
   - Save the Bot User OAuth Access Token, we'll use it later on
   - slack-copy-bot-oauth-token.png
8. Add application to channel
   - In Slack App, go to your channel, click on view members list
   - slack-view-members-list.png
   - Go to Apps, click Add App and search your codepipeline app
   - slack-add-app-menu.png
   - slack-add-app-to-channel.png
   - You should see the following message
   - slack-bot-was-added.png

That's it for Slack, and now we'll store the Signing Secret and Slack Bot OAuth Token in our AWS account.

## Storing Secrets in Systems Manager

In this step, we will securely store our Slack Signing Secret and Slack Bot OAuth Token.
**Important!** Make sure you are in the same region where you intend to deploy the app
**Important!** The names of the secrets must be as mentioned below

### Systems Manager

Perform the next steps are in the AWS Console.

1. Go to Services > Systems Manager > Application Management > Parameter Store > Create parameter
2. Slack Signing Secret (Using it according to [Slack Docs](https://api.slack.com/docs/verifying-requests-from-slack))
   - Name: **/codepipeline-actions/slack_signing_secret**
   - Tier: Standard
   - Type: SecureString
   - KMS key source: My current account (default)
   - Value: THE_SLACK_SIGNING_SECRET_FROM_EARLIER
   - Click Create Parameter
3. Slack Bot OAuth Token
   - Name: **/codepipeline-actions/slack_bot_oauth_token**
   - Tier: Standard
   - Type: SecureString
   - KMS key source: My current account
   - Value: THE_SLACK_BOT_AUTH_TOKEN_FROM_EARLIER
4. Final result
   - aws-sm-final-result.png

### Update `.env` file

Update your .env file with the Channel name, Slack Signing Secret and Slack Bot OAuth Token

```
AWS_ACCOUNT_NUMBER=YOUR_AWS_ACCOUNT_NUMBER
APP_NAME=my-app
STAGE=prod
SLACK_POST_CHANNEL=codepipeline_notifications # <-- updated
SLACK_SIGNING_SECRET=THE_SLACK_SIGNING_SECRET_FROM_EARLIER # <-- updated
SLACK_BOT_OAUTH_TOKEN=THE_SLACK_BOT_AUTH_TOKEN_FROM_EARLIER # <-- updated
```

# CodeBuild

## Using your own CodeBuild

Here we have two options, either use the [examples/codebuild.yml](examples/codebuild.yml) template or modify our template according to this tutorial.
**The main thing that you need to know** - this application is using S3 object metadata, so your CodeBuild project must save the metadata to a file. You can use the scripts that are written [examples/codebuild.yml](examples/codebuild.yml) `> BuildSpec > phases > post_built` to implement this concept.
The variables that start with `CODEBUILD_` are [AWS CodeBuild built-in variables](https://docs.aws.amazon.com/codebuild/latest/userguide/build-env-ref-env-vars.html)
For example:

```
post_build:
	commands:
		- echo ">> Zipping build to candidate.zip"
		- cd build && zip -r candidate.zip .
		- echo ">> Copying candidate.zip to the bucket ${CANDIDATES_BUCKET_NAME}"
		- aws s3 cp candidate.zip s3://${CANDIDATES_BUCKET_NAME}/candidate.zip --metadata source_id=${CODEBUILD_RESOLVED_SOURCE_VERSION},webhook_base_ref=${CODEBUILD_WEBHOOK_BASE_REF},webhook_head_ref=${CODEBUILD_WEBHOOK_HEAD_REF},webhook_event=${CODEBUILD_WEBHOOK_EVENT},webhook_actor=${CODEBUILD_WEBHOOK_ACTOR_ACCOUNT_ID},webhook_trigger=${CODEBUILD_WEBHOOK_TRIGGER},repo_url=${CODEBUILD_SOURCE_REPO_URL}
```

## Using the example's CodeBuild

Assuming you want to start your CI/CD from scratch, let's deploy the example.
And of course, we'll eat-your-own-dog-food and use this repository as the source.
**Important!** Make sure you are in the same region where you intend to deploy the app

### Connect to GitHub

**Important!** Make sure you are in the same region where you intend to deploy the app

Assuming our repository is private, we first need to authenticate with GitHub; to do so, we'll create a bogus project, connect to GitHub and then discard this bogus project.

1. Services > CodeBuild > Create build project
2. Source > Source provider > GitHub > Connect using OAuth > Connect to GitHub > Authorize aws-codesuite > Confirm password
3. Scroll to the bottom, click Cancel and discard this project

### Deploy CodeBuild Example

**Important!** Make sure you are in the same region where you intend to deploy the app
Resources: CodeBuild project, IAM Role for CodeBuild, and a bucket for build candidates.

1. Download the file [examples/codebuild.yml](examples/codebuild.yml) to your machine
2. Services > CloudFormation > Create stack > With new resources (standard)
3. Upload a template file > Choose file > codebuild.yml > Next
4. Specify stack details:
   - Stack name: my-app-CodeBuildCandidate-prod
   - AppName: my-app
   - GithubBranchName: master (or any other branch)
   - GithubOwner: unfor19 (your Github username)
   - GithubRepo: aws-codepipeline-actions (Github repository name)
   - Stage: prod
5. Configure stack options > Next
6. Review my-app-CodeBuildCandidate-prod
   - Scroll to the bottom and tick `I acknowledge that AWS CloudFormation might create IAM resources.`
   - Create stack

It usually takes something like 1 minute to deploy this stack. Final result:
aws-codebuild-final-result.png
We also see here the layers stack that was created earlier.

# AWS-Codepipeline-Actions

Now we can deploy this application!

## Prerequisites

Bash
yarn
Node

1.  [NodeJS 10.x](https://aws.amazon.com/about-aws/whats-new/2019/05/aws_lambda_adds_support_for_node_js_v10/) - AWS Lambda supports this version of NodeJS
2.  [yarn](https://yarnpkg.com/lang/en/) - package manager (instead of npm)
3.  [TypeScript 3.7](https://www.typescriptlang.org/) - targeting ES5
4.  [serverless-framework](https://serverless.com/) - Deploying to AWS - `yarn deploy:vault-dev`
5.  (Optional) [aws-vault](https://github.com/99designs/aws-vault) - securing AWS credentials

## Install dependencies

```
-> aws-codepipeline-actions: yarn installAllDeps
yarn run v1.21.1
$ bash ./scripts/install_services_deps && bash ./scripts/install_layers_deps
...
Done in 82.88s.
```

## Layers

This step is required per environment/stage (dev, staging, prod).
There's no need to repeat it for each deployment.

### Create a bucket for the layers

**Important!** Make sure the bucket's region is the same region where you intend to deploy the app

1. Bucket name: APPNAME-codepipeline-actions-layers-deployment-STAGE
   - For example: my-app-codepipeline-actions-layers-deployment-prod
2. Enable Versioning
   - s3-01-versioning.png
3. Keep the default settings that block public access to the bucket (Next next next ...)

### Update `.env` file

Update your .env file with the bucket's name

```
AWS_ACCOUNT_NUMBER=YOUR_AWS_ACCOUNT_NUMBER
APP_NAME=my-app
STAGE=prod
SLACK_POST_CHANNEL=codepipeline_notifications
SLACK_SIGNING_SECRET=THE_SLACK_SIGNING_SECRET_FROM_EARLIER
SLACK_BOT_OAUTH_TOKEN=THE_SLACK_BOT_AUTH_TOKEN_FROM_EARLIER
LAYERS_DEPLOYMENT_BUCKET=my-app-codepipeline-actions-layers-deployment-prod # <-- updated
```

### Deploy layers

```
-> aws-codepipeline-actions: cd layers
-> aws-codepipeline-actions/layers: yarn deploy:prod
yarn run v1.21.1
$ export $(cat ../.env) && aws-vault exec ${VAULT_PROFILE_PROD} -- sls deploy --verbose --stage=prod --appname=${APP_NAME}
Serverless: Packaging service...
..
layers:
  codepipeline-actions-axios: arn:aws:lambda:eu-west-1:YOUR_AWS_ACCOUNT_NUMBER:layer:codepipeline-actions-axios:1
  codepipeline-actions-crypto: arn:aws:lambda:eu-west-1:YOUR_AWS_ACCOUNT_NUMBER:layer:codepipeline-actions-crypto:1
...
Done in 20.08s.
```

In case you re-deploy the layers, update the `.env` file

```
AWS_ACCOUNT_NUMBER=YOUR_AWS_ACCOUNT_NUMBER
APP_NAME=my-app
STAGE=prod
SLACK_POST_CHANNEL=codepipeline_notifications
SLACK_SIGNING_SECRET=THE_SLACK_SIGNING_SECRET_FROM_EARLIER
SLACK_BOT_OAUTH_TOKEN=THE_SLACK_BOT_AUTH_TOKEN_FROM_EARLIER
LAYERS_DEPLOYMENT_BUCKET=my-app-codepipeline-actions-layers-deployment-prod
AXIOS_LAYER_VERSION=2 # <-- update only if necessary
CRYPTO_LAYER_VERSION=2 # <-- update only if necessary
```

## Application

### Create a bucket for deployments

**Important!** Make sure the bucket's region is the same region where you intend to deploy the app

1. Bucket name: APPNAME-codepipeline-actions-deployment-STAGE
   - For example: my-app-codepipeline-actions-deployment-prod
2. Enable Versioning
   - s3-01-versioning.png
3. Keep the default settings that block public access to the bucket (Next next next ...)

### Update `.env` file

Update your .env file with the bucket's name

```
AWS_ACCOUNT_NUMBER=YOUR_AWS_ACCOUNT_NUMBER
APP_NAME=my-app
STAGE=prod
SLACK_POST_CHANNEL=codepipeline_notifications
SLACK_SIGNING_SECRET=THE_SLACK_SIGNING_SECRET_FROM_EARLIER
SLACK_BOT_OAUTH_TOKEN=THE_SLACK_BOT_AUTH_TOKEN_FROM_EARLIER
LAYERS_DEPLOYMENT_BUCKET=my-app-codepipeline-actions-layers-deployment-prod
AXIOS_LAYER_VERSION=1
CRYPTO_LAYER_VERSION=1
CODEPIPELINE_ACTIONS_DEPLOYMENT_BUCKET=my-app-codepipeline-actions-deployment-prod # <-- updated
```

### Build and Deploy the application

#### Resources

- ApiGateway (REST) - [Created by default](https://serverless.com/framework/docs/providers/aws/events/apigateway#share-api-gateway-and-api-resources), not decalred in yml file
- SNS Topic \* `ReleaseSNSTopic`
- Roles
  _ `sendSlackRole`
  _ `processApprovalRole`
- CloudWatchEvents
  _ `slackPostReleaseEvent`
  _ `processApprovalSlackReleaseEvents`
- CloudWatch Log Groups
  _ `CodepipelineSlackReleaseLogGroup`
  _ `SlackPostReleaseLogGroup` \* `SlackUpdateReleaseLogGroup`
- Lambda Functions
  _ `slackPostRelease`
  _ `codepipelineSlackRelease` \* `slackUpdateRelease`

### Update `.env` file

Update your .env file with the Slack PostBack Lambda Function Name, Metadata Bucket Name and Metadata File Name

The variable `CODEPIPELINE_INVOKE_LAMBDA_FUNCTION_NAME` value should be:

```
${AppName}-codepipeline-actions-${Stage}-slackUpdateRelease
```

The updated `.env` file

```
AWS_ACCOUNT_NUMBER=YOUR_AWS_ACCOUNT_NUMBER
APP_NAME=my-app
STAGE=prod
SLACK_POST_CHANNEL=codepipeline_notifications
SLACK_SIGNING_SECRET=THE_SLACK_SIGNING_SECRET_FROM_EARLIER
SLACK_BOT_OAUTH_TOKEN=THE_SLACK_BOT_AUTH_TOKEN_FROM_EARLIER
LAYERS_DEPLOYMENT_BUCKET=my-app-codepipeline-actions-layers-deployment-prod
AXIOS_LAYER_VERSION=1
CRYPTO_LAYER_VERSION=1
CODEPIPELINE_ACTIONS_DEPLOYMENT_BUCKET=my-app-codepipeline-actions-deployment-prod
CODEPIPELINE_INVOKE_LAMBDA_FUNCTION_NAME=my-app-codepipeline-actions-prod-slackUpdateRelease # <-- updated
SLACK_POST_METADATA_BUCKET_NAME=my-app-candidates-prod # <-- updated
SLACK_POST_METADATA_FILE_NAME=candidate.zip # <-- update only if necessary
```

### **Build** the application

```
-> aws-codepipeline-actions: yarn build:local
$ export $(cat .env) && bash ./scripts/build_services
...
Successfully Built
./services/codepipeline-auto
./services/codepipeline-slack
./services/copy-object
./services/slack-post
./services/slack-update
Done in 12.32s.
```

### **Deploy** the application

```
-> aws-codepipeline-actions: yarn deploy:prod
yarn run v1.21.1
$ export $(cat .env) && aws-vault exec ${VAULT_PROFILE_PROD} -- sls deploy --verbose --stage=prod --appname=${APP_NAME}
Serverless: Packaging service...
...
Serverless: Creating Stack...
...
ServiceEndpoint: https://hashedstr.execute-api.eu-west-1.amazonaws.com/prod
...
Done in 55.48s.
```

You see that **ServiceEndpoint**? Slack will POST to this URL each time a user interacts with our Slack application.

### Slack Interactive Webhooks

Now we need to set the Interactive Webhooks, so each time a user clicks Yes/No in Slack, the codepipeline-actions app will get the user's interaction.

1. Go to [Slack Your Apps](https://api.slack.com/apps) and select the codepipeline-actions app
2. Features > Interactive Components > Interactivity > Toggle ON
3. Request URL should be ServiceEndpoint followed by the path that was declared in `processApprovalSlackReleaseEvents`

`serverless.custom.yml`

```
processApprovalSlackReleaseEvents:
  - http:
      path: /codepipeline/release
      method: post
```

So the Request URL should be something like this:

```
https://hashedstr.execute-api.eu-west-1.amazonaws.com/prod/codepipeline/release
```

4. Save Changes

# CodePipeline

Now we can use the `ReleaseSNSTopic` in CodePipeline!
Recap of the whole process:

1. `Release` stage is in progress - triggers the Lambda function `slackPostRelease`, which posts a detailed message to `codepipeline_notifications` channel
2. User clicked Yes/No in Slack channel - triggers the Lambda function `codepipelineSlackRelease` which approves/rejects the `Release` stage in CodePipeline
3. Approved/Rejected in CodePipeline - triggers the Lambda function `slackUpdateRelease`, which updates the initial Slack message with Approved/Rejected and by whom

## Using your own CodePipeline

If you're using your own CodePipeline, then use the `ReleaseSNSTopic` in your approval step, for example:

```
        - Name: Release
          Actions:
            - Name: ApproveRelease
              ActionTypeId:
                Category: Approval
                Owner: AWS
                Provider: Manual
                Version: "1"
              Configuration:
                # This is where use the SNS Topic
                NotificationArn: !Sub
                "arn:aws:sns:${AWS::Region}:${AWS::AccountId}:${AppName}-ReleaseSNSTopic-${Stage}"
                CustomData: !Sub "${Stage}"
              RunOrder: 1
```

## Using the example's CodePipeline

If you want to use this project's example [codepipeline.yml](./examples/codepipeline.yml), keep on reading!

For simplicity, I've created two stages in the pipeline: `Source` and `Release`.
The `Source` is linked to our `candidate.zip` changes, and the `Release` is linked to the SNS Topic `ReleaseSNSTopic`.
Feel free to change this SNS topic's name, it's in [serverless.custom.yml](./serverless.custom.yml) under `Resources` and also the event of `slackPostReleaseEvent`.

### Deploy CodePipeline Example

**Important!** Make sure you are in the same region where you intend to deploy the app
Resources: CodePipeline, IAM Role for CodePipeline, and a bucket for CodePipeline artifacts

#### Get CodeBuildCandidateBucketName

First let's get the bucket name of `CodeBuildCandidateBucketName`

- Services > Cloudformation > Click on `my-app-CodeBuildCandidate-prod` > Resources > Copy the `Physical ID` of `CandidatesBucket`

In my case it's `my-app-candidates-prod`

#### Deploy CodePipeline

**Important!** Make sure you are in the same region where you intend to deploy the app
Now let's deploy CodePipeline

2. Download the file [examples/codepipeline.yml](examples/codepipeline.yml) to your machine
3. Services > CloudFormation > Create stack > With new resources (standard)
4. Upload a template file > Choose file > codepipeline.yml > Next
5. Specify stack details:
   - Stack name: my-app-CodePipeline-prod
   - AppName: my-app
   - Stage: prod
   - CodeBuildCandidateBucketName: `my-app-candidates-prod` (put YOUR candidates bucket name)
6. Configure stack options > Next
7. Review my-app-CodePipeline-prod
   - Scroll to the bottom and tick `I acknowledge that AWS CloudFormation might create IAM resources.`
   - Create stack

It usually takes something like 1 minute to deploy this stack. Final result:
aws-codepipeline-final-result.png

### Triggering CodePipeline

**Important!** If you're using [examples/codebuild.yml](examples/codebuild.yml) then it will take ~3 minutes to build the project, and only then it will trigger CodePipeline

No we need to trigger a build, this will create a new `candidate.zip` and then our CodePipeline will start working.
Remember - each time you trigger a build, a new version of `candidate.zip` will be created, hence the CodePipeline will be triggered.

#### Trigger build by pull-request/push

The CodeBuild template is set to be triggered by the event of pull-request or push.
Create a file, commit it, and push to the repository

```
touch some_file
git commit -m "trigger-codebuild"
git push
```

#### Build manually

**Important!** Make sure you are in the same region where you intend to deploy the app
**Important!** You can't manually trigger your first build, you must first trigger by pull-request/push, since the app needs the pull-request/push details

1. Services > CodeBuild > Build projects > my-app-CodeBuildCandidate-prod > Start build
2. Scroll to the bottom, set Source version to branch `master` (or relevant branch name)
3. click Start build

#### Release change

**Important!** Make sure you are in the same region where you intend to deploy the app
**Important!** You can't use Release change for your first build, you must first trigger by pull-request/push, since the app needs the pull-request/push details

1. Services > CodePipeline > Pipeline > Pipelines > Click on my-app-CodePipeline-prod
2. On the top right, click Release change and Release

# Clean up
