import { addNote, getNotesByUserId, searchNotes, deleteAllNotes, saveTelegramMessage } from "./db";

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    date: number;
    chat: {
      id: number;
      type: string;
    };
    text?: string;
    from?: {
      id: number;
      is_bot: boolean;
      first_name: string;
    };
  };
}

interface TelegramUser {
  userId: number;
  botToken: string;
  telegramChatId: string;
}

export async function processTelegramUpdate(
  update: TelegramUpdate,
  user: TelegramUser
): Promise<string> {
  const message = update.message;
  if (!message || !message.text) {
    return "Получено сообщение без текста";
  }

  const text = message.text.trim();
  const chatId = message.chat.id;
  const messageId = message.message_id;

  // Сохранить сообщение в БД
  await saveTelegramMessage(
    user.userId,
    chatId.toString(),
    messageId,
    text,
    "text"
  );

  // Обработать команды
  if (text === "/start") {
    return getStartMessage();
  }

  if (text === "/list") {
    return await getNotesListMessage(user.userId);
  }

  if (text === "/clear") {
    await deleteAllNotes(user.userId);
    return "✅ Все заметки удалены";
  }

  if (text.startsWith("/add ")) {
    const noteContent = text.substring(5).trim();
    if (!noteContent) {
      return "❌ Пожалуйста, укажите текст заметки после /add";
    }
    await addNote(user.userId, chatId.toString(), noteContent);
    return "✅ Заметка добавлена";
  }

  if (text.startsWith("/search ")) {
    const query = text.substring(8).trim();
    if (!query) {
      return "❌ Пожалуйста, укажите поисковый запрос после /search";
    }
    return await searchNotesMessage(user.userId, query);
  }

  // Если это не команда, сохранить как заметку
  await addNote(user.userId, chatId.toString(), text);
  return "✅ Сообщение сохранено как заметка";
}

function getStartMessage(): string {
  return `👋 Добро пожаловать в Telegram Бот для Заметок!

📝 Вот что я умею делать:

/start - Показать это сообщение
/add текст - Добавить новую заметку
/list - Показать все заметки
/search запрос - Найти заметки по ключевому слову
/clear - Удалить все заметки

💡 Совет: Любое сообщение автоматически сохраняется как заметка!`;
}

async function getNotesListMessage(userId: number): Promise<string> {
  const userNotes = await getNotesByUserId(userId);

  if (userNotes.length === 0) {
    return "📭 У вас нет сохраненных заметок";
  }

  let message = `📋 Ваши заметки (всего: ${userNotes.length}):\n\n`;
  userNotes.slice(0, 10).forEach((note, index) => {
    const preview = note.content.substring(0, 50);
    const truncated = note.content.length > 50 ? "..." : "";
    message += `${index + 1}. ${preview}${truncated}\n`;
  });

  if (userNotes.length > 10) {
    message += `\n... и еще ${userNotes.length - 10} заметок`;
  }

  return message;
}

async function searchNotesMessage(userId: number, query: string): Promise<string> {
  const results = await searchNotes(userId, query);

  if (results.length === 0) {
    return `🔍 Заметок по запросу "${query}" не найдено`;
  }

  let message = `🔍 Результаты поиска по "${query}" (найдено: ${results.length}):\n\n`;
  results.slice(0, 10).forEach((note, index) => {
    const preview = note.content.substring(0, 50);
    const truncated = note.content.length > 50 ? "..." : "";
    message += `${index + 1}. ${preview}${truncated}\n`;
  });

  if (results.length > 10) {
    message += `\n... и еще ${results.length - 10} результатов`;
  }

  return message;
}
