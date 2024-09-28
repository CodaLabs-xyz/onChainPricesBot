import { NextRequest, NextResponse } from 'next/server';
import { Telegraf, session } from 'telegraf'; 

// Replace 'YOUR_TELEGRAM_BOT_TOKEN' with your actual bot token
const bot = new Telegraf(process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN as string);

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
  
    console.log("** start **");
    console.log(ctx);
  
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
    //const userId = ctx.from.id;
  
    console.log(callbackData);
  
    if (callbackData === 'lang_en' || callbackData === 'lang_es') {
  
      const lang = callbackData === 'lang_en' ? 'en' : 'es';
      ctx.session.lang = lang; // Store the selected language in session
  
      // Base URL from environment variable
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  
      // Array of image paths
      const imagePaths = [
        '/images/onChainFeeds.png',
        '/images/onChainFeeds.png',
      ];
  
      // Construct full image URLs
      const images = imagePaths.map(path => `${baseUrl}${path}`);
  
      // Select a random image
      const randomImage = images[Math.floor(Math.random() * images.length)];
  
      // Send the selected image before presenting the main menu
  
      ctx.replyWithPhoto(randomImage, {
        caption: messages[lang].welcome,
        reply_markup: {
          inline_keyboard: [
            // [{ text: messages[lang].investment_recommendations, callback_data: 'investment_recommendations'}],
            [{ text: messages[lang].token_price, callback_data: 'token_price' }],
            [{ text: messages[lang].token_app, callback_data: 'token_app', url: "t.me/PriceFeedsbot/TokenPrices" }],
          ],
        },
      });
    } else if (callbackData === 'token_price') {
  
      const lang = ctx.session.lang || 'es';    
      await ctx.reply(messages[lang].token_price_message);
 
    }
  
    // ... (Handle other callback queries)
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