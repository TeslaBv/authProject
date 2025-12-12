import User, { IUser } from '../models/User';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../utils/sendEmail';
import crypto from 'crypto';

// Esta clase contendrá toda la lógica de autenticación
export class AuthService {

    // 1. Lógica de REGISTRO
    async registerUser(userData: Partial<IUser>): Promise<IUser> {
        // VALIDACIÓN: Aseguramos que los datos obligatorios vengan en la petición
        if (!userData.email || !userData.password || !userData.username) {
            throw new Error('Faltan datos requeridos: email, password o username');
        }
        // Verificar si el email ya existe
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
            throw new Error('El correo electrónico ya está registrado');
        }

        // Crear y guardar el usuario (el hash del password lo hace el modelo automáticamente)
        const user = new User(userData);
        await user.save();
        return user;
    }

    // 2. Lógica de LOGIN
    async loginUser(email: string, password: string): Promise<{ token: string, user: IUser }> {
        // Buscar usuario por email
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('Credenciales inválidas (Usuario no encontrado)');
        }

        // Verificar contraseña usando el método que creamos en el Modelo
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new Error('Credenciales inválidas (Contraseña incorrecta)');
        }

        // Generar el Token JWT
        const secret = process.env.JWT_SECRET || 'secretodefault'; // ¡Asegúrate de tener esto en tu .env!
        const token = jwt.sign(
            { id: user._id, email: user.email }, // Datos a guardar en el token (payload)
            secret,
            { expiresIn: '1h' } // El token expira en 1 hora
        );

        return { token, user };
    }

    async getUserById(id: string): Promise<IUser | null> {
        return await User.findById(id).select('-password'); // "-password" le dice a Mongo que NO traiga ese campo
    }

    // 4. Cambiar contraseña
    async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
        const user = await User.findById(userId);
        if (!user) throw new Error('Usuario no encontrado');

        // Verificar que la contraseña antigua sea correcta
        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) throw new Error('La contraseña actual es incorrecta');

        // Asignar nueva contraseña. 
        // ¡OJO! Al hacer user.save(), el "pre-save hook" que hicimos en el Modelo se activará y la encriptará sola.
        user.password = newPassword;
        await user.save();
    }

    async forgotPassword(email: string): Promise<void> {
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('No existe un usuario con ese correo');
        }

        // Generar un token aleatorio
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Encriptar el token para guardarlo en la BD (Por seguridad)
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // El token expira en 10 minutos
        user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

        await user.save({ validateBeforeSave: false });

        // URL que le enviaremos al usuario (Simulada para backend)
        // En producción, esto sería la URL de tu Frontend (React/Next)
        const resetUrl = `http://localhost:4000/api/auth/reset-password/${resetToken}`;

        console.log("--------------------------------------------------");
        console.log("LINK DE RECUPERACIÓN:", resetUrl);
        console.log("--------------------------------------------------");

        const message = `Has solicitado restablecer tu contraseña. \n\n Por favor ve a este link para cambiarla: \n\n ${resetUrl}`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Recuperación de contraseña',
                message
            });
        } catch (error) {
            // --- MODIFICACIÓN TEMPORAL PARA PRUEBAS ---
            // Comentamos esto para que el token NO se borre si falla el email
            
            // user.resetPasswordToken = undefined;
            // user.resetPasswordExpire = undefined;
            // await user.save({ validateBeforeSave: false });
            // throw new Error('Hubo un error enviando el correo. Intenta de nuevo.');
            
            console.log("El email falló (normal en local), pero el token sigue vivo.");
        }
    }

    // 6. Restablecer contraseña (Usar el token para cambiar la clave)
    async resetPassword(token: string, newPassword: string): Promise<void> {
        // Encriptar el token que recibimos para compararlo con el de la BD
        const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

        // Buscar usuario que tenga ese token Y que el tiempo no haya expirado ($gt = greater than)
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            throw new Error('Token inválido o expirado');
        }

        // Asignar nueva contraseña y limpiar campos de reset
        user.password = newPassword;
        user.resetPasswordToken = '';
        user.resetPasswordExpire = new Date('01/01/1900');

        await user.save();
    }
}