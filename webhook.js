const express = require('express');
const axios = require('axios'); // You'll need to install axios: npm install axios
const app = express();

app.use(express.json());

// Endpoint to receive notifications (keep your existing endpoint)
app.post('/webhook', (req, res) => {
    console.log("Notificación recibida:", req.body);
    res.status(200).send('Webhook recibido');
});

// New endpoint to trigger webhook notification
app.post('/trigger-webhook', async (req, res) => {
    try {
        // Replace this URL with your Postman webhook URL
        const webhookUrl = 'https://webhook.site/9dc55be0-70f0-42d1-b9b1-40a673efcd99';
        
        // You can customize the payload that you want to send
        const payload = {
            event: 'trigger',
            timestamp: new Date().toISOString(),
            data: req.body // Forward any data received in the request
        };

        // Send the webhook
        const response = await axios.post(webhookUrl, payload);
        console.log('Webhook sent successfully:', response.data);
        
        res.status(200).json({ message: 'Webhook sent successfully' });
    } catch (error) {
        console.error('Error sending webhook:', error);
        res.status(500).json({ error: 'Failed to send webhook' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});