// import cors from 'cors';
import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// CONFIGURACIÓN: Google Sheets Script URL
// ========================================
// URL del script de Google Sheets para PASEO DE LOS AGAVES
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzfgaVK_ALVIyBrqG9t1zpIA5PkpqvOxmT8SpEB10-g1ybyDdjZieDcByURby7HuDqPww/exec';

// Utilidades para __dirname en ESModules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware de CORS
// app.use(cors({
//     origin: 'https://paseodelosagaves.mx',
//     methods: ['POST', 'OPTIONS'],
//     allowedHeaders: ['Content-Type']
// }));

// const allowedOrigins = [
//     'https://paseodelosagaves.mx'
// ];

// app.use(cors({
//     origin: (origin, callback) => {
//         if (!origin || allowedOrigins.includes(origin)) {
//             callback(null, true);
//         } else {
//             callback(new Error('CORS no permitido'));
//         }
//     },
//     methods: ['POST', 'OPTIONS'],
//     allowedHeaders: ['Content-Type']
// }));

app.use((req, res, next) => {
    const allowedOrigins = [
        "https://paseodelosagaves.mx",
        "https://www.paseodelosagaves.mx",
        "http://paseodelosagaves.mx",
        "http://www.paseodelosagaves.mx"
    ];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Content-Security-Policy", "frame-ancestors 'self' https://www.google.com");
    next();
});


app.use(express.json());

// Servir archivos estáticos desde /public
app.use(express.static(path.join(__dirname, 'public')));

// Manejo de preflight
app.options(['/enviarYDescargar', '/enviar'], (req, res) => {
    res.sendStatus(200);
});

// Ruta existente: formulario con descarga
app.post('/enviarYDescargar', async (req, res) => {
    try {
        const body = req.body;

        // Validación avanzada de campos clave
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{4,}$/;
        if (!nameRegex.test(body.first_name)) {
            return res.status(400).json({ error: 'Nombre inválido. Usa solo letras y al menos 2 caracteres.' });
        }

        const phoneRegex = /^[0-9]{8,10}$/;
        if (!phoneRegex.test(body.phone)) {
            return res.status(400).json({ error: 'Teléfono inválido. Debe contener solo números y al menos 8 dígitos.' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.email)) {
            return res.status(400).json({ error: 'Correo electrónico inválido.' });
        }


        // Validar campos obligatorios
        const requiredFields = [
            'first_name',
            'phone',
            'email',
            '00N3l00000Q7A54',
            '00N3l00000Q7A57',
            '00N3l00000Q7A4k',
            '00N3l00000Q7A4n',
            '00N3l00000Q7A5S'
        ];
        for (const field of requiredFields) {
            if (!body[field]) {
                return res.status(400).json({ error: `El campo ${field} es obligatorio.` });
            }
        }

        // Validar reCAPTCHA
        const recaptchaToken = body['g-recaptcha-response'];
        if (!recaptchaToken) {
            return res.status(400).json({ error: 'No reCAPTCHA token' });
        }

        // Validar checkbox aviso
        if (!body.aviso || !(body.aviso === true || body.aviso === 'true' || body.aviso === 'on')) {
            return res.status(400).json({ error: 'Debes aceptar el aviso de privacidad.' });
        }

        // Verificar reCAPTCHA con Google
        const secretKey = '6LeYyF4rAAAAAB2gm91IIiD9RQYgSkBrbkkkpWSy';
        const params = new URLSearchParams();
        params.append('secret', secretKey);
        params.append('response', recaptchaToken);

        const recaptchaRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            body: params
        });

        const recaptchaJson = await recaptchaRes.json();
        if (!recaptchaJson.success) {
            return res.status(403).json({ error: 'reCAPTCHA inválido' });
        }

        // ========================================
        // ENVIAR A GOOGLE SHEETS (ACTIVO)
        // ========================================
        const formDataForGoogleSheets = new URLSearchParams({
            first_name: body.first_name,
            phone: body.phone,
            email: body.email,
            '00N3l00000Q7A54': body['00N3l00000Q7A54'],
            '00N3l00000Q7A57': body['00N3l00000Q7A57'],
            '00N3l00000Q7A4k': body['00N3l00000Q7A4k'],
            '00N3l00000Q7A4n': body['00N3l00000Q7A4n'],
            '00N3l00000Q7A5S': body['00N3l00000Q7A5S'],
        });

        const googleSheetsResponse = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: formDataForGoogleSheets,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        if (!googleSheetsResponse.ok) {
            console.error('Error al enviar a Google Sheets');
            return res.status(500).json({ error: 'Error al registrar en Google Sheets' });
        }

        // ========================================
        // ENVIAR A SALESFORCE (COMENTADO - ACTIVAR CUANDO SEA NECESARIO)
        // ========================================
        // const salesforceUrl = 'https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8';
        // const salesforceData = new URLSearchParams({
        //     oid: '00Do0000000b6Io',
        //     first_name: body.first_name,
        //     phone: body.phone,
        //     email: body.email,
        //     '00N3l00000Q7A54': body['00N3l00000Q7A54'],
        //     '00N3l00000Q7A57': body['00N3l00000Q7A57'],
        //     '00N3l00000Q7A4k': body['00N3l00000Q7A4k'],
        //     '00N3l00000Q7A4n': body['00N3l00000Q7A4n'],
        //     '00N3l00000Q7A5S': body['00N3l00000Q7A5S'],
        // });
        //
        // await fetch(salesforceUrl, {
        //     method: 'POST',
        //     body: salesforceData,
        //     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        // });

        return res.status(200).json({
            message: 'Formulario enviado correctamente',
            pdfUrl: '/brochure.pdf'
        });

    } catch (error) {
        console.error('Error en enviarYDescargar:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});


// ✅ NUEVA RUTA: formulario sin descarga (para lead-form-1 y lead-form-3)
app.post('/enviar', async (req, res) => {
    try {
        const body = req.body;
        // Validación avanzada de campos clave
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{4,}$/;
        if (!nameRegex.test(body.first_name)) {
            return res.status(400).json({ error: 'Nombre inválido. Usa solo letras y al menos 2 caracteres.' });
        }

        const phoneRegex = /^[0-9]{8,10}$/;
        if (!phoneRegex.test(body.phone)) {
            return res.status(400).json({ error: 'Teléfono inválido. Debe contener solo números y al menos 8 dígitos.' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.email)) {
            return res.status(400).json({ error: 'Correo electrónico inválido.' });
        }


        const requiredFields = [
            'first_name',
            'phone',
            'email',
            '00N3l00000Q7A54',
            '00N3l00000Q7A57',
            '00N3l00000Q7A4k',
            '00N3l00000Q7A4n',
            '00N3l00000Q7A5S'
        ];
        for (const field of requiredFields) {
            if (!body[field]) {
                return res.status(400).json({ error: `El campo ${field} es obligatorio.` });
            }
        }

        const recaptchaToken = body['g-recaptcha-response'];
        if (!recaptchaToken) {
            return res.status(400).json({ error: 'No reCAPTCHA token' });
        }

        // Verificar reCAPTCHA
        const secretKey = '6LeYyF4rAAAAAB2gm91IIiD9RQYgSkBrbkkkpWSy';
        const params = new URLSearchParams();
        params.append('secret', secretKey);
        params.append('response', recaptchaToken);

        const recaptchaRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            body: params
        });

        const recaptchaJson = await recaptchaRes.json();
        if (!recaptchaJson.success) {
            return res.status(403).json({ error: 'reCAPTCHA inválido' });
        }

        // ========================================
        // ENVIAR A GOOGLE SHEETS (ACTIVO)
        // ========================================
        const formDataForGoogleSheets = new URLSearchParams({
            first_name: body.first_name,
            phone: body.phone,
            email: body.email,
            '00N3l00000Q7A54': body['00N3l00000Q7A54'],
            '00N3l00000Q7A57': body['00N3l00000Q7A57'],
            '00N3l00000Q7A4k': body['00N3l00000Q7A4k'],
            '00N3l00000Q7A4n': body['00N3l00000Q7A4n'],
            '00N3l00000Q7A5S': body['00N3l00000Q7A5S'],
        });

        const googleSheetsResponse = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: formDataForGoogleSheets,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        if (!googleSheetsResponse.ok) {
            console.error('Error al enviar a Google Sheets');
            return res.status(500).json({ error: 'Error al registrar en Google Sheets' });
        }

        // ========================================
        // ENVIAR A SALESFORCE (COMENTADO - ACTIVAR CUANDO SEA NECESARIO)
        // ========================================
        // const salesforceUrl = 'https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8';
        // const salesforceData = new URLSearchParams({
        //     oid: '00Do0000000b6Io',
        //     first_name: body.first_name,
        //     phone: body.phone,
        //     email: body.email,
        //     '00N3l00000Q7A54': body['00N3l00000Q7A54'],
        //     '00N3l00000Q7A57': body['00N3l00000Q7A57'],
        //     '00N3l00000Q7A4k': body['00N3l00000Q7A4k'],
        //     '00N3l00000Q7A4n': body['00N3l00000Q7A4n'],
        //     '00N3l00000Q7A5S': body['00N3l00000Q7A5S'],
        // });
        //
        // await fetch(salesforceUrl, {
        //     method: 'POST',
        //     body: salesforceData,
        //     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        // });

        return res.status(200).json({ message: 'Formulario enviado correctamente' });

    } catch (error) {
        console.error('Error en /enviar:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
