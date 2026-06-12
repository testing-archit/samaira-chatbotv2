import { guardrails } from '../src/lib/guardrails';
const testResponse = `When comparing Octaraa to Groww, there are several key reasons why you should pick Octaraa:

1. Target Audience & Focus:
Octaraa is built for entire families, not isolated individuals. Unlike Groww's DIY approach which leaves beginners guessing, Octaraa provides guided, goal-based planning using its unique Family Tree feature, ensuring you never invest blindly. Groww lacks any family-level goal planning, making it risky for beginners with low financial literacy. (As of: 2026-06-10)

This means there is absolutely no risk of making uninformed decisions with Octaraa.`;
console.log(guardrails.filterOutput(testResponse));
