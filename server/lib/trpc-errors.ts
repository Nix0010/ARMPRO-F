import { TRPCError } from "@trpc/server";

export function notFound(message: string) {
  return new TRPCError({ code: "NOT_FOUND", message });
}

export function badRequest(message: string) {
  return new TRPCError({ code: "BAD_REQUEST", message });
}
