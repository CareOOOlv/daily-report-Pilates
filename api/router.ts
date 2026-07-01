import { createRouter, publicQuery } from "./middleware";
import { dailyRouter } from "./dailyRouter";
import { weeklyRouter } from "./weeklyRouter";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  daily: dailyRouter,
  weekly: weeklyRouter,
});

export type AppRouter = typeof appRouter;
