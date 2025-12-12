import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { AuthRequest } from '../middleware/authMiddleware';

const authService = new AuthService();

export class AuthController {
    // 1. Controlador para REGISTRO
    async register(req: Request, res: Response): Promise<void> {
        try {
            // "req.body" trae los datos que envía el usuario
            const user = await authService.registerUser(req.body);
            
            // Respondemos con código 201 (Created)
            res.status(201).json({
                message: 'Usuario registrado exitosamente',
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email
                }
            });
        } catch (error: any) {
            // Si algo falla (ej. email repetido), respondemos con error 400
            res.status(400).json({ message: error.message });
        }
    }

    // 2. Controlador para LOGIN
    async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            
            // Llamamos al servicio para que verifique y nos de el token
            const { token, user } = await authService.loginUser(email, password);

            // Respondemos con el token
            res.status(200).json({
                message: 'Login exitoso',
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email
                }
            });
        } catch (error: any) {
            // Error 401 significa "No autorizado" (contraseña mal o usuario no existe)
            res.status(401).json({ message: error.message });
        }
    }

    async getProfile(req: AuthRequest, res: Response): Promise<void> {
        try {
            // El userId viene del token decodificado en el middleware
            const userId = req.user.id; 
            const user = await authService.getUserById(userId);
            res.status(200).json(user);
        } catch (error: any) {
            res.status(500).json({ message: 'Error al obtener perfil' });
        }
    }

    // 4. Cambiar Contraseña
    async changePassword(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user.id;
            const { oldPassword, newPassword } = req.body;

            await authService.changePassword(userId, oldPassword, newPassword);
            
            res.status(200).json({ message: 'Contraseña actualizada correctamente' });
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    // 5. Forgot Password
    async forgotPassword(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.body;
            await authService.forgotPassword(email);
            res.status(200).json({ message: 'Correo de recuperación enviado' });
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    // 6. Reset Password
    async resetPassword(req: Request, res: Response): Promise<void> {
        try {
            // El token viene en la URL (params)
            const { token } = req.params;
            const { password } = req.body;

            if (!token) {
                res.status(400).json({ message: 'Token de restablecimiento requerido' });
                return;
            }

            await authService.resetPassword(token, password);
            res.status(200).json({ message: 'Contraseña restablecida exitosamente' });
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }
}