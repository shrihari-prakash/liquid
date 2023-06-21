const getRandomLetters = (length = 1) =>
  Array(length)
    .fill(0)
    .map((e) => String.fromCharCode(Math.floor(Math.random() * 26) + 65))
    .join("");

const getRandomDigits = (length = 1) =>
  Array(length)
    .fill(0)
    .map((e) => Math.floor(Math.random() * 10))
    .join("");

export const generateInviteCode = () => {
  return `${getRandomLetters(2)}-${getRandomDigits(4)}-${Date.now()}`;
};
