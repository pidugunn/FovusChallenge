
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
    
        // Add logic to download script from S3 and execute it on the instance
        // For example, using user data to run the script on instance start
    
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
    
