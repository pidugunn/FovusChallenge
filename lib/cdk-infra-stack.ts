import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as path from 'path';

export class CdkInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket
    const bucket = new s3.Bucket(this, 'InputBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // DynamoDB Table
    const table = new dynamodb.Table(this, 'FileTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      stream: dynamodb.StreamViewType.NEW_IMAGE, // Enable streams
    });

    // Lambda Function for Upload
    const uploadHandler = new lambda.Function(this, 'UploadHandler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      handler: 'upload.handler',
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'ApiGateway', {
      restApiName: 'Upload Service',
      description: 'This service handles file uploads.',
    });

    const uploadIntegration = new apigateway.LambdaIntegration(uploadHandler);
    const items = api.root.addResource('items');
    items.addMethod('POST', uploadIntegration);

    // VPC for EC2
    const vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: 2,
    });

    // Lambda Function to Create VM
    const createVMHandler = new lambda.Function(this, 'CreateVMHandler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      handler: 'createVM.handler',
    });

    createVMHandler.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ec2:RunInstances'],
      resources: ['*'],
    }));

    // Lambda Function to Save Outputs
    const saveOutputHandler = new lambda.Function(this, 'SaveOutputHandler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      handler: 'saveOutput.handler',
    });

    // Lambda Function to Save Data to DynamoDB
    const saveToDynamoDBHandler = new lambda.Function(this, 'SaveToDynamoDBHandler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      handler: 'saveToDynamoDB.handler',
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    // Grant the Lambda function read/write permissions to the DynamoDB table
    table.grantReadWriteData(saveToDynamoDBHandler);

    // Create an API Gateway endpoint to trigger this Lambda function
    const saveIntegration = new apigateway.LambdaIntegration(saveToDynamoDBHandler);
    const saveResource = api.root.addResource('save');
    saveResource.addMethod('POST', saveIntegration);

    // Set up DynamoDB stream to trigger the Lambda function
    createVMHandler.addEventSource(new lambdaEventSources.DynamoEventSource(table, {
      startingPosition: lambda.StartingPosition.TRIM_HORIZON,
      batchSize: 1,
      retryAttempts: 10,
    }));
  }
}
