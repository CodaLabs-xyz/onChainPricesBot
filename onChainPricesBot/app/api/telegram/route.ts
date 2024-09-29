import { NextRequest, NextResponse } from 'next/server';
import { Telegraf, session } from 'telegraf'; 
import jwt from "jsonwebtoken";
import nodeCrypto from "crypto";

// Initialize Telegraf bot with the token from environment variables
const bot = new Telegraf(process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN as string);

// Environment variables
const TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
// const LOGIN_URL = process.env.NEXT_PUBLIC_APP_URL;
// Base URL from environment variable
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL;


// Define the session data structure
interface SessionData {
    lang?: string;
}

// Add session middleware with default session data
bot.use(session({
    defaultSession: (): SessionData => ({})
}));

// Define messages in JSON objects
const messages = {
    es: {
        welcome: '¡Bienvenido a onChain Price Feeds Bot! Puedo ayudarte con la informacion del costo de tokens. \nPor favor selecciona una opción:',
        token_price: 'Precio de tokens',
        token_app: 'App de tokens',
        token_price_message: 'Aquí hay algunos tokens a selecionar:',
        language_selection: 'Por favor seleccione su idioma / Please select your language:',
        english: 'English',
        spanish: 'Español',
    },
    en: {
        welcome: 'Welcome to onChain Price Feeds Bot! I can help you with token price information. \nPlease select an option:',
        token_price: 'Token Price',
        token_app: 'Token App',
        token_price_message: 'Here are some tokens to select:',
        language_selection: 'Please select your language / Please select your language:',
        english: 'English',
        spanish: 'Español',
    }
};

// Handle '/start' command (initial interaction)
bot.start((ctx) => {
    // console.log("** start **");
    ctx.reply(messages.es.language_selection, {
        reply_markup: {
            inline_keyboard: [
                [{ text: messages.en.spanish, callback_data: 'lang_es' }],
                [{ text: messages.en.english, callback_data: 'lang_en' }],
            ],
        },
    });
});

// Handle callback queries
bot.on('callback_query', async (ctx) => {
    const callbackData = ctx.callbackQuery.data;

    if (callbackData === 'lang_en' || callbackData === 'lang_es') {
        const lang = callbackData === 'lang_en' ? 'en' : 'es';
        ctx.session.lang = lang; // Store the selected language in session

        // Array of image paths
        const imagePaths = [
            '/images/onChainFeeds.png',
            '/images/onChainFeeds.png',
        ];

        // console.log("[DEBUG] Base URL:", baseUrl);

        // Construct full image URLs
        const images = imagePaths.map(path => `${BASE_URL}${path}`);

        // Select a random image
        const randomImage = images[Math.floor(Math.random() * images.length)];
        // console.log("[DEBUG] Random image:", randomImage);

        const userData = {
            authDate: Math.floor(new Date().getTime()),
            firstName: ctx.update.callback_query.from.first_name,
            lastName: "",
            username: ctx.update.callback_query.from.username,
            id: ctx.update.callback_query.from.id,
            photoURL: "",
        };
        // console.log("[DEBUG] User data:", userData);

        const hash = generateTelegramHash(userData);
        // console.log("[DEBUG] Hash:", hash);

        // Create JWT with user data and hash
        const telegramAuthToken = jwt.sign(
            {
                ...userData,
                hash,
            },
            process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN as string, // Use the bot token to sign the JWT
            { algorithm: "HS256" }
        );
        // console.log("[DEBUG] JWT generated for user", userData);

        // URL-encode the generated JWT for safe usage in a URL
        const encodedTelegramAuthToken = encodeURIComponent(telegramAuthToken);      
        // console.log("[DEBUG] Encoded JWT for user", encodedTelegramAuthToken);

        const appURL = `${BASE_URL}/?telegramAuthToken=${encodedTelegramAuthToken}`;
        // console.log("[DEBUG] App URL:", appURL);

        // Send the selected image before presenting the main menu
        ctx.replyWithPhoto(randomImage, {
            caption: messages[lang].welcome,
            reply_markup: {
                inline_keyboard: [
                    [{ text: messages[lang].token_price, callback_data: 'token_price' }],
                    [{ text: messages[lang].token_app, web_app: { url: appURL } }],
                ],
            },
        });
    } else if (callbackData === 'token_price') {
        const lang = ctx.session.lang || 'es';    
        await ctx.reply(messages[lang].token_price_message);
    }
});

// Handle other commands or messages
// ... (Implement logic to process user input, generate recommendations, etc.)
// Handle messages (integrate OpenAI)

export async function POST(request: NextRequest) {
    try {
        // Parse incoming webhook request from Telegram
        const body = await request.json();

        // Pass the update to Telegraf for processing
        await bot.handleUpdate(body);

        return new NextResponse('OK', { status: 200 });
    } catch (error) {
        console.error('Error handling Telegram webhook:', error);
        return new NextResponse('Error', { status: 500 });
    }
}

/**
 * Function to generate HMAC hash for Telegram authentication
 * @param {Object} data - User data to be hashed
 * @returns {string} - Generated HMAC hash
 */
const generateTelegramHash = (data): string => {
    // Prepare the data object with required fields
    const userData = {
        auth_date: String(data.authDate),
        first_name: data.firstName,
        id: String(data.id),
        last_name: data.lastName,
        photo_url: data.photoURL,
        username: data.username,
    };

    // Filter out undefined or empty values from the data object
    const filteredUseData = Object.entries(userData).reduce(
        (acc: { [key: string]: string }, [key, value]) => {
            if (value) acc[key] = value;
            return acc;
        },
        {} as { [key: string]: string }
    );

    // Sort the entries and create the data check string
    const dataCheckArr = Object.entries(filteredUseData)
        .map(([key, value]) => `${key}=${String(value)}`)
        .sort((a, b) => a.localeCompare(b))
        .join("\n");

    // Create SHA-256 hash from the bot token
    const TELEGRAM_SECRET = nodeCrypto
        .createHash("sha256")
        .update(TOKEN as string)
        .digest();

    // Generate HMAC-SHA256 hash from the data check string
    return nodeCrypto
        .createHmac("sha256", TELEGRAM_SECRET)
        .update(dataCheckArr)
        .digest("hex");
};