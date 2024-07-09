import { customAlphabet } from "nanoid";

export const makeToken = (length: number): string => {
  const characters = "1234567890abcdefghijklmnopqrstuvwxyz";
  const nanoid = customAlphabet(characters, length);
  return nanoid();
};
