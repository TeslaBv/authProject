import nodemailer from 'nodemailer';

export const sendEmail = async (options: { email: string, subject: string, message: string }) => {
    
    // 1. Crear el transportador (Configuración de tu proveedor de correo)
    const transporter = nodemailer.createTransport({
        service: 'gmail', // O el host de tu SMTP
        auth: {
            user: process.env.SMTP_EMAIL, 
            pass: process.env.SMTP_PASSWORD 
        }
    });

    // 2. Definir el email
    const mailOptions = {
        from: `Tu App <${process.env.SMTP_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        // html: options.message // Puedes enviar HTML si quieres
    };

    // 3. Enviar
    await transporter.sendMail(mailOptions);
};