const { DynamoDBClient, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");

exports.handler = async (event) => {
  const ddbClient = new DynamoDBClient({ region: 'your-region' });
  const { id, output_file_path } = JSON.parse(event.body);

  const updateParams = {
    TableName: 'YourDynamoDBTable', // Replace with your actual table name
    Key: {
      id: { S: id },
    },
    UpdateExpression: 'set output_file_path = :o',
    ExpressionAttributeValues: {
      ':o': { S: output_file_path },
    },
  };

  try {
    await ddbClient.send(new UpdateItemCommand(updateParams));
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Output saved' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not save output' }),
    };
  }
};
