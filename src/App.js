import React, { useState } from 'react';
import axios from 'axios';
import { nanoid } from 'nanoid';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({ region: "your-region" });

function App() {
  const [inputText, setInputText] = useState('');
  const [file, setFile] = useState(null);

  const handleSubmit = async () => {
    if (!inputText || !file) return;

    const s3Params = {
      Bucket: 'your-s3-bucket',
      Key: `${nanoid()}.input`,
      Body: file,
    };

    try {
      await s3Client.send(new PutObjectCommand(s3Params));
      await axios.post('https://your-api-gateway-endpoint', {
        id: nanoid(),
        input_text: inputText,
        input_file_path: s3Params.Key,
      });
      alert('File uploaded and data saved successfully!');
    } catch (error) {
      console.error('Error uploading file and saving data', error);
    }
  };

  return (
    <div className="App">
      <input
        type="text"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Text input"
      />
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}

export default App;
