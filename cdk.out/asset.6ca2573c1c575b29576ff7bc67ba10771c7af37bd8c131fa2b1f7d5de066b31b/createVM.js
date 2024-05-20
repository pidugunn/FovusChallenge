const AWS = require('aws-sdk');
const ec2 = new AWS.EC2();

exports.handler = async (event) => {
  const instanceParams = {
    ImageId: 'ami-07356357054f7a0fd', 
    InstanceType: 't2.micro',
    MinCount: 1,
    MaxCount: 1,
  };

  try {
    const instanceData = await ec2.runInstances(instanceParams).promise();
    const instanceId = instanceData.Instances[0].InstanceId;
    // Logic to download script from S3 and execute it on the instance
    return {
      statusCode: 200,
      body: JSON.stringify({ instanceId }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not create VM' }),
    };
  }
};
