const express = require('express');
const { RPCServer, RPCClient } = require('./rpc');

const app = express();
const port = 3000;

const message = JSON.stringify({
    type: 'GET',
    data: 'some data',
    from: 'client'
});
const QUEUE_NAME = 'rpc_queue';
RPCServer(QUEUE_NAME)

app.get('/amqplib', async(req, res) => {
    const data = await RPCClient(QUEUE_NAME, JSON.stringify(message));
    res.send(data);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});