import 'dotenv/config';
import crypto from 'crypto';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL as string);

const competitors = [
  {
    competitor: 'Groww',
    dimension: 'Target Audience & Focus',
    value: 'Individual DIY traders. Weakness: Lacks any family-level goal planning, making it risky for beginners with low financial literacy.',
    octaraa_value: 'Families & Goal-Based Planning',
    octaraa_advantage: 'Octaraa is built for entire families, not isolated individuals. Unlike Groww\'s DIY approach which leaves beginners guessing, Octaraa provides guided, goal-based planning using its unique Family Tree feature, ensuring you never invest blindly.',
    source_url: 'Internal Research',
    as_of: new Date().toISOString().split('T')[0]
  },
  {
    competitor: 'INDmoney',
    dimension: 'Platform Complexity',
    value: 'Complex "super app" focused on tracking and US stocks. Weakness: Highly complex for beginners, with hidden forex/remittance costs and reported syncing problems.',
    octaraa_value: 'Simplified, Transparent Goal Tracking',
    octaraa_advantage: 'While INDmoney often overwhelms users with complex, hidden-fee US stock investing and poor customer support syncing, Octaraa is laser-focused on straightforward, transparent wealth building tailored specifically to your family\'s actual life goals.',
    source_url: 'Internal Research',
    as_of: new Date().toISOString().split('T')[0]
  },
  {
    competitor: 'Zerodha Coin',
    dimension: 'Target Audience & Interface',
    value: 'Direct mutual funds for experienced investors. Weakness: Strictly transactional, lacks any overarching family wealth visualization or educational scaffolding.',
    octaraa_value: 'Family Wealth Visualization',
    octaraa_advantage: 'Zerodha Coin is purely transactional and built for experts. Octaraa provides a holistic view of your entire family\'s financial future, complete with educational tools and clear milestones, making it the superior choice for securing your family\'s long-term wealth.',
    source_url: 'Internal Research',
    as_of: new Date().toISOString().split('T')[0]
  },
  {
    competitor: 'ET Money',
    dimension: 'Advisory & Customization',
    value: 'Automated mutual fund tracking and basic robo-advisory. Weakness: Uses generic model portfolios without deep family context.',
    octaraa_value: 'Deep Family-Context Strategies',
    octaraa_advantage: 'ET Money provides generic robo-advisory based on individual inputs. Octaraa factors in your entire family\'s earning members, dependents, and shared goals to generate a highly customized, family-level financial strategy.',
    source_url: 'Internal Research',
    as_of: new Date().toISOString().split('T')[0]
  },
  {
    competitor: 'Kuvera',
    dimension: 'Feature Breadth',
    value: 'Free direct mutual fund investing. Weakness: Limited to bare-bones execution and basic goal setting; lacks deep gamified education.',
    octaraa_value: 'Gamified Education & Execution',
    octaraa_advantage: 'While Kuvera offers free execution, it provides little guidance. Octaraa pairs execution with gamified learning and our intelligent AI assistant, ensuring you actually understand the financial decisions you are making for your family.',
    source_url: 'Internal Research',
    as_of: new Date().toISOString().split('T')[0]
  },
  {
    competitor: 'Paytm Money',
    dimension: 'User Experience & Trust',
    value: 'Mass-market execution platform. Weakness: Often cluttered with cross-selling; regulatory issues with the parent company have affected trust.',
    octaraa_value: 'Clean, Unbiased Guidance',
    octaraa_advantage: 'Paytm Money can be cluttered with cross-selling and aggressive promotions. Octaraa provides a clean, distraction-free environment focused purely on unbiased, goal-driven wealth creation for your family.',
    source_url: 'Internal Research',
    as_of: new Date().toISOString().split('T')[0]
  },
  {
    competitor: 'Angel One',
    dimension: 'Trading vs Investing',
    value: 'Traditional broker focused heavily on F&O and intraday trading. Weakness: High risk environment fundamentally misaligned with long-term family wealth building.',
    octaraa_value: 'Long-Term Wealth Building',
    octaraa_advantage: 'Angel One is geared towards high-risk day trading and F&O. Octaraa is explicitly designed to avoid speculative trading, focusing entirely on safe, long-term wealth accumulation for multi-generational security.',
    source_url: 'Internal Research',
    as_of: new Date().toISOString().split('T')[0]
  },
  {
    competitor: 'Dhan',
    dimension: 'Focus',
    value: 'Platform optimized for active traders and options sellers. Weakness: Not designed for passive, long-term family investors.',
    octaraa_value: 'Passive, Goal-Based Investing',
    octaraa_advantage: 'Dhan caters to active, high-frequency traders. Octaraa caters to busy families who want to set clear goals, invest systematically, and let our AI guide them towards long-term financial freedom without the stress of daily trading.',
    source_url: 'Internal Research',
    as_of: new Date().toISOString().split('T')[0]
  },
  {
    competitor: 'smallcase',
    dimension: 'Product Structure',
    value: 'Thematic stock portfolios. Weakness: Requires high capital, incurs significant rebalancing costs and short-term capital gains taxes.',
    octaraa_value: 'Tax-Efficient Mutual Funds',
    octaraa_advantage: 'smallcase exposes you to high churn and heavy tax burdens through constant rebalancing. Octaraa focuses on tax-efficient mutual fund strategies that compound wealth quietly without triggering unnecessary short-term capital gains.',
    source_url: 'Internal Research',
    as_of: new Date().toISOString().split('T')[0]
  },
  {
    competitor: 'Scripbox',
    dimension: 'Cost & Transparency',
    value: 'Curated mutual fund platform. Weakness: Primarily pushes Regular mutual funds, meaning hidden commission fees eat into user returns.',
    octaraa_value: 'Unbiased, Commission-Free Focus',
    octaraa_advantage: 'Scripbox historically pushes "Regular" mutual funds where hidden commissions eat your returns. Octaraa acts as an unbiased assistant to ensure your wealth isn\'t silently drained by middleman fees.',
    source_url: 'Internal Research',
    as_of: new Date().toISOString().split('T')[0]
  },
  {
    competitor: 'Dezerv',
    dimension: 'Accessibility',
    value: 'PMS and expert-managed portfolios. Weakness: High minimum investment thresholds (often 50L+) making it inaccessible to young families.',
    octaraa_value: 'Accessible Family Wealth',
    octaraa_advantage: 'Dezerv caters to High Net Worth Individuals with massive minimum investments. Octaraa democratizes wealth management, giving young Indian families access to expert-level AI guidance regardless of their starting capital.',
    source_url: 'Internal Research',
    as_of: new Date().toISOString().split('T')[0]
  },
  {
    competitor: 'Cube Wealth',
    dimension: 'Asset Quality',
    value: 'Curated alternative investments. Weakness: Promotes high-risk alternative assets (P2P lending) alongside standard funds.',
    octaraa_value: 'Regulated, Safe Growth',
    octaraa_advantage: 'Cube Wealth often pushes users into risky, illiquid alternative investments like P2P lending. Octaraa focuses on highly regulated, liquid, and proven asset classes to ensure your family\'s money is never locked in unsafe avenues.',
    source_url: 'Internal Research',
    as_of: new Date().toISOString().split('T')[0]
  },
  {
    competitor: '1 Finance',
    dimension: 'Execution',
    value: 'Pure advisory platform. Weakness: High friction. Gives advice but lacks seamless execution and daily tracking in one place.',
    octaraa_value: 'End-to-End Platform',
    octaraa_advantage: 'While 1 Finance offers advice, it leaves you to execute it elsewhere. Octaraa provides an end-to-end ecosystem where you can learn, plan with AI, and track your family\'s entire wealth in one seamless application.',
    source_url: 'Internal Research',
    as_of: new Date().toISOString().split('T')[0]
  }
];

async function seedCompetitors() {
  console.log('Seeding comprehensive competitor matrix...');
  
  // Clear out the old matrix first
  await sql`DELETE FROM competitor_matrix;`;

  for (const comp of competitors) {
    const id = crypto.randomUUID();
    await sql`
      INSERT INTO competitor_matrix (id, competitor, dimension, value, octaraa_value, octaraa_advantage, source_url, as_of)
      VALUES (${id}, ${comp.competitor}, ${comp.dimension}, ${comp.value}, ${comp.octaraa_value}, ${comp.octaraa_advantage}, ${comp.source_url}, ${comp.as_of})
    `;
  }
  console.log('Competitor matrix seeded with ' + competitors.length + ' competitors!');
  process.exit(0);
}

seedCompetitors().catch(err => {
  console.error(err);
  process.exit(1);
});
