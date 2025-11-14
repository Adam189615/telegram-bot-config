import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getBotConfigByUserId, upsertBotConfig, getNotesByUserId, addNote, deleteAllNotes, searchNotes } from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  bot: router({
    getConfig: protectedProcedure.query(async ({ ctx }) => {
      return await getBotConfigByUserId(ctx.user.id);
    }),
    saveConfig: protectedProcedure
      .input(
        z.object({
          botToken: z.string().min(1, "Bot token is required"),
          webhookUrl: z.string().url("Invalid webhook URL"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await upsertBotConfig(ctx.user.id, input.botToken, input.webhookUrl);
        return { success: true, message: "Bot configuration saved successfully" };
      }),
  }),

  notes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getNotesByUserId(ctx.user.id);
    }),
    add: protectedProcedure
      .input(
        z.object({
          content: z.string().min(1, "Note content is required"),
          telegramChatId: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await addNote(ctx.user.id, input.telegramChatId, input.content);
        return { success: true, message: "Note added successfully" };
      }),
    delete: protectedProcedure.mutation(async ({ ctx }) => {
      await deleteAllNotes(ctx.user.id);
      return { success: true, message: "All notes deleted successfully" };
    }),
    search: protectedProcedure
      .input(
        z.object({
          query: z.string().min(1, "Search query is required"),
        })
      )
      .query(async ({ ctx, input }) => {
        return await searchNotes(ctx.user.id, input.query);
      }),
  }),
});

export type AppRouter = typeof appRouter;
