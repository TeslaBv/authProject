import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const authController = new AuthController();

// Definimos las rutas y las conectamos con el controlador

// POST http://localhost:4000/api/auth/register
router.post('/register', (req, res) => authController.register(req, res));

// POST http://localhost:4000/api/auth/login
router.post('/login', (req, res) => authController.login(req, res));


// Rutas Privadas (Necesitan Token)
router.get('/profile', authMiddleware, (req, res) => authController.getProfile(req, res));
router.post('/change-password', authMiddleware, (req, res) => authController.changePassword(req, res));

// Rutas de recuperacion
router.post('/forgot-password', (req, res) => authController.forgotPassword(req, res));
router.put('/reset-password/:token', (req, res) => authController.resetPassword(req, res));

export default router;