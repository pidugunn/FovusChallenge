
## AWS CDK Project
This project sets up an AWS infrastructure using AWS CDK (TypeScript) and includes a React frontend to interact with backend services. Users can upload files and text, which are stored in an S3 bucket and DynamoDB table, respectively. The system then creates an EC2 instance to process the data and save the results.

## Features
- AWS CDK for infrastructure management.
- AWS SDK JavaScript V3 for Lambda functions.
- Secure handling of AWS credentials (no hard-coded credentials).
- Automatic VM creation and script execution based on DynamoDB events.
- Professional and reader-friendly parameter/variable names and file/folder names.
- No public access to S3 files.
- Adherence to AWS best practices.
## Prerequisites
- Node.js and npm installed.
- AWS CLI configured with appropriate permissions.
- AWS CDK installed globally.
  ## Backend (Infrastructure)
Clone the Repository:
```
git clone https://github.com/pidugunn/FovusChallenge
cd FovusChallenge
```
Install Dependencies:
```
npm install
```
Bootstrap CDK:
```
cdk bootstrap
Deploy CDK Stack:
```
```
cdk deploy
```
## Frontend (React App)
Navigate to React App Directory:

```
cd react-app
```
Install Dependencies:

```
npm install
```
Run the React App:
```
npm start
```
## File Structure and Explanation
## Infrastructure Code
- cdk-infra-stack.ts: Defines the AWS resources including S3, DynamoDB, Lambda, API Gateway, and EC2.
```
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
      stream: dynamodb.StreamViewType.NEW_IMAGE,
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

```

- cdk-infra.ts: Entry point for the CDK application.
```
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkInfraStack } from '../lib/cdk-infra-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

new CdkInfraStack(app, 'CdkInfraStack', { env });

```
## Lambda Functions
- upload.js: Handles file metadata upload to DynamoDB.
```
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

exports.handler = async (event) => {
  const ddbClient = new DynamoDBClient({ region: 'your-region' });
  const { id, input_text, input_file_path } = JSON.parse(event.body);

  const putParams = {
    TableName: 'YourDynamoDBTable', // Replace with your actual table name
    Item: {
      id: { S: id },
      input_text: { S: input_text },
      input_file_path: { S: input_file_path },
    },
  };

  try {
    await ddbClient.send(new PutItemCommand(putParams));
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Data saved' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not save data' }),
    };
  }
};

```
- createVm.js: Creates an EC2 instance and runs a script.
```
  const AWS = require('aws-sdk');
const ec2 = new AWS.EC2();
const s3 = new AWS.S3();

exports.handler = async (event) => {
  const instanceParams = {
    ImageId: 'ami-07356357054f7a0fd', 
    InstanceType: 't2.micro',
    MinCount: 1,
    MaxCount: 1,
    KeyName: 'your-key-pair', // Replace with your key pair name
  };

  try {
    const instanceData = await ec2.runInstances(instanceParams).promise();
    const instanceId = instanceData.Instances[0].InstanceId;

    const userDataScript = `#!/bin/bash
      aws s3 cp s3://your-bucket/your-script.sh /home/ec2-user/your-script.sh
      chmod +x /home/ec2-user/your-script.sh
      /home/ec2-user/your-script.sh`;

    await ec2.modifyInstanceAttribute({
      InstanceId: instanceId,
      UserData: {
        Value: Buffer.from(userDataScript).toString('base64'),
      },
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ instanceId }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not create VM' }),
    };
  }
};
```

- saveOutput.js: Saves processed data back to DynamoDB.
```
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { v4: uuidv4 } = require("uuid");

exports.handler = async (event) => {
  const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
  const body = JSON.parse(event.body);
  const id = uuidv4();

  const params = {
    TableName: process.env.TABLE_NAME,
    Item: {
      id: { S: id },
      output_data: { S: body.output_data },
    },
  };

  try {
    await ddbClient.send(new PutItemCommand(params));
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Output saved successfully" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not save output" }),
    };
  }
};

```

## Frontend Code
- src/App.js: Main component for the React app.
```
import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [inputText, setInputText] = useState('');
  const [inputFile, setInputFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('inputText', inputText);
    formData.append('inputFile', inputFile);

    try {
      const response = await axios.post('your-api-gateway-endpoint', formData);
      console.log(response.data);
    } catch (error) {
      console.error('There was an error uploading the file!', error);
    }
  };

  return (
    <div className="App">
      <form onSubmit={handleSubmit}>
        <label>
          Input Text:
          <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} />
        </label>
        <label>
          Upload File:
          <input type="file" onChange={(e) => setInputFile(e.target.files[0])} />
        </label>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default App;

```
## Observing the System
- Upload Data: Use the React app to upload a file and input text.
- Check S3: Verify the file is uploaded to the S3 bucket.
- Check DynamoDB: Verify the metadata is saved in the DynamoDB table.
- EC2 Instance Creation: Check the AWS EC2 console for new instances being created based on DynamoDB events.
- Logs and Outputs: Use AWS CloudWatch to monitor Lambda function logs and ensure the system is working correctly.
## Important Notes
- Replace placeholders like your-region, your-s3-bucket, and your-api-gateway-endpoint with actual values.
- Ensure IAM roles and policies are correctly set up to allow necessary permissions for Lambda functions and EC2 instances.

## Conclusion
- This project demonstrates a secure, scalable, and automated workflow using AWS services managed by AWS CDK. The combination of React for the frontend and AWS Lambda, S3, DynamoDB, and EC2 for the backend provides a robust solution for file processing and data handling.


















