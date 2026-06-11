import fs from 'fs';
import path from 'path';

const faqs = `
## What is Octaraa and how does it help families?
Octaraa is a family wealth platform that emphasizes goal-based financial planning. It helps families manage investments, plan for milestones, and build financial literacy together.

## How is Octaraa different from other financial platforms?
Octaraa offers a unique Family Tree feature, unified multi-generation accounts, goal-based family planning, and gamified learning, making it deeply family-centric rather than individual-focused.

## Can I manage my entire family's finances on Octaraa?
Yes, using the Family Tree feature and Family Wealth Dashboard, you can manage the investments of your spouse, parents, and children from a single, unified account.

## Is Octaraa suitable for young families in India?
Absolutely! Octaraa is designed specifically to empower young Indian families to plan, invest, and achieve their financial goals easily.

## What features does Octaraa offer?
Octaraa offers goal-based planning, the Family Tree for unified management, Smart Tax Harvesting, Financial Calculators, Gamified Learning, and Ask Samaira AI.

## How does Octaraa's AI (Samaira AI) help users?
From portfolio queries to financial concepts, Samaira AI provides instant, unbiased answers, personalized insights, and helps you learn and grow your financial knowledge.

## Are Octaraa's financial calculators useful for planning?
Yes, they allow you to plan your family's goals with confidence using AI-powered tools, including predicting the rising cost of your child's education.

## Is my data secure on Octaraa?
Octaraa employs bank-grade security and encryption to ensure your family's financial data and sensitive information are completely secure and private.

## Do I need financial knowledge to use Octaraa?
Not at all. Octaraa provides gamified learning with interactive quizzes, certifications, and Samaira AI to help you build financial knowledge as you go.

## How can Octaraa help me achieve my family's financial goals?
Octaraa offers goal-based, risk-aware portfolios built for long-term wealth creation, and automates processes like Smart Tax Harvesting to keep you on track.
`;

const outputPath = path.join(__dirname, '../octaraa-kb-seed.md');
fs.appendFileSync(outputPath, '\n\n' + faqs.trim() + '\n\n');
console.log('Appended FAQs to octaraa-kb-seed.md');
