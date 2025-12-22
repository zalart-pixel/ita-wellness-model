import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, ReferenceLine } from 'recharts';

const formatCurrency = (value) => {
  if (Math.abs(value) >= 1000000) return `€${(value / 1000000).toFixed(2)}M`;
  if (Math.abs(value) >= 1000) return `€${(value / 1000).toFixed(0)}K`;
  return `€${value.toFixed(0)}`;
};

const formatPercent = (value) => `${(value * 100).toFixed(1)}%`;

export default function ITAWellnessLeanModel() {
  const [activeTab, setActiveTab] = useState('comparison');
  const [scenario, setScenario] = useState('base');
  const [crisisScenario, setCrisisScenario] = useState('none');
  const [modelType, setModelType] = useState('lean');
  
  // Crisis Scenarios
  const crisisScenarios = {
    none: { name: 'No Crisis', revenueImpact: [1, 1, 1, 1, 1], costImpact: [1, 1, 1, 1, 1], probability: 0.60 },
    pandemic: { name: 'Pandemic', revenueImpact: [0.1, 0.4, 0.7, 0.9, 1.0], costImpact: [0.7, 0.8, 0.9, 0.95, 1.0], probability: 0.08 },
    war: { name: 'Regional War', revenueImpact: [0.5, 0.6, 0.75, 0.85, 0.95], costImpact: [1.1, 1.15, 1.1, 1.05, 1.0], probability: 0.10 },
    recession: { name: 'Recession', revenueImpact: [0.65, 0.55, 0.6, 0.75, 0.9], costImpact: [0.95, 0.9, 0.9, 0.95, 1.0], probability: 0.12 },
  };

  const scenarioMultipliers = {
    conservative: { revenue: 0.85, cost: 1.10, exitMult: 5.0 },
    base: { revenue: 1.0, cost: 1.0, exitMult: 6.5 },
    optimistic: { revenue: 1.12, cost: 0.95, exitMult: 8.0 },
  };

  // Calculate LEAN model
  const calculateLean = (scenarioKey, crisisKey) => {
    const mult = scenarioMultipliers[scenarioKey];
    const crisis = crisisScenarios[crisisKey];
    
    // INVESTMENT
    const propertyPrice = 1100000;
    const propertyCosts = propertyPrice * 1.05; // 5% transaction
    const renovation = 220 * 1800; // 220sqm × €1,800
    const medicalFitout = 120000;
    const permits = 40000;
    const contingency = (renovation + medicalFitout + permits) * 0.12;
    const development = renovation + medicalFitout + permits + contingency;
    const equipment = 80000 + 120000 + 40000; // medical + FFE + IT
    const preOpening = 80000 + 200000 + 150000; // pre-op + WC + reserve
    const totalInvestment = propertyCosts + development + equipment + preOpening;
    
    // CAPACITY
    const roomsY12 = 8;
    const roomsY35 = 10;
    const bedsPerRoom = 1.2;
    const opWeeks = 32;
    
    // OCCUPANCY RAMP
    const occRamp = [0.45, 0.55, 0.68, 0.73, 0.78]; // More realistic ramp
    
    // AWR
    const awrY12 = 5400; // Slightly higher - boutique positioning still works
    const awrY35 = 5800; // Premium with full offering
    const priceGrowth = 1.025;
    
    // COSTS - More realistic for lean operation
    const staffY12 = 380000; // Lean team: 1 doc, 2 nurses, 3 therapists, 2 F&B, 2 ops
    const staffY35 = 520000; // Full team
    const socialCharges = 1.40;
    const staffGrowth = 1.03;
    
    const variableCostsBase = {
      supplies: 55000,
      suppliesY3: 75000,
      food: 65000,
      foodY3: 85000,
    };
    
    const fixedCosts = {
      utilities: 38000,
      marketing: 90000,
      marketingY12: 110000, // Higher in launch years
      insurance: 35000,
      maintenance: 30000,
      professional: 25000,
      technology: 18000,
      other: 22000,
    };
    
    const equipmentLease = 55000; // Y3+ for HBOT/Cryo
    const expansionCapex = 260000; // Y3: 2 rooms + equipment
    
    const years = [];
    let cumCF = -totalInvestment;
    
    for (let y = 1; y <= 5; y++) {
      const crisisRev = crisis.revenueImpact[y - 1];
      const crisisCost = crisis.costImpact[y - 1];
      
      const rooms = y >= 3 ? roomsY35 : roomsY12;
      const beds = rooms * bedsPerRoom;
      const maxBedWeeks = beds * opWeeks;
      
      const occ = occRamp[y - 1] * crisisRev;
      const baseAWR = y >= 3 ? awrY35 : awrY12;
      const awr = baseAWR * Math.pow(priceGrowth, y - 1);
      
      const wellnessBedWeeks = Math.round(maxBedWeeks * occ);
      const wellnessRev = wellnessBedWeeks * awr * mult.revenue;
      
      // Hotel fill on vacant capacity
      const vacant = maxBedWeeks - wellnessBedWeeks;
      const hotelOcc = [0.35, 0.40, 0.45, 0.48, 0.50][y - 1] * crisisRev;
      const hotelBedWeeks = Math.round(vacant * hotelOcc);
      const hotelRev = hotelBedWeeks * 280 * 7 * mult.revenue;
      
      const totalRev = wellnessRev + hotelRev;
      
      // COSTS
      const baseStaff = y >= 3 ? staffY35 : staffY12;
      const staffCost = baseStaff * socialCharges * Math.pow(staffGrowth, y - 1) * mult.cost * crisisCost;
      
      const supplies = (y >= 3 ? variableCostsBase.suppliesY3 : variableCostsBase.supplies) * mult.cost * crisisCost;
      const food = (y >= 3 ? variableCostsBase.foodY3 : variableCostsBase.food) * mult.cost * crisisCost;
      const utilities = fixedCosts.utilities * Math.pow(1.035, y - 1) * mult.cost * crisisCost;
      const marketing = (y <= 2 ? fixedCosts.marketingY12 : fixedCosts.marketing) * mult.cost * crisisCost;
      const insurance = fixedCosts.insurance * mult.cost;
      const maintenance = fixedCosts.maintenance * mult.cost;
      const professional = fixedCosts.professional * mult.cost;
      const tech = fixedCosts.technology * mult.cost;
      const other = fixedCosts.other * mult.cost;
      const lease = y >= 3 ? equipmentLease : 0;
      
      const totalOpex = staffCost + supplies + food + utilities + marketing + insurance + maintenance + professional + tech + other + lease;
      
      const ebitda = totalRev - totalOpex;
      const ebitdaMargin = totalRev > 0 ? ebitda / totalRev : 0;
      
      // Depreciation (simplified)
      const depreciation = (propertyCosts / 33) + (development / 15) + (equipment / 7);
      
      const ebit = ebitda - depreciation;
      const tax = Math.max(0, ebit) * 0.28;
      const netIncome = ebit - tax;
      
      // CapEx
      const capex = y === 3 ? expansionCapex : 0;
      
      // Cash Flow = Net Income + Depreciation - CapEx
      const opCF = netIncome + depreciation - capex;
      cumCF += opCF;
      
      years.push({
        year: y,
        rooms,
        occupancy: occ,
        awr,
        wellnessRev,
        hotelRev,
        totalRev,
        staffCost,
        totalOpex,
        ebitda,
        ebitdaMargin,
        depreciation,
        netIncome,
        capex,
        opCF,
        cumCF,
      });
    }
    
    // EXIT
    const y5EBITDA = years[4].ebitda;
    const exitValue = y5EBITDA * mult.exitMult;
    const netExit = exitValue * 0.96;
    
    // IRR CALCULATION
    const cashFlows = [-totalInvestment, ...years.map(y => y.opCF)];
    cashFlows[5] += netExit;
    
    let irr = 0.15;
    for (let i = 0; i < 100; i++) {
      let npv = 0, dnpv = 0;
      for (let t = 0; t < cashFlows.length; t++) {
        npv += cashFlows[t] / Math.pow(1 + irr, t);
        dnpv -= t * cashFlows[t] / Math.pow(1 + irr, t + 1);
      }
      if (Math.abs(dnpv) < 0.001) break;
      const newIrr = irr - npv / dnpv;
      if (Math.abs(newIrr - irr) < 0.0001 || isNaN(newIrr)) break;
      irr = Math.max(-0.99, Math.min(newIrr, 2));
    }
    
    // MOIC
    const totalReturns = years.reduce((s, y) => s + y.opCF, 0) + netExit;
    const moic = totalReturns / totalInvestment;
    
    // NPV @ 12%
    let npv12 = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      npv12 += cashFlows[t] / Math.pow(1.12, t);
    }
    
    // Breakeven
    const fixedAnnual = staffY12 * socialCharges + fixedCosts.utilities + fixedCosts.marketingY12 + 
                        fixedCosts.insurance + fixedCosts.maintenance + fixedCosts.professional + 
                        fixedCosts.technology + fixedCosts.other;
    const varPerBedWeek = (variableCostsBase.supplies + variableCostsBase.food) / (roomsY12 * bedsPerRoom * opWeeks * 0.5);
    const contribution = awrY12 - varPerBedWeek;
    const breakEvenBedWeeks = fixedAnnual / contribution;
    const breakEvenOcc = breakEvenBedWeeks / (roomsY12 * bedsPerRoom * opWeeks);
    
    // Y1-Y2 losses
    const y1y2Losses = Math.abs(Math.min(0, years[0].opCF)) + Math.abs(Math.min(0, years[1].opCF));
    const wcBuffer = 200000 + 150000;
    
    // Decision
    const profitableY3 = years[2].ebitda > 0;
    const lossesOK = y1y2Losses <= wcBuffer;
    
    let decision, decisionColor;
    if (crisisKey === 'none') {
      if (irr >= 0.22 && moic >= 2.5 && profitableY3 && lossesOK) {
        decision = 'STRONG GO'; decisionColor = '#10B981';
      } else if (irr >= 0.18 && moic >= 2.0 && profitableY3 && lossesOK) {
        decision = 'GO'; decisionColor = '#10B981';
      } else if (irr >= 0.15 && moic >= 1.5 && profitableY3) {
        decision = 'CONDITIONAL'; decisionColor = '#F59E0B';
      } else {
        decision = 'NO-GO'; decisionColor = '#EF4444';
      }
    } else {
      if (irr >= 0.12) { decision = 'SURVIVABLE'; decisionColor = '#F59E0B'; }
      else if (irr >= 0.05) { decision = 'AT RISK'; decisionColor = '#EF4444'; }
      else { decision = 'FAILURE'; decisionColor = '#7F1D1D'; }
    }
    
    return {
      investment: {
        property: propertyCosts,
        development,
        equipment,
        preOpening,
        total: totalInvestment,
      },
      years,
      irr,
      moic,
      npv12,
      exitValue,
      netExit,
      y5EBITDA,
      breakEvenOcc,
      y1y2Losses,
      wcBuffer,
      profitableY3,
      lossesOK,
      decision,
      decisionColor,
    };
  };

  // Calculate FULL model
  const calculateFull = (scenarioKey, crisisKey) => {
    const mult = scenarioMultipliers[scenarioKey];
    const crisis = crisisScenarios[crisisKey];
    
    // INVESTMENT (higher)
    const propertyPrice = 1500000;
    const propertyCosts = propertyPrice * 1.05;
    const renovation = 300 * 2000;
    const medicalFitout = 200000;
    const permits = 50000;
    const contingency = (renovation + medicalFitout + permits) * 0.15;
    const development = renovation + medicalFitout + permits + contingency;
    const equipment = 350000 + 180000 + 70000;
    const preOpening = 100000 + 300000 + 150000;
    const totalInvestment = propertyCosts + development + equipment + preOpening;
    
    const rooms = 10;
    const bedsPerRoom = 1.2;
    const opWeeks = 32;
    const maxBedWeeks = rooms * bedsPerRoom * opWeeks;
    
    const occRamp = [0.45, 0.55, 0.65, 0.72, 0.75];
    const baseAWR = 5650;
    const priceGrowth = 1.025;
    
    const baseStaff = 549000;
    const socialCharges = 1.40;
    
    const years = [];
    let cumCF = -totalInvestment;
    
    for (let y = 1; y <= 5; y++) {
      const crisisRev = crisis.revenueImpact[y - 1];
      const crisisCost = crisis.costImpact[y - 1];
      
      const occ = occRamp[y - 1] * crisisRev;
      const awr = baseAWR * Math.pow(priceGrowth, y - 1);
      
      const wellnessBedWeeks = Math.round(maxBedWeeks * occ);
      const wellnessRev = wellnessBedWeeks * awr * mult.revenue;
      
      const vacant = maxBedWeeks - wellnessBedWeeks;
      const hotelOcc = [0.35, 0.40, 0.45, 0.48, 0.50][y - 1] * crisisRev;
      const hotelBedWeeks = Math.round(vacant * hotelOcc);
      const hotelRev = hotelBedWeeks * 280 * 7 * mult.revenue;
      
      const totalRev = wellnessRev + hotelRev;
      
      const staffCost = baseStaff * socialCharges * Math.pow(1.03, y - 1) * mult.cost * crisisCost;
      const varCosts = (85000 + 95000 + 48000) * mult.cost * crisisCost;
      const marketing = (y <= 2 ? 125000 * 1.2 : 125000) * mult.cost * crisisCost;
      const fixedCosts = (45000 + 40000 + 35000 + 25000 + 30000) * mult.cost;
      
      const totalOpex = staffCost + varCosts + marketing + fixedCosts;
      
      const ebitda = totalRev - totalOpex;
      const ebitdaMargin = totalRev > 0 ? ebitda / totalRev : 0;
      
      const depreciation = (propertyCosts / 33) + (development / 15) + (350000 / 7) + (180000 / 5);
      
      const ebit = ebitda - depreciation;
      const tax = Math.max(0, ebit) * 0.28;
      const netIncome = ebit - tax;
      const opCF = netIncome + depreciation;
      cumCF += opCF;
      
      years.push({
        year: y,
        rooms,
        occupancy: occ,
        awr,
        wellnessRev,
        hotelRev,
        totalRev,
        staffCost,
        totalOpex,
        ebitda,
        ebitdaMargin,
        depreciation,
        netIncome,
        capex: 0,
        opCF,
        cumCF,
      });
    }
    
    const y5EBITDA = years[4].ebitda;
    const exitValue = y5EBITDA * mult.exitMult;
    const netExit = exitValue * 0.96;
    
    const cashFlows = [-totalInvestment, ...years.map(y => y.opCF)];
    cashFlows[5] += netExit;
    
    let irr = 0.15;
    for (let i = 0; i < 100; i++) {
      let npv = 0, dnpv = 0;
      for (let t = 0; t < cashFlows.length; t++) {
        npv += cashFlows[t] / Math.pow(1 + irr, t);
        dnpv -= t * cashFlows[t] / Math.pow(1 + irr, t + 1);
      }
      if (Math.abs(dnpv) < 0.001) break;
      const newIrr = irr - npv / dnpv;
      if (Math.abs(newIrr - irr) < 0.0001 || isNaN(newIrr)) break;
      irr = Math.max(-0.99, Math.min(newIrr, 2));
    }
    
    const totalReturns = years.reduce((s, y) => s + y.opCF, 0) + netExit;
    const moic = totalReturns / totalInvestment;
    
    let npv12 = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      npv12 += cashFlows[t] / Math.pow(1.12, t);
    }
    
    const fixedAnnual = baseStaff * socialCharges + 45000 + 125000 * 1.2 + 40000 + 35000 + 25000 + 30000;
    const varPerBedWeek = (85000 + 95000) / (maxBedWeeks * 0.5);
    const contribution = baseAWR - varPerBedWeek;
    const breakEvenOcc = (fixedAnnual / contribution) / maxBedWeeks;
    
    const y1y2Losses = Math.abs(Math.min(0, years[0].opCF)) + Math.abs(Math.min(0, years[1].opCF));
    const wcBuffer = 300000 + 150000;
    const profitableY3 = years[2].ebitda > 0;
    const lossesOK = y1y2Losses <= wcBuffer;
    
    let decision, decisionColor;
    if (crisisKey === 'none') {
      if (irr >= 0.22 && moic >= 2.5 && profitableY3 && lossesOK) {
        decision = 'STRONG GO'; decisionColor = '#10B981';
      } else if (irr >= 0.18 && moic >= 2.0 && profitableY3 && lossesOK) {
        decision = 'GO'; decisionColor = '#10B981';
      } else if (irr >= 0.15 && moic >= 1.5 && profitableY3) {
        decision = 'CONDITIONAL'; decisionColor = '#F59E0B';
      } else {
        decision = 'NO-GO'; decisionColor = '#EF4444';
      }
    } else {
      if (irr >= 0.12) { decision = 'SURVIVABLE'; decisionColor = '#F59E0B'; }
      else if (irr >= 0.05) { decision = 'AT RISK'; decisionColor = '#EF4444'; }
      else { decision = 'FAILURE'; decisionColor = '#7F1D1D'; }
    }
    
    return {
      investment: {
        property: propertyCosts,
        development,
        equipment,
        preOpening,
        total: totalInvestment,
      },
      years,
      irr,
      moic,
      npv12,
      exitValue,
      netExit,
      y5EBITDA,
      breakEvenOcc,
      y1y2Losses,
      wcBuffer,
      profitableY3,
      lossesOK,
      decision,
      decisionColor,
    };
  };

  const leanModel = useMemo(() => calculateLean(scenario, crisisScenario), [scenario, crisisScenario]);
  const fullModel = useMemo(() => calculateFull(scenario, crisisScenario), [scenario, crisisScenario]);
  const activeModel = modelType === 'lean' ? leanModel : fullModel;

  const tabs = [
    { id: 'comparison', label: '⚖️ Full vs Lean' },
    { id: 'projections', label: '📈 Projections' },
    { id: 'redlines', label: '🚨 Red Lines' },
    { id: 'crisis', label: '⚠️ Crisis Test' },
  ];

  return (
    <div style={{ 
      fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
      minHeight: '100vh',
      color: '#E2E8F0',
      padding: '24px',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', borderBottom: '1px solid #334155', paddingBottom: '20px' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          margin: '0 0 8px 0',
          background: 'linear-gradient(90deg, #10B981, #3B82F6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          ITA Wellness Retreat — LEAN vs FULL Comparison
        </h1>
        <p style={{ color: '#94A3B8', margin: 0, fontSize: '14px' }}>
          8→10 rooms phased | Equipment leased Y3+ | Phase 2 buildout Y3
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ color: '#94A3B8', fontSize: '14px' }}>Model:</span>
          {['lean', 'full'].map(m => (
            <button
              key={m}
              onClick={() => setModelType(m)}
              style={{
                padding: '8px 20px',
                borderRadius: '6px',
                border: modelType === m ? '2px solid #10B981' : '2px solid #334155',
                background: modelType === m ? '#10B98120' : '#334155',
                color: '#E2E8F0',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              {m === 'lean' ? `🚀 LEAN (${formatCurrency(leanModel.investment.total)})` : `🏛️ FULL (${formatCurrency(fullModel.investment.total)})`}
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ color: '#94A3B8', fontSize: '14px' }}>Scenario:</span>
          {['conservative', 'base', 'optimistic'].map(s => (
            <button
              key={s}
              onClick={() => setScenario(s)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: scenario === s ? '#3B82F6' : '#334155',
                color: '#E2E8F0',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ color: '#94A3B8', fontSize: '14px' }}>Crisis:</span>
          <select
            value={crisisScenario}
            onChange={(e) => setCrisisScenario(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #475569',
              background: '#1E293B',
              color: '#E2E8F0',
              fontSize: '12px',
            }}
          >
            {Object.entries(crisisScenarios).map(([key, c]) => (
              <option key={key} value={key}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Decision Banner */}
      <div style={{
        background: `linear-gradient(135deg, ${activeModel.decisionColor}20, ${activeModel.decisionColor}10)`,
        border: `2px solid ${activeModel.decisionColor}`,
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
              {modelType.toUpperCase()} MODEL — {scenario.toUpperCase()} CASE
            </div>
            <div style={{ fontSize: '36px', fontWeight: '700', color: activeModel.decisionColor }}>
              {activeModel.decision}
            </div>
            <div style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px' }}>
              {activeModel.decision === 'STRONG GO' && '→ Exceeds thresholds. Proceed actively.'}
              {activeModel.decision === 'GO' && '→ Meets thresholds. Proceed with validation.'}
              {activeModel.decision === 'CONDITIONAL' && '→ Near thresholds. Needs grants or refinement.'}
              {activeModel.decision === 'NO-GO' && '→ Below thresholds. Revisit assumptions.'}
              {activeModel.decision === 'SURVIVABLE' && '→ Survives this crisis scenario.'}
              {activeModel.decision === 'AT RISK' && '→ High risk in this scenario.'}
              {activeModel.decision === 'FAILURE' && '→ Does not survive this scenario.'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '32px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Investment</div>
              <div style={{ fontSize: '24px', fontWeight: '700' }}>{formatCurrency(activeModel.investment.total)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>IRR</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: activeModel.irr >= 0.18 ? '#10B981' : activeModel.irr >= 0.12 ? '#F59E0B' : '#EF4444' }}>
                {formatPercent(activeModel.irr)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>MOIC</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: activeModel.moic >= 2.0 ? '#10B981' : activeModel.moic >= 1.5 ? '#F59E0B' : '#EF4444' }}>
                {activeModel.moic.toFixed(2)}x
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Breakeven</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: activeModel.breakEvenOcc <= 0.55 ? '#10B981' : '#F59E0B' }}>
                {formatPercent(activeModel.breakEvenOcc)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 16px',
              borderRadius: '6px 6px 0 0',
              border: 'none',
              background: activeTab === tab.id ? '#1E40AF' : 'transparent',
              color: activeTab === tab.id ? '#E2E8F0' : '#94A3B8',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? '600' : '400',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ background: '#1E293B', borderRadius: '12px', padding: '24px' }}>
        
        {/* COMPARISON TAB */}
        {activeTab === 'comparison' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>⚖️ Side-by-Side Comparison</h2>
            
            <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #334155' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#94A3B8' }}>Metric</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#10B981' }}>🚀 LEAN</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#3B82F6' }}>🏛️ FULL</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#94A3B8' }}>Target</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Total Investment', lean: formatCurrency(leanModel.investment.total), full: formatCurrency(fullModel.investment.total), target: '≤€4M', leanPass: true, fullPass: true },
                    { label: 'IRR (5Y)', lean: formatPercent(leanModel.irr), full: formatPercent(fullModel.irr), target: '≥18%', leanPass: leanModel.irr >= 0.18, fullPass: fullModel.irr >= 0.18 },
                    { label: 'MOIC', lean: `${leanModel.moic.toFixed(2)}x`, full: `${fullModel.moic.toFixed(2)}x`, target: '≥2.0x', leanPass: leanModel.moic >= 2.0, fullPass: fullModel.moic >= 2.0 },
                    { label: 'NPV @ 12%', lean: formatCurrency(leanModel.npv12), full: formatCurrency(fullModel.npv12), target: '>€0', leanPass: leanModel.npv12 > 0, fullPass: fullModel.npv12 > 0 },
                    { label: 'Breakeven Occ', lean: formatPercent(leanModel.breakEvenOcc), full: formatPercent(fullModel.breakEvenOcc), target: '≤55%', leanPass: leanModel.breakEvenOcc <= 0.55, fullPass: fullModel.breakEvenOcc <= 0.55 },
                    { label: 'Y5 EBITDA', lean: formatCurrency(leanModel.y5EBITDA), full: formatCurrency(fullModel.y5EBITDA), target: '>€400K', leanPass: leanModel.y5EBITDA > 400000, fullPass: fullModel.y5EBITDA > 400000 },
                    { label: 'Exit Value (Net)', lean: formatCurrency(leanModel.netExit), full: formatCurrency(fullModel.netExit), target: '>€2.5M', leanPass: leanModel.netExit > 2500000, fullPass: fullModel.netExit > 2500000 },
                    { label: 'Decision', lean: leanModel.decision, full: fullModel.decision, target: 'GO+', leanPass: leanModel.decision.includes('GO'), fullPass: fullModel.decision.includes('GO') },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '12px', fontWeight: '500' }}>{row.label}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: row.leanPass ? '#10B981' : '#EF4444', fontWeight: '600' }}>{row.lean}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: row.fullPass ? '#10B981' : '#EF4444', fontWeight: '600' }}>{row.full}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#64748B' }}>{row.target}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Investment Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {[
                { name: 'LEAN', model: leanModel, color: '#10B981' },
                { name: 'FULL', model: fullModel, color: '#3B82F6' },
              ].map((m, idx) => (
                <div key={idx} style={{ background: '#0F172A', borderRadius: '8px', padding: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: m.color }}>
                    {m.name}: {formatCurrency(m.model.investment.total)}
                  </h3>
                  {[
                    { label: 'Property', value: m.model.investment.property },
                    { label: 'Development', value: m.model.investment.development },
                    { label: 'Equipment', value: m.model.investment.equipment },
                    { label: 'Pre-Opening & WC', value: m.model.investment.preOpening },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #334155', fontSize: '13px' }}>
                      <span style={{ color: '#94A3B8' }}>{item.label}</span>
                      <span>{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROJECTIONS TAB */}
        {activeTab === 'projections' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>📈 {modelType.toUpperCase()} — 5-Year Projections</h2>
            
            <div style={{ height: '300px', marginBottom: '24px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={activeModel.years.map(y => ({
                  year: `Y${y.year}`,
                  revenue: y.totalRev,
                  ebitda: y.ebitda,
                  margin: y.ebitdaMargin * 100,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="year" stroke="#94A3B8" />
                  <YAxis yAxisId="left" stroke="#94A3B8" tickFormatter={(v) => `€${(v/1000000).toFixed(1)}M`} />
                  <YAxis yAxisId="right" orientation="right" stroke="#94A3B8" tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155' }} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#3B82F6" />
                  <Bar yAxisId="left" dataKey="ebitda" name="EBITDA" fill="#10B981" />
                  <Line yAxisId="right" type="monotone" dataKey="margin" name="Margin %" stroke="#F59E0B" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #334155' }}>
                    <th style={{ padding: '10px', textAlign: 'left', color: '#94A3B8' }}>Metric</th>
                    {[1,2,3,4,5].map(y => <th key={y} style={{ padding: '10px', textAlign: 'right', color: '#94A3B8' }}>Year {y}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Rooms', values: activeModel.years.map(y => y.rooms), bold: false },
                    { label: 'Occupancy', values: activeModel.years.map(y => formatPercent(y.occupancy)), bold: false },
                    { label: 'AWR', values: activeModel.years.map(y => formatCurrency(y.awr)), bold: false },
                    { label: 'Total Revenue', values: activeModel.years.map(y => formatCurrency(y.totalRev)), bold: true },
                    { label: 'Total OpEx', values: activeModel.years.map(y => formatCurrency(y.totalOpex)), bold: false },
                    { label: 'EBITDA', values: activeModel.years.map(y => formatCurrency(y.ebitda)), bold: true },
                    { label: 'EBITDA Margin', values: activeModel.years.map(y => formatPercent(y.ebitdaMargin)), bold: false },
                    { label: 'CapEx', values: activeModel.years.map(y => y.capex > 0 ? formatCurrency(y.capex) : '—'), bold: false },
                    { label: 'Operating CF', values: activeModel.years.map(y => formatCurrency(y.opCF)), bold: true },
                    { label: 'Cumulative CF', values: activeModel.years.map(y => formatCurrency(y.cumCF)), bold: false },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '10px', fontWeight: row.bold ? '600' : '400', color: row.bold ? '#E2E8F0' : '#94A3B8' }}>{row.label}</td>
                      {row.values.map((v, j) => (
                        <td key={j} style={{ padding: '10px', textAlign: 'right', fontWeight: row.bold ? '600' : '400', color: String(v).includes('-') ? '#EF4444' : '#E2E8F0' }}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* RED LINES TAB */}
        {activeTab === 'redlines' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>🚨 Red Line Check — {modelType.toUpperCase()}</h2>
            
            {/* Profitability Timeline */}
            <div style={{ background: '#0F172A', borderRadius: '8px', padding: '20px', marginBottom: '20px', border: `2px solid ${activeModel.profitableY3 ? '#10B981' : '#EF4444'}` }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>📅 Profitability Timeline (Y1-Y2 losses expected)</h3>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                {activeModel.years.map((y, i) => (
                  <div key={i} style={{ textAlign: 'center', minWidth: '80px' }}>
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>Y{y.year}</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: y.ebitda >= 0 ? '#10B981' : '#EF4444' }}>{formatCurrency(y.ebitda)}</div>
                    <div style={{ fontSize: '10px', color: i < 2 ? '#64748B' : (y.ebitda >= 0 ? '#10B981' : '#EF4444') }}>
                      {i < 2 ? 'Ramp-up' : (y.ebitda >= 0 ? '✓ Profitable' : '✗ Loss')}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #334155', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#94A3B8' }}>Y1-Y2 Projected Losses:</span>
                  <span style={{ color: '#F59E0B', fontWeight: '600' }}>{formatCurrency(activeModel.y1y2Losses)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#94A3B8' }}>Working Capital Buffer:</span>
                  <span style={{ color: '#10B981', fontWeight: '600' }}>{formatCurrency(activeModel.wcBuffer)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>Buffer Coverage:</span>
                  <span style={{ color: activeModel.lossesOK ? '#10B981' : '#EF4444', fontWeight: '600' }}>
                    {activeModel.lossesOK ? '✓ Sufficient' : '✗ Insufficient'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Red Line Checks */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {[
                { name: 'Min IRR', current: activeModel.irr, limit: 0.18, format: 'percent', pass: activeModel.irr >= 0.18 },
                { name: 'Min MOIC', current: activeModel.moic, limit: 2.0, format: 'moic', pass: activeModel.moic >= 2.0 },
                { name: 'Max Breakeven', current: activeModel.breakEvenOcc, limit: 0.55, format: 'percent', pass: activeModel.breakEvenOcc <= 0.55 },
                { name: 'Profitable by Y3', current: activeModel.profitableY3 ? 1 : 0, limit: 1, format: 'bool', pass: activeModel.profitableY3 },
                { name: 'Losses Funded', current: activeModel.lossesOK ? 1 : 0, limit: 1, format: 'bool', pass: activeModel.lossesOK },
                { name: 'Max Investment', current: activeModel.investment.total, limit: 4000000, format: 'currency', pass: activeModel.investment.total <= 4000000 },
              ].map((item, i) => (
                <div key={i} style={{ background: '#0F172A', borderRadius: '8px', padding: '16px', border: `2px solid ${item.pass ? '#10B981' : '#EF4444'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '500' }}>{item.name}</span>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', background: item.pass ? '#064E3B' : '#7F1D1D', color: item.pass ? '#10B981' : '#EF4444', fontSize: '11px', fontWeight: '600' }}>
                      {item.pass ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: item.pass ? '#10B981' : '#EF4444' }}>
                    {item.format === 'percent' ? formatPercent(item.current) : 
                     item.format === 'moic' ? `${item.current.toFixed(2)}x` :
                     item.format === 'currency' ? formatCurrency(item.current) :
                     item.current === 1 ? '✓ Yes' : '✗ No'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>
                    Threshold: {item.format === 'percent' ? formatPercent(item.limit) : 
                               item.format === 'moic' ? `${item.limit}x` :
                               item.format === 'currency' ? formatCurrency(item.limit) : 'Required'}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Summary */}
            <div style={{ marginTop: '24px', padding: '20px', background: activeModel.decision.includes('GO') ? '#064E3B' : '#7F1D1D', borderRadius: '8px', border: `2px solid ${activeModel.decision.includes('GO') ? '#10B981' : '#EF4444'}` }}>
              <div style={{ fontWeight: '700', fontSize: '18px', marginBottom: '8px' }}>
                {activeModel.decision.includes('GO') ? `✅ ${modelType.toUpperCase()}: ${activeModel.decision}` : `❌ ${modelType.toUpperCase()}: ${activeModel.decision}`}
              </div>
              <div style={{ fontSize: '13px', color: '#D1D5DB' }}>
                Criteria: IRR ≥18% | MOIC ≥2.0x | Profitable by Y3 | Y1-Y2 losses funded by WC buffer
              </div>
            </div>
          </div>
        )}

        {/* CRISIS TAB */}
        {activeTab === 'crisis' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>⚠️ Crisis Stress Test</h2>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #334155' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#94A3B8' }}>Crisis</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#94A3B8' }}>Probability</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#10B981' }}>LEAN IRR</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#3B82F6' }}>FULL IRR</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#94A3B8' }}>Survival</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(crisisScenarios).map(([key, crisis]) => {
                    const leanC = calculateLean(scenario, key);
                    const fullC = calculateFull(scenario, key);
                    return (
                      <tr key={key} style={{ borderBottom: '1px solid #334155', background: crisisScenario === key ? '#1E40AF20' : 'transparent', cursor: 'pointer' }} onClick={() => setCrisisScenario(key)}>
                        <td style={{ padding: '12px', fontWeight: '500' }}>{crisis.name}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{(crisis.probability * 100).toFixed(0)}%</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: leanC.irr >= 0.12 ? '#10B981' : '#EF4444', fontWeight: '600' }}>{formatPercent(leanC.irr)}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: fullC.irr >= 0.12 ? '#3B82F6' : '#EF4444', fontWeight: '600' }}>{formatPercent(fullC.irr)}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{ padding: '4px 8px', borderRadius: '4px', background: leanC.irr >= 0.05 ? '#064E3B' : '#7F1D1D', color: leanC.irr >= 0.05 ? '#10B981' : '#EF4444', fontSize: '11px' }}>
                            {leanC.irr >= 0.12 ? 'YES' : leanC.irr >= 0.05 ? 'MARGINAL' : 'NO'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '24px', padding: '16px', borderTop: '1px solid #334155', fontSize: '12px', color: '#64748B', textAlign: 'center' }}>
        ITA Wellness — Lean vs Full v3.0 | {scenario.charAt(0).toUpperCase() + scenario.slice(1)} | {crisisScenarios[crisisScenario].name}
      </div>
    </div>
  );
}
