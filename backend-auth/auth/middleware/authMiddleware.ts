import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extendemos la interfaz de Request para que acepte la propiedad "user"
export interface AuthRequest extends Request {
    user?: any;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
    // 1. Obtener el token del header (Format: "Bearer eyJhb...")
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' });
        return;
    }

    try {
        // 2. Verificar el token usando la palabra secreta
        const secret = process.env.JWT_SECRET || 'secretodefault';
        const decoded = jwt.verify(token, secret);
        
        // 3. Guardar los datos del usuario en la request para usarlos luego
        req.user = decoded;
        
        next(); // Continuar a la siguiente función (el controlador)
    } catch (error) {
        res.status(401).json({ message: 'Token inválido o expirado.' });
    }
};