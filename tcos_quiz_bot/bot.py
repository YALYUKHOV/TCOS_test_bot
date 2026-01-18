
import logging
import os
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    ContextTypes,
)
from config import BOT_TOKEN

# Setup logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Global state (even if simplified, it avoids errors if referenced)
user_states = {}

# URL вашего развернутого Mini App
# ВАЖНО: После деплоя на Vercel/GitHub Pages замените эту ссылку!
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://tcos-quiz-mini-app.vercel.app") 

def escape_md(text: str) -> str:
    """Helper to escape special characters for Telegram MarkdownV2."""
    if not text: return ""
    escape_chars = r"_*[]()~`>#+-=|{}.!"
    return "".join(f"\\{c}" if c in escape_chars else c for c in text)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Приветствие и кнопка запуска Mini App."""
    user = update.effective_user
    
    keyboard = [
        [InlineKeyboardButton("🚀 Открыть ТЦОС Квиз", web_app=WebAppInfo(url=WEBAPP_URL))]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    welcome_text = (
        f"Привет, {user.first_name}\\!\n\n"
        "Добро пожаловать в приложение для тестирования по дисциплине *ТЦОС*\\.\n\n"
        "Нажмите на кнопку ниже, чтобы выбрать тему и начать решение задач\\."
    )
    await update.message.reply_text(welcome_text, parse_mode="MarkdownV2", reply_markup=reply_markup)

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Справка."""
    await update.message.reply_text(
        "Все тесты и управление вопросами теперь доступны в нашем Mini App\\. "
        "Просто нажмите /start и откройте приложение\\."
    )

def main():
    if not BOT_TOKEN:
        print("ОШИБКА: BOT_TOKEN не найден в .env!")
        return

    app = ApplicationBuilder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))

    print(f"Бот запущен. Ожидание Mini App на: {WEBAPP_URL}")
    app.run_polling()

if __name__ == '__main__':
    main()
