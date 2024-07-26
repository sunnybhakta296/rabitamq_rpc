const amqplib = require("amqplib");
const { v4: uuidv4 } = require("uuid");

let amqplibConn = null;
const url =
  "__URL__";

const getChannel = async () => {
  if (!amqplibConn) {
    amqplibConn = await amqplib.connect(url);
  }
  return amqplibConn.createChannel();
};

RPCServer = async (queue) => {
  const channel = await getChannel();
  await channel.assertQueue(queue, { durable: false });
  channel.prefetch(1);

  console.log("Awaiting RPC requests");

  channel.consume(queue, async (msg) => {
    const message = msg.content.toString();
    console.log("Received:", message);

    const response = `Processed: ${message}`;

    // const response = await someDBCALL()
    channel.sendToQueue(msg.properties.replyTo, Buffer.from(response), {
      correlationId: msg.properties.correlationId,
    });

    channel.ack(msg);
  });
};

RPCClient = async (queue, message) => {
  const channel = await getChannel();

  const correlationId = uuidv4();
  const replyQueue = await channel.assertQueue("", { exclusive: true });

  channel.sendToQueue(queue, Buffer.from(message), {
    correlationId: correlationId,
    replyTo: replyQueue.queue,
  });

  return new Promise((resolve, reject) => {
    channel.sendToQueue(queue, Buffer.from(message), {
      correlationId: correlationId,
      replyTo: replyQueue.queue,
    });

    channel.consume(
      replyQueue.queue,
      (msg) => {
        if (msg.properties.correlationId === correlationId) {
          console.log("Received:", msg.content.toString());
          resolve(msg.content.toString());
        }
      },
      { noAck: true }
    );
  });
};

module.exports = {
  RPCServer,
  RPCClient,
};
