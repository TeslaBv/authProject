import express, { Application, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import AuthRoutes from './auth/routes/authRoutes';

// Configuración de variables de entorno
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(express.json());
app.use(cors());

// --- ZONA DE RUTAS ---
app.get('/', (req: Request, res: Response) => {
    res.send('¡Servidor TS funcionando correctamente!');
});

// Aquí montamos las rutas de autenticación
// Todo lo que esté en authRoutes empezará con "/api/auth"
app.use('/api/auth', AuthRoutes); // <--- 2. USAR RUTAS

// ---------------------

// Conexión a MongoDB
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/backend-auth';

mongoose.connect(mongoUri)
    .then(() => {
        console.log('🟢 Conectado a MongoDB');
        // Arrancar servidor solo si hay DB
        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('🔴 Error conectando a MongoDB:', error);
    });