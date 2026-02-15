import { initTRPC, TRPCError } from "@trpc/server";
import SuperJSON from "superjson";
import { z } from "zod";
import { and, createDbWithUrl, desc, eq, tasks } from "@starter/db";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: SuperJSON,
});

const router = t.router;
const publicProcedure = t.procedure;

const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const userId = ctx.session?.user?.id;
  if (!userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      ...ctx,
      userId: String(userId),
    },
  });
});

type ProtectedContext = Context & { userId: string };

function dbFromCtx(ctx: Context) {
  const url = ctx.env.HYPERDRIVE?.connectionString ?? ctx.env.DATABASE_URL;
  if (!url) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database URL is not configured." });
  }
  return createDbWithUrl(url);
}

export const appRouter = router({
  health: publicProcedure.query(() => ({ ok: true })),

  system: router({
    now: publicProcedure.query(() => {
      const now = new Date();
      return {
        nowIso: now.toISOString(),
        unixMs: now.getTime(),
      };
    }),
  }),

  auth: router({
    me: protectedProcedure.query(({ ctx }) => {
      return {
        userId: String(ctx.session!.user.id),
        email: ctx.session!.user.email,
        name: ctx.session!.user.name ?? null,
      };
    }),
  }),

  tasks: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = dbFromCtx(ctx);
      const userId = (ctx as ProtectedContext).userId;
      const rows = await db
        .select()
        .from(tasks)
        .where(eq(tasks.userId, userId))
        .orderBy(desc(tasks.updatedAt))
        .limit(100);

      return { ok: true, tasks: rows };
    }),

    create: protectedProcedure
      .input(z.object({ title: z.string().min(1).max(255) }))
      .mutation(async ({ input, ctx }) => {
        const db = dbFromCtx(ctx);
        const now = new Date();
        const row = {
          id: crypto.randomUUID(),
          userId: (ctx as ProtectedContext).userId,
          title: input.title.trim(),
          status: "todo" as const,
          createdAt: now,
          updatedAt: now,
        };

        await db.insert(tasks).values(row);
        return { ok: true, task: row };
      }),

    patchStatus: protectedProcedure
      .input(
        z.object({
          id: z.string().min(1),
          status: z.enum(["todo", "doing", "done"]),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const db = dbFromCtx(ctx);
        const userId = (ctx as ProtectedContext).userId;

        await db
          .update(tasks)
          .set({ status: input.status, updatedAt: new Date() })
          .where(and(eq(tasks.id, input.id), eq(tasks.userId, userId)));

        const [row] = await db
          .select()
          .from(tasks)
          .where(and(eq(tasks.id, input.id), eq(tasks.userId, userId)))
          .limit(1);

        return { ok: true, task: row ?? null };
      }),
  }),
});

export type AppRouter = typeof appRouter;
