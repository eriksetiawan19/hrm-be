import { z } from "zod";
import { invalidEmailMessage, requiredMessage } from "../../utils/constant";

const requiredOr = (message: string) => (issue: { input: unknown }) =>
  issue.input === undefined || issue.input === "" ? requiredMessage : message;

export const loginSchema = z.object({
  email: z.email({ error: requiredOr(invalidEmailMessage) }),
  password: z.string({ error: requiredMessage }).min(1, requiredMessage),
});

export type LoginInput = z.infer<typeof loginSchema>;
