// webhook.js
const express = require('express');
const app = express();

// Middleware para procesar JSON
app.use(express.json());

// Ruta para recibir las notificaciones
app.post('/webhook', (req, res) => {
    console.log("Notificación recibida:", req.body);
    res.status(200).send('Webhook recibido');
});

// Iniciar el servidor en un puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});
//