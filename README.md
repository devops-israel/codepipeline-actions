# codepipeline-actions

Improve the use of CodePipeline by adding the following features:

1. Approve Manual Approval step via Slack
1. (Under development) Copy files according to condition
1. (Under development) Automatically approve/reject Manual Approval step according to QA results

## Getting Started

### Prerequisites

The following apps must be installed on your machine:

1. [Docker](https://docs.docker.com/install/)
1. [Docker Compose](https://docs.docker.com/compose/install/)
1. [yarn](https://yarnpkg.com/lang/en/docs/install/)
1. Integrate CodeBuild with your GitHub account
   - Create CodeBuild project
   - Source Provider: GitHub, Repository in my GitHub account and click Connect
   - Discard the CodeBuild project

### Installing

Clone this repository

```
codepipeline-actions: git git@github.com:devops-internal/codepipeline-actions.git
```

### Usage

#### Run docker-compose container

```
codepipeline-actions: yarn docker:run
...
bash-5.0:
```

**[aws-vault](https://github.com/99designs/aws-vault) users** - Update `env` file with your AWS_VAULT_PROFILE and run `yarn docker:run:aws-vault`

1. Installs dependencies for Lambda Layers and Services (Lambda Functions)
1. Creates two S3 buckets and updates `.env` file

#### Slack App secrets

1. Create [Slack application](https://api.slack.com/apps)
1. Create Slack Bot
1. Update `.env` file with the values: `SLACK_SIGNING_SECRET` and `SLACK_BOT_OAUTH_TOKEN`

#### Build and deploy

```
bash-5.0#  yarn build
...
bash-5.0#  yarn deploy:all
...
```

#### Trigger a build

Create a pull-request, from any branch to `develop` branch, now look at `codepipeline_notifications` channel in Slack
