import * as fs from 'fs';
import * as path from 'path';

const rawQAList = [
  {
    q: "What is Octaraa?",
    a: "Octaraa is a family-centric financial planning platform that helps you manage, track, and grow your entire family's wealth in one place using smart tools."
  },
  {
    q: "Who is Octaraa designed for?",
    a: "Octaraa is designed specifically for young families in India to help them plan finances, manage financial goals, and build long-term wealth efficiently."
  },
  {
    q: "How is Octaraa different from other financial platforms?",
    a: "Unlike traditional platforms, Octaraa focuses on family-based financial management, allowing you to manage finances for your spouse, parents, and children from a single unified dashboard."
  },
  {
    q: "Can I manage my entire family's finances on Octaraa?",
    a: "Yes, Octaraa allows you to manage investments, track goals, and monitor financial progress for all family members in one place."
  },
  {
    q: "What features does Octaraa offer?",
    a: "Octaraa provides family wealth management, financial calculators, an AI-powered financial assistant (Samaira AI), and goal-based financial planning."
  },
  {
    q: "Do I need financial knowledge to use Octaraa?",
    a: "No, Octaraa is beginner-friendly. It offers financial calculators and Samaira AI, a financial literacy bot, to help users manage finances easily."
  },
  {
    q: "How can Octaraa help me achieve my family's financial goals?",
    a: "Octaraa helps you set clear financial goals and track progress to build and grow your family's wealth over time."
  },
  {
    q: "Is Octaraa suitable for young families in India?",
    a: "Absolutely. Octaraa is designed specifically for young families in India to help them plan finances and build long-term wealth efficiently."
  },
  {
    q: "What is Samaira AI?",
    a: "Samaira AI is Octaraa's AI-powered financial assistant that helps users learn financial concepts. It was created specifically to enhance financial literacy in India."
  },
  {
    q: "What can Samaira AI help me with?",
    a: "Samaira AI helps you understand financial concepts, guides you through the platform, and assists with managing your finances even if you have no prior financial knowledge."
  },
  {
    q: "Is my financial data safe on Octaraa?",
    a: "Yes, Octaraa uses advanced security and encryption technologies to ensure your financial data remains safe and protected. Octaraa is hosted on the Google Cloud Platform, which is safe, secure, and reliable."
  },
  {
    q: "What security does Octaraa use to protect my data?",
    a: "Octaraa protects your financial data with bank-grade encryption and strict privacy controls, hosted on Google Cloud Platform."
  },
  {
    q: "What is a Fixed Deposit (FD)?",
    a: "A Fixed Deposit is a bank investment where you lock in money for a set time at a fixed interest rate, earning guaranteed returns over the tenure."
  },
  {
    q: "What is DICGC and how does it relate to Fixed Deposits?",
    a: "DICGC (Deposit Insurance and Credit Guarantee Corporation) is a division of RBI under the Ministry of Finance. It provides insurance coverage up to ₹5 Lakh per depositor per bank across all existing accounts, including principal and interest amounts against fixed deposit accounts."
  },
  {
    q: "How much insurance coverage does DICGC provide for FDs?",
    a: "DICGC provides insurance coverage up to ₹5 Lakh per depositor per bank. This covers both principal and interest amounts."
  },
  {
    q: "Can I book a Fixed Deposit on Octaraa?",
    a: "Yes, you can book a Fixed Deposit directly through the Octaraa platform using the \"Book FD\" option on the dashboard or via the Fixed Deposits section."
  },
  {
    q: "What is the difference between Simple Interest and Compound Interest on an FD?",
    a: "Simple Interest is calculated only on the principal amount, while Compound Interest (typically quarterly on FDs) is calculated on the principal plus accumulated interest, resulting in higher returns over time."
  },
  {
    q: "What is the Goals feature on Octaraa?",
    a: "The Goals feature allows you to set specific financial targets for yourself and your family members, track savings progress, and monitor how close you are to achieving each goal."
  },
  {
    q: "Can I set separate goals for different family members?",
    a: "Yes, Octaraa lets you set and track individual goals for each family member (e.g., Self, Spouse, Children) and view progress separately."
  },
  {
    q: "How do I add a new financial goal on Octaraa?",
    a: "On the Goals page, click the \"+ Add New Goal\" button to create a new financial goal by entering the target amount and other details."
  },
  {
    q: "How do I add family members on Octaraa?",
    a: "On the dashboard, click the \"+ Add Members\" button under \"Add your Family\" to add family members so Octaraa can suggest personalized investment plans."
  },
  {
    q: "Why should I add my family members on Octaraa?",
    a: "By adding your family members, Octaraa can suggest personalized investment plans and allow you to manage and track finances for your entire family from one place."
  },
  {
    q: "What is the Family Tree feature on Octaraa?",
    a: "The Family Tree feature lets you visualize and manage your family structure, linking financial profiles and goals to individual members."
  },
  {
    q: "What does the \"My Investments\" section show?",
    a: "The My Investments section shows your total invested amount, current value, current gains, investment details (holdings by type, issuer, FD count), and investment breakdown by category."
  },
  {
    q: "What types of investments can I track on Octaraa?",
    a: "You can track Fixed Deposits and Mutual Fund investments. The platform shows holding type, issuer, FD count, investment amount, interest amount, and total category investments."
  },
  {
    q: "What financial calculators does Octaraa offer?",
    a: "Octaraa offers 14 calculators: College Cost, SIP Calculator, Step Up SIP, Lumpsum, Target Amount SIP, Cost of Delay, Education Loan EMI, Fixed Deposits, Recurring Deposits, SWP Calculator, XIRR Calculator, Sukanya Samriddhi Yojana, PPF Calculator, and Retirement Calculator."
  },
  {
    q: "Are Octaraa's financial calculators useful for planning?",
    a: "Yes, Octaraa's financial calculators help users plan investments, estimate returns, and achieve financial goals with better accuracy."
  },
  {
    q: "What is a SIP Calculator?",
    a: "A SIP (Systematic Investment Plan) Calculator helps you calculate returns on your systematic monthly investments to track progress towards financial goals."
  },
  {
    q: "What inputs does the SIP Calculator need?",
    a: "It requires: Monthly Investment Amount (₹), Expected Annual Return (%), and Investment Period (Years). It then shows Total Invested, Estimated Returns, and Maturity Value."
  },
  {
    q: "If I invest ₹5,000/month for 10 years at 12% annual return, what will my SIP grow to?",
    a: "You can use the SIP Calculator on Octaraa. Based on the formula, the maturity value would be approximately ₹11.5 lakhs (as shown in the default example of ₹5,000/month for 10 years at 12%)."
  },
  {
    q: "What is a Step Up SIP?",
    a: "A Step Up SIP (also called Top Up SIP) projects investment growth with yearly contribution increases to maximize returns over time. You increase your SIP amount by a fixed percentage every year."
  },
  {
    q: "What inputs does the Step Up SIP Calculator need?",
    a: "It requires: Initial Monthly SIP (₹), Yearly Step Up (%), Expected Annual Return (%), and Investment Period (Years)."
  },
  {
    q: "What is a Lumpsum Calculator?",
    a: "A Lumpsum Calculator estimates potential returns on a one-time investment to help you plan your financial strategy effectively."
  },
  {
    q: "What inputs does the Lumpsum Calculator need?",
    a: "It requires: Investment Amount (₹), Expected Annual Return (%), and Investment Period (Years). It shows Estimated Returns and Maturity Value."
  },
  {
    q: "What is a Target Amount SIP Calculator?",
    a: "It helps you determine the monthly SIP amount required to achieve a specific financial target goal."
  },
  {
    q: "How does the Target Amount SIP Calculator work?",
    a: "You input your Target Amount (₹), Expected Annual Return (%), and Investment Period (Years), and it calculates the exact monthly SIP you need to start to hit that goal."
  },
  {
    q: "What is the Cost of Delay Calculator?",
    a: "It helps you understand the financial impact of delaying your investments — showing how much less you earn if you start investing later versus starting now."
  },
  {
    q: "What does the Cost of Delay Calculator show?",
    a: "It compares the maturity value \"If you start now\" vs. \"If you delay\" by a certain number of years, and shows the \"Cost of Delay\" — the money you lose by waiting."
  },
  {
    q: "What is the Education Loan EMI Calculator?",
    a: "It calculates the monthly EMI payments for education loans to help you plan your repayment schedule accurately."
  },
  {
    q: "What inputs does the Education Loan EMI Calculator need?",
    a: "It needs: Loan Amount (₹), Interest Rate (% per annum), and Loan Tenure (Years). It shows Monthly EMI, Total Interest, and Total Amount payable."
  },
  {
    q: "What does the Fixed Deposit Calculator show?",
    a: "It estimates returns on fixed deposits under both Simple Interest and Compound Interest (Quarterly) methods, showing Interest Earned and Maturity Amount for each."
  },
  {
    q: "What inputs does the FD Calculator need?",
    a: "It requires: Principal Amount (₹), Interest Rate (% per annum), and Tenure (Years)."
  },
  {
    q: "What is a Recurring Deposit Calculator?",
    a: "It calculates the growth on recurring deposits to optimize your savings and achieve financial goals."
  },
  {
    q: "What inputs does the RD Calculator need?",
    a: "It requires: Monthly Deposit (₹), Interest Rate (% per annum), and Tenure (Years). It shows Total Deposited, Interest Earned, and Maturity Amount."
  },
  {
    q: "What is SWP?",
    a: "SWP stands for Systematic Withdrawal Plan. It allows you to withdraw a fixed amount at regular intervals from your mutual fund investments — essentially the reverse of a SIP."
  },
  {
    q: "Who should use an SWP?",
    a: "SWP is best suited for retirees needing regular income, individuals with a lump sum investment seeking steady cash flow, and those looking for tax-efficient withdrawal options."
  },
  {
    q: "What does the SWP Calculator show?",
    a: "It shows Total Investment, Total Withdrawn, Final Value remaining in the corpus, and Total Returns Earned based on your inputs of total investment, monthly withdrawal amount, expected return, and time period."
  },
  {
    q: "Is SWP tax-efficient?",
    a: "Yes, SWPs from equity funds can be more tax-efficient than traditional dividend plans because only the capital gains portion of each withdrawal is taxed, not the entire withdrawal amount."
  },
  {
    q: "What is the XIRR Calculator?",
    a: "The XIRR Calculator calculates annualised returns on investments with multiple cash flows, making it ideal for SIPs and staggered investments."
  },
  {
    q: "What is XIRR?",
    a: "XIRR (Extended Internal Rate of Return) is a method to calculate annualized returns when you have multiple investments made at different times (like a SIP), providing a more accurate return figure than simple CAGR."
  },
  {
    q: "What is Sukanya Samriddhi Yojana?",
    a: "Sukanya Samriddhi Yojana (SSY) is a government-backed savings scheme designed to secure a girl child's financial future. It currently offers an interest rate of 8.2% p.a."
  },
  {
    q: "What is the current SSY interest rate on Octaraa?",
    a: "The current SSY interest rate shown on Octaraa is 8.2% p.a."
  },
  {
    q: "What is the maximum annual investment in SSY?",
    a: "The maximum yearly investment in SSY is ₹1,50,000. The minimum is ₹250 per year."
  },
  {
    q: "What are the tax benefits of SSY?",
    a: "SSY follows the EEE (Exempt-Exempt-Exempt) structure — deposits up to ₹1,50,000/year qualify for Section 80C deduction, and both interest earned and maturity amount are fully tax-exempt."
  },
  {
    q: "What is the age eligibility for opening an SSY account?",
    a: "The girl child must be 10 years old or below to open an SSY account."
  },
  {
    q: "What is a PPF Calculator?",
    a: "The PPF (Public Provident Fund) Calculator helps you calculate returns on your PPF investments to plan for long-term financial goals with tax benefits."
  },
  {
    q: "What is the current PPF interest rate on Octaraa?",
    a: "The current PPF interest rate shown on Octaraa is 7.1% p.a."
  },
  {
    q: "What inputs does the PPF Calculator need?",
    a: "It requires: Yearly Investment (₹), Time Period (Years), and Rate of Interest (%). It shows Total Investment, Total Interest Earned, and Maturity Value."
  },
  {
    q: "What is the Retirement Calculator on Octaraa?",
    a: "It helps you plan your retirement corpus and calculate the monthly savings needed to retire comfortably, factoring in your age, expenses, retirement age, lifestyle, and investment strategy."
  },
  {
    q: "What inputs does the Retirement Calculator need?",
    a: "It needs: Current Age, Monthly Expenses (₹), Retirement Age, Retirement Lifestyle (Like a King / I Am Happy / Like a Monk), and Investment Strategy (Safe – PF/FD at 8% p.a., or Aggressive – MF/Equity at higher returns)."
  },
  {
    q: "What inflation rate does the Retirement Calculator assume?",
    a: "The Retirement Calculator assumes an inflation rate of 5% p.a."
  },
  {
    q: "What is the College Cost Calculator?",
    a: "It estimates the future cost of education by factoring in inflation, so you can plan your investments accordingly to meet your child's education expenses."
  },
  {
    q: "What inputs does the College Cost Calculator need?",
    a: "It needs: Current Annual Fees (₹), Expected Inflation Rate (%), and Years Until Admission. It shows the Future Fees and the monthly SIP needed to achieve that target (assuming 12% annual returns)."
  },
  {
    q: "By how much does education cost typically increase per year?",
    a: "As per an Economic Times survey cited on Octaraa, the cost of education increases by approximately 10% every year."
  },
  {
    q: "What is a SIP (Systematic Investment Plan)?",
    a: "A SIP is a method of investing a fixed amount regularly (usually monthly) in mutual funds. It helps build wealth over time through the power of compounding and rupee cost averaging."
  },
  {
    q: "What is a Lumpsum investment?",
    a: "A lumpsum investment is a one-time, large investment made in a financial product, as opposed to periodic SIP investments."
  },
  {
    q: "What is compounding in investments?",
    a: "Compounding means earning returns not just on your principal but also on the previously earned interest/returns. Over time, this \"interest on interest\" effect can significantly grow your wealth."
  },
  {
    q: "What is Rupee Cost Averaging?",
    a: "Rupee Cost Averaging is the benefit of investing a fixed amount regularly (SIP). When markets are down, you buy more units; when markets are up, you buy fewer — averaging out the cost per unit over time."
  },
  {
    q: "What is PPF (Public Provident Fund)?",
    a: "PPF is a long-term government-backed savings scheme in India that currently offers 7.1% p.a. interest with tax-exempt status under EEE. It's ideal for risk-averse, long-term investors."
  },
  {
    q: "What is the difference between FD and RD?",
    a: "A Fixed Deposit (FD) requires a one-time lump sum deposit at a fixed interest rate for a fixed tenure. A Recurring Deposit (RD) allows you to deposit a fixed amount every month for a set tenure, earning similar interest rates."
  },
  {
    q: "What is CAGR?",
    a: "CAGR (Compound Annual Growth Rate) is the rate at which an investment grows annually over a specified period, assuming the profits are reinvested each year."
  },
  {
    q: "What is Section 80C in income tax?",
    a: "Section 80C of the Income Tax Act allows Indian taxpayers to claim deductions up to ₹1,50,000 per year on specified investments such as PPF, SSY, ELSS, life insurance premiums, and more."
  },
  {
    q: "What does EEE mean in the context of investments?",
    a: "EEE stands for Exempt-Exempt-Exempt. It means the investment, the interest earned, and the maturity amount are all tax-exempt. PPF and SSY are examples of EEE instruments."
  },
  {
    q: "What is Net Asset Value (NAV)?",
    a: "NAV is the per-unit price of a mutual fund scheme. It is calculated as (Total Assets – Total Liabilities) / Total Number of Units. You buy and sell mutual fund units at the NAV price."
  },
  {
    q: "What is a corpus in financial planning?",
    a: "A corpus refers to the total accumulated fund/amount you aim to build over time to meet a specific financial goal, such as retirement, a child's education, etc."
  },
  {
    q: "How can I contact Octaraa?",
    a: "You can reach Octaraa via WhatsApp at +91 9667708843 or use the WhatsApp chat button available on every page of the platform."
  },
  {
    q: "What is the profile completion on Octaraa?",
    a: "When you sign up, Octaraa prompts you to complete your profile. A complete profile (100%) enables Octaraa to provide more personalized investment plans and recommendations."
  },
  {
    q: "What is the dashboard on Octaraa?",
    a: "The dashboard is your home screen on Octaraa. It displays key highlights such as your Fixed Deposit info, financial Goals overview, data security status, and quick actions like booking an FD or adding family members."
  },
  {
    q: "What is the current date shown on the Octaraa dashboard?",
    a: "The dashboard displays today's date — for example, \"Monday, Jun 15, 2026.\""
  }
];

function normalize(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/what's/g, 'what is')
    .replace(/how's/g, 'how is')
    .replace(/where's/g, 'where is')
    .replace(/who's/g, 'who is')
    .replace(/it's/g, 'it is')
    .replace(/i'm/g, 'i am')
    .replace(/i've/g, 'i have')
    .replace(/i'd/g, 'i would')
    .replace(/don't/g, 'do not')
    .replace(/doesn't/g, 'does not')
    .replace(/can't/g, 'cannot')
    .replace(/won't/g, 'will not')
    .replace(/isn't/g, 'is not')
    .replace(/aren't/g, 'are not')
    .replace(/there's/g, 'there is')
    .replace(/that's/g, 'that is')
    .replace(/[?.,\/#!$%\^&\*;:{}=\-_`~()'"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function main() {
  const codeLines: string[] = [];
  codeLines.push("// This file is auto-generated by scratch-generate-answers.ts");
  codeLines.push("export const CURATED_DICTIONARY: Record<string, string> = {");
  
  for (const item of rawQAList) {
    const norm = normalize(item.q);
    codeLines.push(`  ${JSON.stringify(norm)}: ${JSON.stringify(item.a)},`);
  }
  
  codeLines.push("};");
  
  const outputPath = path.join(__dirname, 'src', 'lib', 'curated-answers-dict.ts');
  fs.writeFileSync(outputPath, codeLines.join('\n') + '\n');
  console.log(`Successfully generated curated-answers-dict.ts at ${outputPath}`);
}

main();
