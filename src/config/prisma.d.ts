import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import type { Prisma } from "../generated/prisma/client.js";
export declare const prisma: PrismaClient<{
    adapter: PrismaPg;
    log: ({
        level: "warn";
        emit: "event";
    } | {
        level: "error";
        emit: "event";
    })[];
}, "warn" | "error", import("../generated/prisma/runtime/client.js").DefaultArgs>;
export declare const prismaAuthBypass: PrismaClient<{
    adapter: PrismaPg;
    log: {
        level: "error";
        emit: "event";
    }[];
}, "error", import("../generated/prisma/runtime/client.js").DefaultArgs>;
export declare function withTenantTransaction<T>(municipioId: string, fn: (tx: Prisma.TransactionClient) => Promise<T>, options?: {
    timeout?: number;
    maxWait?: number;
}): Promise<T>;
//# sourceMappingURL=prisma.d.ts.map