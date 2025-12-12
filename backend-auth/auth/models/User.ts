import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// 1. Interfaz: Define los tipos para TypeScript (qué propiedades tiene tu usuario)
export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    resetPasswordToken?: string;
    resetPasswordExpire?: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

// 2. Schema: Define la estructura para MongoDB
const UserSchema: Schema = new Schema({
    username: { 
        type: String, 
        required: true, 
        trim: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, // No permite emails repetidos
        lowercase: true,
        trim: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date }
}, {
    timestamps: true // Crea automáticamente campos createdAt y updatedAt
});

// 3. Middleware (Pre-save): Antes de guardar, encripta la contraseña
UserSchema.pre('save', async function (this: IUser) {
    // Si la contraseña no se ha modificado, terminamos la función (return)
    if (!this.isModified('password')) return;

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        // Al terminar la función sin errores, Mongoose asume que todo salió bien.
    } catch (error) {
        // Si lanzamos un error, Mongoose detiene el guardado.
        throw error;
    }
});

// 4. Método para comparar contraseñas (Login)
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Exportar el modelo
export default mongoose.model<IUser>('User', UserSchema);