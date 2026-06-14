import { Resend } from 'resend';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  console.log("Sending email...");
  const { data, error } = await resend.emails.send({
    from: 'Octaraa Assistant <onboarding@resend.dev>',
    to: 'pinewoodarchit@gmail.com',
    subject: `Test PDF Email`,
    text: `Test body`,
    attachments: [
      {
        filename: `Test.txt`,
        content: Buffer.from("Hello world").toString('base64'),
      },
    ],
  });
  console.log("Data:", data);
  console.log("Error:", error);
}

testEmail();
