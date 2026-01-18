
import logging
import os
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    ContextTypes,
    CallbackQueryHandler,
)
from config import BOT_TOKEN
from quiz_data import QUIZ_DATA

# Setup logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# URL вашего развернутого Mini App (измените после деплоя на Vercel/GitHub)
# Можно также вынести в .env: WEBAPP_URL = os.getenv("WEBAPP_URL", "...")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://your-mini-app-url.vercel.app") 

def escape_md(text: str) -> str:
    """Helper to escape special characters for Telegram MarkdownV2."""
    if not text: return ""
    escape_chars = r"_*[]()~`>#+-=|{}.!"
    return "".join(f"\\{c}" if c in escape_chars else c for c in text)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Initial greeting with Mini App button."""
    user = update.effective_user
    
    if "your-mini-app-url" in WEBAPP_URL:
        logger.warning("WEBAPP_URL is still a placeholder. Mini App button might not work.")

    keyboard = [
        [InlineKeyboardButton("🎓 Пройти тест (App)", web_app=WebAppInfo(url=WEBAPP_URL))],
        [InlineKeyboardButton("📚 Выбор темы в чате", callback_data="show_themes")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    welcome_text = (
        f"Привет, {user.first_name}\\!\n\n"
        "Я бот для тестирования по дисциплине *ТЦОС*\\.\n\n"
        "Вы можете использовать полноэкранное приложение или проходить тесты прямо здесь\\."
    )
    await update.message.reply_text(welcome_text, parse_mode="MarkdownV2", reply_markup=reply_markup)

async def select_theme(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show available themes using INDICES to avoid Button_data_invalid."""
    query = update.callback_query
    if query: await query.answer()

    keyboard = []
    themes = list(QUIZ_DATA.keys())
    for i, theme in enumerate(themes):
        keyboard.append([InlineKeyboardButton(theme, callback_data=f"t:{i}")])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    msg = "Выберите тему для прохождения теста в чате:"
    
    if query:
        await query.edit_message_text(msg, reply_markup=reply_markup)
    else:
        await update.message.reply_text(msg, reply_markup=reply_markup)

async def start_quiz_by_theme(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    data_parts = query.data.split(":")
    if len(data_parts) < 2: return

    theme_idx = int(data_parts[1])
    themes = list(QUIZ_DATA.keys())
    
    if theme_idx >= len(themes): return
    theme_name = themes[theme_idx]
    
    user_id = update.effective_user.id
    user_states[user_id] = {
        "theme": theme_name,
        "index": 0,
        "score": 0
    }
    
    await query.edit_message_text(f"Тема: *{escape_md(theme_name)}*\\. Начинаем\\!", parse_mode="MarkdownV2")
    await send_question(context, user_id, update.effective_chat.id)

async def send_question(context: ContextTypes.DEFAULT_TYPE, user_id: int, chat_id: int):
    state = user_states.get(user_id)
    if not state: return

    theme = state["theme"]
    index = state["index"]
    questions = QUIZ_DATA[theme]

    if index >= len(questions):
        await end_quiz(context, user_id, chat_id)
        return

    question_data = questions[index]
    q_text = f"*Вопрос {index + 1}/{len(questions)}*\n\n{escape_md(question_data['question'])}"
    
    keyboard = []
    for i, opt in enumerate(question_data["options"]):
        keyboard.append([InlineKeyboardButton(opt, callback_data=f"a:{i}")])
    
    reply_markup = InlineKeyboardMarkup(keyboard)

    if question_data.get("image"):
        await context.bot.send_photo(chat_id=chat_id, photo=question_data["image"], caption=q_text, reply_markup=reply_markup, parse_mode="MarkdownV2")
    else:
        await context.bot.send_message(chat_id=chat_id, text=q_text, reply_markup=reply_markup, parse_mode="MarkdownV2")

async def handle_answer(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    user_id = update.effective_user.id
    state = user_states.get(user_id)
    
    if not state:
        await query.answer("Сессия истекла.")
        return

    data_parts = query.data.split(":")
    if len(data_parts) < 2: return

    ans_idx = int(data_parts[1])
    theme = state["theme"]
    q_idx = state["index"]
    question_data = QUIZ_DATA[theme][q_idx]
    
    if ans_idx >= len(question_data["options"]): return
    
    user_ans = question_data["options"][ans_idx]
    is_correct = user_ans == question_data["answer"]
    
    await query.answer("Правильно! ✅" if is_correct else "Неверно ❌")
    if is_correct: state["score"] += 1

    state["index"] += 1
    try:
        await query.edit_message_reply_markup(reply_markup=None)
    except: pass

    await send_question(context, user_id, update.effective_chat.id)

async def end_quiz(context: ContextTypes.DEFAULT_TYPE, user_id: int, chat_id: int):
    state = user_states.pop(user_id, None)
    if not state: return
    score = state["score"]
    total = len(QUIZ_DATA[state["theme"]])
    
    msg = f"🏁 *Тест завершен\\!*\nВаш результат: *{score}* из *{total}*"
    keyboard = [[InlineKeyboardButton("🔙 К выбору тем", callback_data="show_themes")]]
    await context.bot.send_message(chat_id, msg, parse_mode="MarkdownV2", reply_markup=InlineKeyboardMarkup(keyboard))

async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE):
    logger.error(f"Telegram Error: {context.error}")

def main():
    if not BOT_TOKEN:
        print("ОШИБКА: BOT_TOKEN не найден!")
        return

    app = ApplicationBuilder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("quiz", select_theme))
    app.add_handler(CallbackQueryHandler(select_theme, pattern="^show_themes$"))
    app.add_handler(CallbackQueryHandler(start_quiz_by_theme, pattern="^t:"))
    app.add_handler(CallbackQueryHandler(handle_answer, pattern="^a:"))
    app.add_error_handler(error_handler)

    print(f"Бот запущен. WebApp URL: {WEBAPP_URL}")
    app.run_polling()

if __name__ == '__main__':
    main()
