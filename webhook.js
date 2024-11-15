const express = require("express");
const app = express();
const mqtt = require("mqtt");
const { Logtail } = require("@logtail/node");

app.use(express.json());

// MQTT connection options
const options = {
  host: "a2b6966071e4497baf9705b2d2086092.s1.eu.hivemq.cloud",
  port: 8883,
  protocol: "mqtts",
  username: "joacomonte",
  password: "Feather94",
};

// Initialize Logtail with your source token
const logtail = new Logtail("9oLPcVp9tMGwr9uXyQBaEFZt");

// Connect to HiveMQ Cloud
const client = mqtt.connect(options);

// Handle connection events
client.on("connect", () => {
  console.log("Connected to HiveMQ Cloud");
});

client.on("error", (error) => {
  console.error("Connection error:", error);
});

// Endpoint to receive notifications
app.post("/webhook", (req, res) => {
  console.log("Notificación recibida:", req.body);

  try {
    // Log the notification with Logtail
    logtail.info("Webhook notification received", {
      dispenser_name: req.body.data.name,
      amount: req.body.data.amount,
      external_reference: req.body.data.external_reference,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error logging to Logtail:", error);
    logtail.error("Failed to log webhook notification", {
      error: error.message,
      rawBody: req.body,
    });
  }

  // Send more detailed message
  const message = JSON.stringify({
    status: "OK",
    timestamp: new Date().toISOString(),
    receivedData: req.body,
  });

  client.publish("dispenser_01", message, { qos: 1, retain: true }, (error) => {
    if (error) {
      console.error("Publish error:", error);
      res.status(500).json({ error: "Failed to publish message" });
    } else {
      res.status(200).json({ status: "Message published successfully" });
    }
  });
});

// Handle connection events
client.on("connect", () => {
  console.log("Connected to HiveMQ Cloud");

  // Subscribe to the same topic we're publishing to
  client.subscribe("dispenser_01", (err) => {
    if (!err) {
      console.log("Successfully subscribed to topic");
    } else {
      console.error("Subscription error:", err);
    }
  });
});

// Add message handler
client.on("message", (topic, message) => {
  console.log("Received message on topic:", topic);
  console.log("Message:", JSON.parse(message.toString()));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
