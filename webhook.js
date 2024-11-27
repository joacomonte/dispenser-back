import express from "express";
import mqtt from "mqtt";
import { Logtail } from "@logtail/node";
import axios from "axios";
import Redis from "ioredis";

const app = express();
const redis = new Redis(
  "rediss://default:AZntAAIjcDFlMGYyODE5ZDk5NDA0MjZjYjYzMDkzYWM5OWU5YjQ3OXAxMA@handy-tortoise-39405.upstash.io:6379"
);

app.use(express.json());

const accessToken =
  "APP_USR-107096368082049-112618-3d1e111b795bb43351b273aea4ea5e9a-189334698";

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

app.post("/db", async (req, res) => {
  const { dispenserId, status, action, stock } = req.body;

  try {
    // Get the current dispenser data from Redis
    const currentData = await redis.get(`dispenser:${dispenserId}`);
    const dispenserData = currentData ? JSON.parse(currentData) : {};

    // Get the current date and time
    const currentDate = new Date();
    
    let newStock;
    switch (action) {
      case "delivered":
        newStock = dispenserData.stock ? dispenserData.stock - 1 : stock;
        break;
      case "write":
        newStock = stock;
        break;
      default:
        newStock = dispenserData.stock;
    }
    
    // Update the dispenser data object
    const updatedDispenserData = {
      status,
      stock: newStock,
      history: [
        ...(dispenserData.history || []),
        {
          date: currentDate.toLocaleString(),
          action,
          stock: newStock,
        },
      ],
    };

    // Store the updated dispenser data as JSON in Redis
    await redis.set(
      `dispenser:${dispenserId}`,
      JSON.stringify(updatedDispenserData)
    );

    console.log("Dispenser data stored in Redis successfully");
    res.status(200).json({ message: "Data received and stored successfully" });
  } catch (error) {
    console.error("Error storing dispenser data in Redis:", error);
    res.status(500).json({ error: "An error occurred while storing data" });
  }
});

// Endpoint to receive notifications
app.post("/webhook", async (req, res) => {
  const { action, data } = req.body;

  // Filter for 'payment.created' action
  if (action === "payment.created") {
    const paymentId = data.id;

    try {
      // Make a GET request to retrieve payment details
      const url = `https://api.mercadopago.com/v1/payments/${paymentId}`;
      const headers = {
        Authorization: `Bearer ${accessToken}`,
      };

      const response = await axios.get(url, { headers });
      const paymentData = response;

      // Handle the payment data
      console.log("payment", paymentData);
    } catch (error) {
      console.error("Error fetching payment data:", error);
    }
  }

  const body = JSON.stringify(req.body); // MQTT messages should be strings

  client.publish("dispenser_01", body, { qos: 2 }, (error) => {
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

  // Subscribe with QoS 1 to receive retained messages
  client.subscribe("dispenser_01", { qos: 2 }, (err) => {
    if (!err) {
      console.log("Successfully subscribed to topic");
    } else {
      console.error("Subscription error:", err);
    }
  });
});

// Add message handler to receive messages (including retained ones)
client.on("message", (topic, message) => {
  console.log("Received message:", {
    topic: topic,
    message: message.toString(),
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});

// console.log("Notificación recibida:", req.body);

// if (req.body?.name) {
//   logtail.info("Webhook notification received", {
//     dispenserName: req.body.name || "unknown",
//     timestamp: new Date().toISOString()  // Good practice to include timestamp
//   });
// }
