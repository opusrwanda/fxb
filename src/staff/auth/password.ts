import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

/**
 * Password hashing, on Node's own scrypt.
 *
 * scrypt rather than a plain hash because it is deliberately slow and
 * deliberately memory-hungry: the cost of trying a stolen hash against a
 * dictionary is what protects a password somebody has reused elsewhere, and a
 * fast hash gives an attacker millions of guesses a second.
 *
 * Node ships it, so there is no dependency here — this is the same primitive
 * bcrypt and argon2 libraries exist to provide.
 */

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

/** `salt:hash`, both hex. Stored as one string in `users.password_hash`. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

/**
 * Check a password against a stored hash.
 *
 * `timingSafeEqual` rather than `===`: comparing two buffers byte by byte
 * returns faster the earlier it finds a difference, and that difference is
 * measurable over the network. It leaks the hash one byte at a time to anyone
 * patient enough to measure it.
 */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const derived = await scryptAsync(password, salt, expected.length);

  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
