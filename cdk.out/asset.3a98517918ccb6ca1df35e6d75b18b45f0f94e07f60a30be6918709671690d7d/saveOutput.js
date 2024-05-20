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
      input_text: { S: body.input_text },
      input_file_path: { S: body.input_file_path },
    },
  };

  try {
    await ddbClient.send(new PutItemCommand(params));
    return {
      statusCode: 200,
      body: JSON.stringify({ id: id }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not save data" }),
    };
  }
};
