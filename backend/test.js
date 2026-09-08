import "dotenv/config";
console.log("SMTP_HOST:", process.env.SMTP_HOST);
console.log("SMTP_PORT:", process.env.SMTP_PORT);
console.log("SMTP_USER:", process.env.SMTP_USER);

import { sendVerificationEmail } from "./src/utils/email.util.js";

sendVerificationEmail("sks788056@gmail.com", "Sagar", "123456")
  .then(() => console.log("Email sent ✅"))
  .catch((err) => console.error("Email failed ❌", err));