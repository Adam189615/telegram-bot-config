import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getBotConfigByUserId, upsertBotConfig } from "./db";

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
});

export type AppRouter = typeof appRouter;
