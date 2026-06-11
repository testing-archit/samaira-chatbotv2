"use client";

import { useState, useEffect } from "react";
import { formatIndianCurrencyShort } from "../../utils/format";

interface CalculatorProps {
  initialType: 'sip' | 'lumpsum' | 'emi';
  initialPrincipal: number;
  initialRate: number;
  initialYears: number;
}

export function FinancialCalculatorCard({ initialType, initialPrincipal, initialRate, initialYears }: CalculatorProps) {
  const [principal, setPrincipal] = useState(initialPrincipal || 10000);
  const [years, setYears] = useState(initialYears || 5);
  const [rate, setRate] = useState(initialRate || 12);
  const [result, setResult] = useState({ totalValue: 0, wealthGained: 0, investedAmount: 0 });

  useEffect(() => {
    // Pure client-side math logic to instantly recalculate when sliders move
    const r = (rate / 100) / 12;
    const n = years * 12;

    if (initialType === 'sip') {
      const futureValue = principal * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
      const invested = principal * n;
      setResult({
        totalValue: futureValue,
        investedAmount: invested,
        wealthGained: futureValue - invested
      });
    } else if (initialType === 'lumpsum') {
      const futureValue = principal * Math.pow(1 + (rate / 100), years);
      setResult({
        totalValue: futureValue,
        investedAmount: principal,
        wealthGained: futureValue - principal
      });
    } else {
      // EMI
      const emi = principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
      const totalPayment = emi * n;
      setResult({
        totalValue: totalPayment, // total payment
        investedAmount: principal, // principal
        wealthGained: totalPayment - principal // total interest
      });
    }
  }, [principal, years, rate, initialType]);

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)",
      padding: "16px",
      margin: "12px 0",
      boxShadow: "var(--shadow-card)",
      fontFamily: "inherit",
      width: "100%",
      maxWidth: "400px"
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
        <i className="ti ti-calculator" style={{ color: "var(--brand-leaf)" }} />
        {initialType === 'sip' ? 'SIP Calculator' : initialType === 'lumpsum' ? 'Lumpsum Calculator' : 'EMI Calculator'}
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Principal Slider */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 500 }}>
            <span>{initialType === 'emi' ? 'Loan Amount' : initialType === 'lumpsum' ? 'Investment' : 'Monthly SIP'}</span>
            <span style={{ color: "var(--brand-leaf)", fontWeight: 600 }}>{formatIndianCurrencyShort(principal)}</span>
          </div>
          <input 
            type="range" 
            min={initialType === 'emi' ? 100000 : 500} 
            max={initialType === 'emi' ? 20000000 : 500000} 
            step={initialType === 'emi' ? 50000 : 500} 
            value={principal} 
            onChange={(e) => setPrincipal(parseInt(e.target.value))}
            style={{ accentColor: "var(--brand-leaf)" }}
          />
        </div>

        {/* Years Slider */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 500 }}>
            <span>Time Horizon</span>
            <span style={{ color: "var(--brand-leaf)", fontWeight: 600 }}>{years} Years</span>
          </div>
          <input 
            type="range" 
            min={1} 
            max={30} 
            step={1} 
            value={years} 
            onChange={(e) => setYears(parseInt(e.target.value))}
            style={{ accentColor: "var(--brand-leaf)" }}
          />
        </div>

        {/* Rate Slider */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 500 }}>
            <span>{initialType === 'emi' ? 'Interest Rate' : 'Expected Return'}</span>
            <span style={{ color: "var(--brand-leaf)", fontWeight: 600 }}>{rate}% p.a.</span>
          </div>
          <input 
            type="range" 
            min={1} 
            max={20} 
            step={0.5} 
            value={rate} 
            onChange={(e) => setRate(parseFloat(e.target.value))}
            style={{ accentColor: "var(--brand-leaf)" }}
          />
        </div>

        {/* Result Box */}
        <div style={{
          background: "var(--bg-hover)",
          borderRadius: "var(--radius-md)",
          padding: "12px",
          marginTop: "8px",
          display: "flex",
          flexDirection: "column",
          gap: 8
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "var(--text-secondary)" }}>{initialType === 'emi' ? 'Principal' : 'Invested Amount'}</span>
            <span style={{ fontWeight: 500 }}>{formatIndianCurrencyShort(result.investedAmount)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "var(--text-secondary)" }}>{initialType === 'emi' ? 'Total Interest' : 'Wealth Gained'}</span>
            <span style={{ fontWeight: 500, color: initialType === 'emi' ? "var(--warn-text)" : "var(--brand-mid)" }}>
              {initialType === 'emi' ? '+' : '+'} {formatIndianCurrencyShort(result.wealthGained)}
            </span>
          </div>
          
          <hr style={{ border: "none", borderTop: "1px dashed var(--border)", margin: "4px 0" }} />
          
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 600 }}>
            <span>{initialType === 'emi' ? 'Total Payment' : 'Total Value'}</span>
            <span style={{ color: "var(--brand-leaf)" }}>{formatIndianCurrencyShort(result.totalValue)}</span>
          </div>

          {initialType === 'emi' && (
             <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, marginTop: 4 }}>
               <span>Monthly EMI</span>
               <span style={{ color: "var(--warn-text)" }}>{formatIndianCurrencyShort(result.totalValue / (years * 12))}</span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
