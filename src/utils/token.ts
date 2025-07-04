import { customAlphabet } from "nanoid";

export const makeToken = (length: number): string => {
  // Handle zero length case to prevent hanging
  if (length <= 0) {
    return '';
  }
  
  const characters = "1234567890abcdefghijklmnopqrstuvwxyz";
  const nanoid = customAlphabet(characters, length);
  return nanoid();
};
