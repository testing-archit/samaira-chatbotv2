import { logger } from './logger';

export function getCuratedAnswer(query: string): string | null {
  const q = query.toLowerCase().trim().replace(/[?.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").replace(/\s+/g, " ");

  // Q1: What is Octaraa
  if (q === "what is octaraa" || q === "what is octaraa and how does it help families") {
    return `**Octaraa** is a family-first wealth platform built for modern Indian families who value clarity, transparency, and long-term financial growth. 

We simplify wealth creation by bringing together investments, financial insights, and planning tools in a unified experience so families can grow, manage, and secure their future together from a single account.

What financial goal are you most excited to plan today?`;
  }

  // Q2: Who is Octaraa designed for
  if (q === "who is octaraa designed for" || q === "is octaraa suitable for young families in india") {
    return `Octaraa is designed specifically for **modern Indian families**—including young families, working professionals, and parents—who want a single, collaborative platform to plan household goals, track investments across multiple family members, and build long-term generational wealth.

Would you like to see how the dashboard helps manage multiple family members?`;
  }

  // Q3: Founder of Octaraa
  if (q.includes("founder") || q.includes("who founded") || q.includes("meet the founder")) {
    return `The founder and CEO of Octaraa is **Vaibhav Jain**. 

Vaibhav built a successful 20-year corporate career working with global technology giants like Oracle, Microsoft, VMware, SAP, and Google Cloud. However, he only started investing in 2019, which led to a deep personal realization about the massive cost of delayed compounding ("India's biggest hidden financial loss"). 

His first step in managing his own money was a setback when a bank advisor, driven by commissions, mis-sold him a ULIP plan he never truly needed. This experience inspired him to build Octaraa—a platform centered on clarity, trust, and family-first guidance, helping young families start investing early and build wealth without confusion or bias.

What family goal are you most excited to plan today?`;
  }

  // Q4: Octaraa's mission
  if (q.includes("mission") || q.includes("vision")) {
    return `Octaraa's mission is:
**"To bring clarity and confidence to every Indian family's financial journey through simple, trusted solutions that help them grow wealth without confusion or bias."**

Would you like to know how Octaraa can help you set a specific financial goal for your family?`;
  }

  // Q5: How is Octaraa different
  if (q.includes("how is octaraa different") || q.includes("different from other")) {
    return `Unlike traditional transactional investment apps, Octaraa is family-centric. 

Key differences include:
- **Family Tree Feature**: Manage and track investments for your spouse, parents, and children collectively.
- **Holistic Wealth Dashboard**: Consolidated view of all assets, even those held elsewhere.
- **Gamified Learning**: Build financial literacy through quizzes, certifications, and a leaderboard.
- **Unbiased Guidance**: Powered by Samaira AI to offer transparent, jargon-free explanations without commission bias.

Would you like to try setting up a family goal with us?`;
  }

  // Q6: Suitable for beginners
  if (q.includes("suitable for beginners") || q.includes("no financial knowledge to use")) {
    return `Yes! Octaraa is highly suitable for beginners. You do not need any prior financial knowledge to use the platform. We offer user-friendly financial calculators, educational blogs, and Samaira AI—our financial literacy bot—to help you learn and manage family finances step-by-step.

Would you like help exploring one of our goal calculators?`;
  }

  // Q7: What does Family Wealth Simplified mean
  if (q.includes("family wealth simplified")) {
    return `**"Family Wealth Simplified"** represents Octaraa's commitment to cutting through financial clutter, eliminating commission bias, and bringing all household assets, calculators, and family goals into a single, transparent, and collaborative platform. It means managing, tracking, and growing your family's financial future together in the simplest way possible.

What would you like to explore next? You can set up your family tree or use a goal calculator.`;
  }

  // Q8: What is the Family Tree feature
  if (q === "what is the family tree feature" || q === "what is family tree" || q.includes("family tree feature")) {
    return `Octaraa’s **Family Tree feature** allows you to manage your entire household's investments—be it spouse, parents, or children—from a single, unified account. It helps you associate specific goals with family members and collaborate on long-term household wealth planning securely.

Would you like to set up a goal for a specific family member?`;
  }

  // Q9: Can I manage my spouse's investments
  if (q.includes("manage my spouse")) {
    return `Yes! You can manage and track your spouse's investments on Octaraa by adding them to your Family Tree dashboard. This allows you to plan joint goals and view combined household wealth.

Would you like to add your spouse to your family tree?`;
  }

  // Q10: How do I add family members
  if (q.includes("how do i add family members") || q.includes("how to add family members")) {
    return `To add family members to your account:
**From the dashboard, click the "+ Add Members" button in the Family Tree section.** Fill in their details (name, relationship, date of birth) and send them an invite to complete their KYC.

Would you like a walkthrough on setting up your first household goal?`;
  }

  // Q11: Can I track my parents' investments
  if (q.includes("track my parents") || q.includes("track parents")) {
    return `Yes! You can track your parents' investments on Octaraa by adding them to the Family Tree dashboard. This lets you monitor their mutual fund folios, fixed deposits, and other assets alongside your own.

Would you like to add a profile for your parents?`;
  }

  // Q12: How many family members
  if (q.includes("how many family members")) {
    return `Octaraa allows you to add all immediate members of your household—including your spouse, children, and parents—to your family tree dashboard. While there is no hard-coded limit specified on the website, the platform is designed to support a standard family household tree.

Would you like to add a family member to your tree today?`;
  }

  // Q13: What is a Holistic Wealth Dashboard
  if (q.includes("holistic wealth dashboard") || q === "holistic wealth dashboard") {
    return `Octaraa's **Holistic Wealth Dashboard** gives you a complete view of your family's net worth by tracking all investments in one place—including those held elsewhere. 

*Note: The dashboard is a tracking and consolidation tool; it does not directly offer automated portfolio rebalancing or smart tax-efficiency moves on the platform.*

What financial goal are you most excited to track with the dashboard?`;
  }

  // Q14: What is Samaira AI
  if (q === "what is samaira ai" || q === "samaira ai" || q.includes("what is samaira ai")) {
    return `**Samaira AI** is Octaraa's proprietary, AI-powered financial assistant. She was created specifically to enhance financial literacy in India, answer questions about personal finance concepts, and guide families through their wealth-planning journey.

What personal finance concept can Samaira explain for you today?`;
  }

  // Q15: How does Samaira AI help me with my investments
  if (q.includes("how does samaira ai help")) {
    return `Samaira AI helps by explaining financial concepts, guiding you through calculators, and helping you organize family financial goals. 

*Note: Samaira's outputs are educational and advisory. They are not a substitute for professional investment advice, and all investment decisions remain your responsibility.*

Would you like to try out one of our SIP calculators?`;
  }

  // Q16: Can Samaira AI give me personalized financial advice
  if (q.includes("personalized financial advice") || q.includes("personalized advice")) {
    return `Samaira AI is an AI-powered financial planning assistant designed for educational guidance, concept explanations, and wealth tracking. She is not a Registered Investment Advisor (RIA). 

To give you a structured educational strategy, I need to collect your household profile details:
- Number of earning members
- Number of dependents
- Total monthly family income
- Monthly surplus after expenses
- Your primary financial goals

Would you like to share these details so I can draft a family wealth strategy for you, or would you prefer to connect with a human expert?`;
  }

  // Q17: Is Samaira AI unbiased
  if (q.includes("unbiased") && q.includes("samaira")) {
    return `Yes, Samaira AI is designed to provide completely unbiased answers and insights. Unlike traditional commission-driven bank advisors, Samaira has no product sales targets or hidden commissions, ensuring you receive transparent financial concept explanations.

What financial goal or calculator would you like to explore next?`;
  }

  // Q18: What kind of questions can I ask Samaira AI
  if (q.includes("what kind of questions") || q.includes("questions can i ask")) {
    return `You can ask Samaira AI about:
- Personal finance concepts (SIP, Lumpsum, Mutual Funds, FD vs RD)
- How to navigate the Octaraa platform (Family Tree, Holistic Dashboard)
- Using our financial planning calculators
- Financial literacy topics, quizzes, and blogs

What question do you have for Samaira today?`;
  }

  // Q19: What types of investments does Octaraa offer
  if (q.includes("types of investments") && q.includes("octaraa")) {
    return `Octaraa currently supports booking secure **Fixed Deposits (FDs)** and **Recurring Deposits (RDs)** with partner banks. 

Other investment types—such as **Mutual Funds** (including SIPs, Step-Up SIPs, and Lumpsum investments), **PPF**, **Sukanya Samriddhi Yojana (SSY)**, and goal-based portfolios—are planned features and are listed as **"coming soon"** on the platform.

Would you like to calculate returns for a Fixed Deposit or explore setting up a family goal?`;
  }

  // Q20: What is a SIP
  if (q === "what is a sip" || q === "what is a systematic investment plan" || (q.includes("sip") && q.includes("what is") && !q.includes("calculator"))) {
    return `A **Systematic Investment Plan (SIP)** is an investment route offered by mutual funds where you invest a fixed amount of money at regular intervals (usually monthly or quarterly) instead of making a one-time lump-sum payment. 

Key benefits include:
- **Rupee Cost Averaging**: You buy more units when prices are low and fewer when prices are high.
- **Disciplined Savings**: Promotes regular investing habits.
- **Power of Compounding**: Regular small investments grow significantly over time.

On Octaraa, mutual fund SIP investments are listed as coming soon. Would you like to use our SIP calculator to estimate potential returns?`;
  }

  // Q20b: How to setup SIP
  if (q.includes("how to setup sip") || q.includes("how to set up a sip") || q.includes("how to invest in sip") || q.includes("start a sip")) {
    return `Currently, direct mutual fund and **SIP investments are listed as "coming soon"** on the Octaraa platform. 

For now, you can book secure Fixed Deposits (FDs) and Recurring Deposits (RDs) with our partner banks, or use our suite of financial calculators to plan and project your future SIP returns.

Would you like to try the SIP Calculator or set up a new family goal?`;
  }

  // Q21: What is goal-based investing
  if (q === "what is goalbased investing" || q === "what is goal based investing") {
    return `**Goal-based investing** is an approach where you invest money specifically aligned to real-life family milestones (like a child's higher education, purchasing a home, or retirement) rather than chasing short-term market returns. It ensures your investments match your target timeline and risk tolerance.

What family goal are you currently planning for?`;
  }

  // Q22: How do I set a financial goal on Octaraa
  if (q.includes("how do i set a financial goal") || q.includes("how to set a financial goal")) {
    return `To set a financial goal on Octaraa:
**Go to the Goals section on your dashboard and click the "+ Add" button.** Choose your goal category (e.g. child's education, retirement), enter your target amount and timeline, and save it to your profile.

Would you like to share your financial details so we can draft a strategy?`;
  }

  // Q23: What is a lumpsum investment
  if (q === "what is a lumpsum investment" || q === "what is lumpsum") {
    return `A **lumpsum investment** is a one-time, single investment of a bulk sum of money into a financial instrument (like a mutual fund or fixed deposit) rather than spreading it out over time.

Would you like to calculate returns on a lumpsum investment?`;
  }

  // Q24: What is a Step Up SIP
  if (q === "what is a step up sip" || q.includes("step up sip")) {
    return `A **Step Up SIP** (also known as a Top-up SIP) is a feature that allows you to increase your monthly SIP contribution by a fixed percentage or amount every year. This helps you align your investments with your annual salary hikes and reach your goals much faster.

Would you like to use our Step Up SIP calculator to see the compounding difference?`;
  }

  // Q25: What is SWP
  if (q === "what is swp" || q === "what is swp systematic withdrawal plan" || q.includes("systematic withdrawal plan")) {
    return `A **Systematic Withdrawal Plan (SWP)** allows you to withdraw a fixed amount of money from your mutual fund investments at regular intervals, providing a steady income stream while the remaining balance continues to grow.

Would you like to calculate SWP payouts with our calculator?`;
  }

  // Q26: What are mutual funds
  if (q === "what are mutual funds" || q === "what is mutual funds" || q === "what is a mutual fund" || (q.includes("mutual fund") && (q.includes("what are") || q.includes("what is a mutual fund")) && !q.includes("calculator"))) {
    return `**Mutual funds** are financial vehicles that pool money from multiple investors to purchase a diversified portfolio of securities like stocks, bonds, and short-term debt. They are managed by professional Asset Management Companies (AMCs).

On Octaraa, mutual fund transaction options are planned and listed as "coming soon." In the meantime, you can use our mutual fund calculators to estimate returns. What goal are you currently planning for?`;
  }

  // Q27: What is a Fixed Deposit
  if (q === "what is a fixed deposit" || q === "what is fd") {
    return `A **Fixed Deposit (FD)** is a secure financial instrument offered by banks where you deposit a sum of money for a fixed tenure at a guaranteed interest rate.

Would you like to calculate returns on an FD?`;
  }

  // Q28: How do I book a Fixed Deposit on Octaraa
  if (q.includes("how do i book a fixed deposit") || q.includes("how to book a fixed deposit") || q.includes("book an fd")) {
    return `To book a Fixed Deposit on Octaraa:
**Click the "Book FD" button on your dashboard.** Choose your principal amount, select the partner bank and tenure, and complete the verification.

Would you like to estimate your interest using our FD calculator first?`;
  }

  // Q29: What is DICGC insurance on fixed deposits
  if (q === "what is dicgc insurance on fixed deposits" || (q.includes("dicgc") && q.includes("insurance") && !q.includes("how much"))) {
    return `**DICGC (Deposit Insurance and Credit Guarantee Corporation)** is a wholly-owned subsidiary of the Reserve Bank of India (RBI). It provides insurance cover on bank deposits—including Fixed Deposits, Savings Accounts, Current Accounts, and Recurring Deposits. 

Crucially, DICGC insurance covers **both principal and interest amounts** up to a maximum limit of ₹5 Lakh per depositor, per bank.

Would you like to calculate returns for a secure Fixed Deposit?`;
  }

  // Q30: How much insurance coverage does DICGC provide
  if (q.includes("how much insurance coverage does dicgc") || q.includes("how much dicgc coverage")) {
    return `DICGC provides insurance coverage up to a maximum limit of **₹5 Lakh** (including both principal and interest amounts) per depositor, per bank. 

If you hold deposits across different partner banks, each bank's deposit is insured separately up to the ₹5 Lakh limit. 

Would you like to compare interest rates or calculate returns for a partner bank FD?`;
  }

  // Q31: What interest rates are available on Fixed Deposits
  if (q.includes("interest rates are available on fixed deposits") || q.includes("fd interest rates")) {
    return `Fixed Deposit interest rates on Octaraa depend on our partner banks and the tenure you choose. Rates are updated in real-time to match central bank policies. You can view the live interest rate comparison directly on the Fixed Deposit booking screen of your dashboard.

Would you like to calculate returns for a specific FD amount and tenure?`;
  }

  // Q32: What calculators does Octaraa offer
  if (q === "what calculators does octaraa offer" || q.includes("what calculators")) {
    return `Octaraa offers a suite of **16 financial calculators** designed to simplify your family wealth planning:
1. **College Cost** / Future Fees Prediction Calculator
2. **SIP Calculator**
3. **Step Up SIP**
4. **Lumpsum**
5. **Target Amount SIP**
6. **Cost of Delay**
7. **Education Loan EMI**
8. **Fixed Deposits**
9. **Recurring Deposits**
10. **SWP Calculator**
11. **XIRR Calculator**
12. **Sukanya Samriddhi Yojana Calculator**
13. **PPF Calculator**
14. **Income Tax Calculator**
15. **CAGR Calculator**
16. **Retirement Calculator**

Which calculator would you like to explore first?`;
  }

  // Q33: How does the SIP Calculator work
  if (q === "how does the sip calculator work" || (q.includes("sip calculator") && q.includes("work"))) {
    return `Octaraa's **SIP Calculator** calculates returns on your systematic monthly investments to track progress towards your financial goals. By entering your monthly investment, expected return rate, and period, it illustrates the power of compounding.

Would you like to run a calculation now?`;
  }

  // Q34: How can I calculate my child's future college costs
  if (q === "how can i calculate my childs future college costs" || q.includes("college cost")) {
    return `You can calculate future college costs using our **College Cost Calculator**. 

It estimates future education and living expenses by applying a standard **10% annual education inflation rate** (in line with Economic Times surveys, indicating that fees double every 8 years). You simply enter the current cost, expected inflation, and years until admission to see the future cost and required SIP.

Would you like to calculate college costs for your child?`;
  }

  // Q35: What is the Cost of Delay calculator
  if (q === "what is the cost of delay calculator" || q.includes("cost of delay")) {
    return `The **Cost of Delay Calculator** helps you understand the financial impact and wealth lost by starting investments late. It compares investing now versus delaying by a few years, demonstrating how much compounding is lost.

Would you like to calculate the cost of delay for a monthly SIP?`;
  }

  // Q36: How do I calculate returns on a Fixed Deposit
  if (q === "how do i calculate returns on a fixed deposit" || q.includes("calculate returns on a fixed deposit")) {
    return `You can estimate returns using our **Fixed Deposit Calculator**. You enter your principal deposit, annual interest rate, and tenure to get the total interest earned and final maturity value (supporting both simple interest and quarterly compound interest).

Would you like to run a Fixed Deposit calculation?`;
  }

  // Q37: What is the XIRR Calculator used for
  if (q.includes("xirr calculator")) {
    return `The **XIRR (Extended Internal Rate of Return) Calculator** is used to calculate the annualized rate of return on investments that have multiple, irregular cash inflows and outflows (like SIPs or staggered lumpsums).

Would you like to run a XIRR calculation?`;
  }

  // Q38: What is the Sukanya Samriddhi Yojana calculator used for
  if (q.includes("sukanya samriddhi") || q.includes("ssy calculator")) {
    return `The **Sukanya Samriddhi Yojana (SSY) Calculator** estimates returns on SSY investments to plan for your daughter's future financial security. It uses the current government-backed interest rate (8.2% p.a.) to show total deposits, interest earned, and maturity value.

Would you like to estimate returns for your daughter's future?`;
  }

  // Q39: How do I calculate my retirement corpus
  if (q.includes("calculate my retirement corpus") || q.includes("retirement calculator")) {
    return `The **Retirement Calculator** helps you plan your retirement corpus. It estimates the total retirement nest-egg you'll need based on your current age, retirement age, monthly expenses post-retirement, and inflation, and shows the monthly savings required.

Would you like to calculate your retirement corpus?`;
  }

  // Q40: What is a PPF calculator and how is it useful
  if (q.includes("ppf calculator")) {
    return `A **Public Provident Fund (PPF) Calculator** helps you project the maturity value and interest earned on your PPF account over its 15-year tenure (using the current 7.1% p.a. rate), helping you plan for long-term tax-exempt savings.

Would you like to estimate returns for a PPF account?`;
  }

  // Q41: How does the Recurring Deposit calculator work
  if (q.includes("recurring deposit calculator") || q.includes("rd calculator")) {
    return `The **Recurring Deposit (RD) Calculator** calculates growth on recurring deposits. By entering a fixed monthly saving, interest rate, and tenure, it projects the total interest earned and maturity amount.

Would you like to run a RD calculation?`;
  }

  // Q42: What is the Education Loan EMI calculator
  if (q.includes("education loan emi calculator")) {
    return `The **Education Loan EMI Calculator** calculates monthly EMI payments for education loans. It helps students and parents plan their repayment schedule accurately by showing EMIs and total interest payable.

Would you like to calculate an education loan EMI?`;
  }

  // Q43: How does the Target Amount SIP calculator work
  if (q.includes("target amount sip calculator")) {
    return `The **Target Amount SIP Calculator** determines the exact monthly SIP contribution required to achieve a specific target financial goal (like ₹10 Lakhs or ₹1 Crore) within your chosen timeline and expected return rate.

Would you like to run a Target Amount calculation?`;
  }

  // Q44: What is gamified learning on Octaraa
  if (q.includes("gamified learning")) {
    return `**Gamified learning** on Octaraa makes financial education interactive and fun through quizzes, financial concept badges, certifications, and a competitive leaderboard to help families build investing confidence.

Would you like to test your financial knowledge with a quick quiz?`;
  }

  // Q45: Does Octaraa offer any financial certifications
  if (q.includes("certifications") && q.includes("octaraa")) {
    return `Yes! Octaraa offers financial certifications as part of its gamified learning platform. Users can take interactive quizzes, test their financial concepts, earn certifications, and rank on the leaderboard.

Would you like to test your financial knowledge with our quick quizzes?`;
  }

  // Q46: What is the leaderboard on Octaraa
  if (q.includes("leaderboard") && q.includes("octaraa")) {
    return `The competitive **leaderboard** is a core part of Octaraa's gamified learning. It displays rankings of users based on their scores in financial quizzes, making personal finance learning collaborative and fun.

Would you like to see how you rank in personal finance?`;
  }

  // Q47: How can I improve my financial knowledge using Octaraa
  if (q.includes("improve my financial knowledge") || q.includes("improve financial knowledge")) {
    return `You can improve your financial knowledge on Octaraa using several tools:
- **Gamified Quizzes & Certifications**: Take interactive quizzes, earn scores, and rank on the leaderboard.
- **Financial Planning Calculators**: Understand compounding, cost of delay, and inflation.
- **Educational Blogs**: Read articles on the psychology of investing, ULIP setbacks, and portfolio tracking.
- **Samaira AI**: Chat anytime for instant, jargon-free explanations of money concepts.

Which area of personal finance would you like to learn about first?`;
  }

  // Q48: Is my financial data safe on Octaraa
  if (q.includes("financial data safe")) {
    return `Yes, Octaraa protects your financial data with bank-grade encryption and strict privacy controls. All information is processed and stored on the secure and reliable Google Cloud Platform.

Do you have any specific security concerns we can clarify?`;
  }

  // Q49: What type of encryption does Octaraa use
  if (q.includes("type of encryption") && q.includes("octaraa")) {
    return `Octaraa protects your financial data with bank-grade encryption and strict privacy controls. All information is hosted securely on the Google Cloud Platform. For advanced technical specifications, we can connect you with an Octaraa security specialist.

Would you like me to arrange a callback with our security team?`;
  }

  // Q50: Does Octaraa share my data with third parties
  if (q.includes("share my data") || q.includes("share data with third parties")) {
    return `No, Octaraa does not sell, trade, or share your personal or financial data with third parties for commercial use. Your data is kept strictly private.

Would you like to learn more about our privacy policy?`;
  }



  // Q55: Can you tell me which stocks to buy
  if (q.includes("which stocks to buy") || q.includes("stocks to buy")) {
    return `No, I cannot provide specific stock buy or sell recommendations. Octaraa is an educational and wealth tracking platform. If you need personalized stock advice, we recommend consulting a SEBI-registered advisor.

Would you like to set a long-term goal or check one of our calculators?`;
  }

  // Q56: Best mutual fund right now
  if (q.includes("best mutual fund")) {
    return `I cannot recommend a specific mutual fund or fund house as "the best." The right choice depends entirely on your financial goals, risk appetite, and investment horizon. Octaraa is committed to unbiased financial planning, so we do not promote any specific schemes or houses.

I recommend using our goal planning calculators or consulting a registered financial advisor to build a portfolio tailored to your risk profile. What goal are you currently planning for?`;
  }

  // Q57: Can Octaraa guarantee returns on my investments
  if (q.includes("guarantee returns")) {
    return `No, Octaraa does not guarantee returns on any market-linked investments (like mutual funds). All investments are subject to market risks. Only fixed income products like FDs provide guaranteed interest rates as per partner bank terms.

Would you like to compare interest rates or calculate returns for a Fixed Deposit?`;
  }

  // Q58: Does Octaraa offer loans
  if (q.includes("offer loans") || q.includes("does octaraa offer loans")) {
    return `No, Octaraa does not offer loan products directly. However, we can connect you with an Octaraa representative to help guide your financial planning needs.`;
  }

  // Q59: What is a ULIP and why should I avoid it
  if (q.includes("ulip") || q.includes("unit linked insurance plan")) {
    return `A **ULIP (Unit Linked Insurance Plan)** is a financial product that combines both life insurance coverage and investment under a single plan. 

Wealth experts generally advise avoiding ULIPs because:
1. **High Charges**: Policy administration, allocation, and mortality charges eat into your returns in the early years.
2. **Lock-In**: Strict 5-year lock-in period.
3. **Suboptimal Value**: They offer low sum assured (usually 10x annual premium) and lower investment returns compared to direct mutual funds.

**The Octaraa Origin Story**:
Octaraa was born from this exact realization. In 2019, our founder Vaibhav Jain was mis-sold a ULIP by a bank advisor driven by commissions, leading to a significant setback. This highlighted the twin gaps of delayed compounding and biased, commission-driven advice in India, inspiring Vaibhav to build Octaraa to provide transparent, unbiased, family-first financial planning.

A smarter approach is to split them: buy a pure term insurance plan for protection, and invest the rest in mutual funds (SIPs) for wealth creation.

Would you like to calculate returns on a SIP or Term insurance now?`;
  }

  // Q60: What happens if a bank where I have an FD goes bankrupt
  if (q.includes("bankrupt") || q.includes("insolvent") || q.includes("goes bankrupt")) {
    return `If a bank where you have a Fixed Deposit goes bankrupt, your deposits are insured by the **DICGC** (a subsidiary of the RBI) up to a maximum of **₹5 Lakh** (including both principal and interest amounts). 

Any deposits exceeding the ₹5 Lakh limit in that specific bank are not covered by the insurance and would be at risk, subject to the bank's liquidation process. 

Would you like to learn about our secure partner banks and how to diversify your fixed deposits?`;
  }

  return null;
}
