import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, botConfigs, notes, telegramMessages } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getBotConfigByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get bot config: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(botConfigs)
    .where(eq(botConfigs.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getBotConfigByToken(botToken: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get bot config: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(botConfigs)
    .where(eq(botConfigs.botToken, botToken))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function upsertBotConfig(
  userId: number,
  botToken: string,
  webhookUrl: string
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert bot config: database not available");
    return;
  }

  const existing = await getBotConfigByUserId(userId);

  if (existing) {
    await db
      .update(botConfigs)
      .set({
        botToken,
        webhookUrl,
        isConfigured: 1,
        updatedAt: new Date(),
      })
      .where(eq(botConfigs.id, existing.id));
  } else {
    await db.insert(botConfigs).values({
      userId,
      botToken,
      webhookUrl,
      isConfigured: 1,
    });
  }
}

export async function addNote(
  userId: number,
  telegramChatId: string,
  content: string
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add note: database not available");
    return;
  }

  await db.insert(notes).values({
    userId,
    telegramChatId,
    content,
  });
}

export async function getNotesByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get notes: database not available");
    return [];
  }

  return await db.select().from(notes).where(eq(notes.userId, userId));
}

export async function searchNotes(userId: number, query: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot search notes: database not available");
    return [];
  }

  const allNotes = await db.select().from(notes).where(eq(notes.userId, userId));
  return allNotes.filter(note => 
    note.content.toLowerCase().includes(query.toLowerCase())
  );
}

export async function deleteAllNotes(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete notes: database not available");
    return;
  }

  await db.delete(notes).where(eq(notes.userId, userId));
}

export async function saveTelegramMessage(
  userId: number,
  telegramChatId: string,
  telegramMessageId: number,
  messageText: string | null,
  messageType: string = "text"
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save message: database not available");
    return;
  }

  await db.insert(telegramMessages).values({
    userId,
    telegramChatId,
    telegramMessageId,
    messageText,
    messageType,
  });
}
