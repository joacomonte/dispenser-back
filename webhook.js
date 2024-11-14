const express = require("express");
const app = express();
const mqtt = require("mqtt");

app.use(express.json());

// MQTT connection options
const options = {
  host: "a2b6966071e4497baf9705b2d2086092.s1.eu.hivemq.cloud",
  port: 8883,
  protocol: "mqtts",
  username: "YOUR_USERNAME",
  password: "YOUR_PASSWORD",
};

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

  // Publish 'OK' message to a specific topic
  client.publish("your/topic/here", "OK", (error) => {
    if (error) {
      console.error("Publish error:", error);
    }
  });

  res.status(200).send("Webhook recibido");
});
