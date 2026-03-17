
import { customAlphabet } from 'nanoid';

// Standard NanoID alphabet used in SQL schema (Clean: alphanumeric only)
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const SIZE = 12;

/**
 * Generates a NanoID compatible with Shimokitan's database schema.
 * Default size: 12 chars.
 */
export const nanoid = customAlphabet(ALPHABET, SIZE);
