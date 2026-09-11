import { z } from "zod";

export const dashboardDireccaoQuerySchema = z.object({
  direcaoId: z.string().uuid().optional(), 
});

export type DashboardDireccaoQuery = z.infer<typeof dashboardDireccaoQuerySchema>;