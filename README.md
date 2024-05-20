
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
