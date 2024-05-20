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
