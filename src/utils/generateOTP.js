import { randomInt } from "node:crypto";

const generateOTP = () => {
  return randomInt(100000, 1000000).toString();
};

export { generateOTP };
