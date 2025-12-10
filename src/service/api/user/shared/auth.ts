import bcrypt from "bcrypt";

export const checkPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

