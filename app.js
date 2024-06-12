const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot');
require("dotenv").config(); // Carga las variables de entorno desde el archivo .env

// Importa el módulo para iniciar el portal web que permite escanear el código QR de WhatsApp
const QRPortalWeb = require('@bot-whatsapp/portal');

// Importa el proveedor Baileys, que permite la conexión con WhatsApp utilizando el protocolo baileys
const BaileysProvider = require('@bot-whatsapp/provider/baileys');

// Importa el adaptador Mock, utilizado para simular una base de datos en memoria para pruebas y desarrollo
const MockAdapter = require('@bot-whatsapp/database/mock');

// Importa el módulo 'path', que proporciona utilidades para trabajar con rutas de archivos y directorios
const path = require("path");

// Importa el módulo 'fs', que proporciona utilidades para trabajar con el sistema de archivos
const fs = require("fs");


// Importa la biblioteca de Gemini para Node.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Ruta al archivo que contiene los mensajes de consulta
const pathConsultas = path.join(__dirname, "mensajes", "promptConsultas.txt");
// Lee el contenido del archivo de consultas
const promptConsultas = fs.readFileSync(pathConsultas, "utf8");

//




// Función para inicializar el modelo de Gemini
async function initializeModel() {
    // Accede a tu clave de API de Gemini como una variable de entorno
    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    // Obtén el modelo generativo (en este caso, gemini-pro)
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    return model;
}

// Definición del flujo principal del bot
const principal = addKeyword([""])
    // Respuestas automáticas al ingresar un texto
    .addAnswer("Pregunta algo mas!!!  👇", { capture: true }, async (ctx, ctxFn) => {
        // Captura el mensaje del usuario
        const prompt = promptConsultas;
        const consulta = ctx.body;
        try {
            // Inicializa el modelo de Gemini
            const model = await initializeModel();
            // Genera una respuesta utilizando el modelo de Gemini
            const result = await model.generateContent([prompt, consulta]);
            const response = await result.response;
            const text = response.text();

            // Obtener el nombre del remitente del contexto
            const name = ctx.pushName;
           // console.log(`Remitente: ${name}`);

            // Construir la respuesta personalizada
            const personalizedResponse = `*Aquí está tu respuesta*, *_${name}_*: ${text}`;

            // Envía la respuesta al usuario
            await ctxFn.flowDynamic(personalizedResponse);
        } catch (error) {
            console.error("Error al generar respuesta:", error);
            await ctxFn.flowDynamic("Lo siento, ha ocurrido un error. Por favor, intenta de nuevo más tarde.");
        }
    });


// Función principal que inicializa el bot
const main = async () => {
    // Inicializa el adaptador de la base de datos
    const adapterDB = new MockAdapter();
    // Crea el flujo del bot
    const adapterFlow = createFlow([principal]);
    // Crea el proveedor de mensajes
    const adapterProvider = createProvider(BaileysProvider);

    // Crea el bot con los adaptadores y el flujo definido
    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    // Inicia el portal web para escanear el código QR de WhatsApp
    QRPortalWeb();
};

// Ejecuta la función principal
main();