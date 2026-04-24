import { describe, expect, test } from "bun:test";

import { DUMMY_HASH, hashPassword, verifyPassword } from "./password";

const PEPPER = "test-pepper-1234567890-abcd";

describe("password", () => {
  test("hash + verify round trip", async () => {
    const stored = await hashPassword("correct-horse-battery", PEPPER);
    expect(stored.startsWith("argon2id$v=19$m=65536,t=3,p=1$")).toBe(true);
    expect(await verifyPassword("correct-horse-battery", stored, PEPPER)).toBe(true);
  });

  test("wrong password fails", async () => {
    const stored = await hashPassword("correct-horse-battery", PEPPER);
    expect(await verifyPassword("nope-nope-nope-1", stored, PEPPER)).toBe(false);
  });

  test("pepper mismatch fails", async () => {
    const stored = await hashPassword("correct-horse-battery", PEPPER);
    expect(await verifyPassword("correct-horse-battery", stored, "other-pepper-xyz")).toBe(false);
  });

  test("malformed stored string rejects", async () => {
    expect(await verifyPassword("anything-goes1", "not-a-hash", PEPPER)).toBe(false);
    expect(await verifyPassword("anything-goes1", "argon2id$v=19$x", PEPPER)).toBe(false);
  });

  test("DUMMY_HASH never matches a real password", async () => {
    expect(await verifyPassword("anything-goes1", DUMMY_HASH, PEPPER)).toBe(false);
  });

  test("hashPassword rejects short passwords", async () => {
    await expect(hashPassword("short", PEPPER)).rejects.toThrow();
  });
});
