import { argon2idAsync } from "@noble/hashes/argon2";

export const PASSWORD_MIN_LEN = 12;
export const PASSWORD_MAX_LEN = 256;

const ARGON_T = 3;
const ARGON_M = 65536; // 64 MiB
const ARGON_P = 1;
const ARGON_V = 19;
const SALT_BYTES = 16;
const HASH_BYTES = 32;

const FORMAT_PREFIX = `argon2id$v=${ARGON_V}$m=${ARGON_M},t=${ARGON_T},p=${ARGON_P}$`;

function toB64(u8: Uint8Array): string {
  return Buffer.from(u8).toString("base64");
}

function fromB64(s: string): Uint8Array {
  return new Uint8Array(Buffer.from(s, "base64"));
}

function peppered(plain: string, pepper: string): Uint8Array {
  return new TextEncoder().encode(`${pepper}$${plain}`);
}

export async function hashPassword(plain: string, pepper: string): Promise<string> {
  if (plain.length < PASSWORD_MIN_LEN) throw new Error("password too short");
  if (plain.length > PASSWORD_MAX_LEN) throw new Error("password too long");
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await argon2idAsync(peppered(plain, pepper), salt, {
    t: ARGON_T,
    m: ARGON_M,
    p: ARGON_P,
    dkLen: HASH_BYTES,
  });
  return `${FORMAT_PREFIX}${toB64(salt)}$${toB64(hash)}`;
}

export async function verifyPassword(
  plain: string,
  stored: string,
  pepper: string,
): Promise<boolean> {
  if (typeof stored !== "string" || !stored.startsWith(FORMAT_PREFIX)) return false;
  const tail = stored.slice(FORMAT_PREFIX.length);
  const parts = tail.split("$");
  if (parts.length !== 2) return false;
  const [saltB64, hashB64] = parts;
  let salt: Uint8Array;
  let expected: Uint8Array;
  try {
    salt = fromB64(saltB64);
    expected = fromB64(hashB64);
  } catch {
    return false;
  }
  if (salt.length !== SALT_BYTES || expected.length !== HASH_BYTES) return false;

  const actual = await argon2idAsync(peppered(plain, pepper), salt, {
    t: ARGON_T,
    m: ARGON_M,
    p: ARGON_P,
    dkLen: HASH_BYTES,
  });
  return timingSafeEqualU8(actual, expected);
}

function timingSafeEqualU8(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// Pre-computed dummy hash (never matches a real password) so login routes can
// run verifyPassword against a constant when the user lookup misses, keeping
// the timing signature identical.
export const DUMMY_HASH = `${FORMAT_PREFIX}${toB64(new Uint8Array(SALT_BYTES))}$${toB64(new Uint8Array(HASH_BYTES))}`;
