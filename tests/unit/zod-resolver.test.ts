import { describe, expect, it } from "vitest";
import { z } from "zod";
import { zodResolver } from "@/lib/zod-resolver";

const schema = z.object({ name: z.string().trim().min(2, "Too short"), age: z.coerce.number() });
const resolve = (values: unknown) =>
  // The resolver ignores react-hook-form's context and options for flat forms.
  zodResolver(schema)(values as never, undefined, {} as never);

describe("zodResolver", () => {
  it("returns parsed (output) values when valid", async () => {
    expect(await resolve({ name: "  Ada ", age: "36" })).toEqual({
      values: { name: "Ada", age: 36 },
      errors: {},
    });
  });

  it("returns the first message per field when invalid", async () => {
    const result = await resolve({ name: "A", age: "36" });
    expect(result.values).toEqual({});
    expect(result.errors).toMatchObject({ name: { message: "Too short" } });
  });
});
