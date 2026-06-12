import fs from 'fs';
import path from 'path';

const faqs = `
## What is Octaraa and how does it help families?
Octaraa is a family-centric financial planning platform that helps you manage, track, and grow your entire family's wealth in one place with smart tools.

## How is Octaraa different from other financial platforms?
Unlike traditional platforms, Octaraa focuses on family-based financial management, allowing you to manage finances for your spouse, parents, and children from a single unified dashboard.

## Can I manage my entire family's finances on Octaraa?
Yes, Octaraa allows you to manage investments, track goals, and monitor financial progress for all family members in one place.

## Is Octaraa suitable for young families in India?
Absolutely, Octaraa is designed specifically for young families in India to help them plan finances, manage financial goals, and build long-term wealth efficiently.

## What features does Octaraa offer?
Octaraa provides family wealth management, financial calculators, AI-powered financial assistant Samaira AI, goal-based planning.

## How does Octaraa's AI (Samaira AI) help users?
Octaraa's Samaira AI, is a financial assistant which helps you learn financial concepts. Samaira AI was created specifically to enhance financial literacy in India.

## Are Octaraa's financial calculators useful for planning?
Yes, Octaraa's financial calculators help users plan investments, estimate returns, and achieve financial goals with better accuracy.

## Is my data secure on Octaraa?
Yes, Octaraa uses advanced security and encryption technologies to ensure your financial data remains safe and protected. Octaraa is hosted on the Google Cloud Platform which is safe, secure & reliable.

## Do I need financial knowledge to use Octaraa?
No, Octaraa is beginner-friendly and offers financial calculators & Samaira AI, our financial literacy bot, to help users manage finances easily.

## How can Octaraa help me achieve my family's financial goals?
Octaraa helps you set clear financial goals and track progress, to build and grow your family's wealth over time.
`;

const outputPath = path.join(__dirname, '../octaraa-kb-seed.md');
fs.appendFileSync(outputPath, '\n\n' + faqs.trim() + '\n\n');
console.log('Appended FAQs to octaraa-kb-seed.md');
