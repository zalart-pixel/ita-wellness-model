import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Area } from 'recharts';

const formatCurrency = (value) => {
  if (Math.abs(value) >= 1000000) return `€${(value / 1000000).toFixed(2)}M`;
  if (Math.abs(value) >= 1000) return `€${(value / 1000).toFixed(0)}K`;
  return `€${value.toFixed(0)}`;
};

const formatPercent = (value) => `${(value * 100).toFixed(1)}%`;

export default function ITAWellnessModel() {
  const [activeTab, setActiveTab] = useState('summary');
  const [scenario, setScenario] = useState('base');
  const [showAssumptions, setShowAssumptions] = useState(false);

  // Editable assumptions
  const [assumptions, setAssumptions] = useState({
    // Property
    propertyPurchase: 1500000,
    transactionCosts: 0.05,
    renovationPerSqm: 2000,
    propertySqm: 300,
    medicalFitout: 200000,
    permits: 50000,
    contingencyRate: 0.15,
    // Equipment
    medicalEquipment: 350000,
    ffe: 180000,
    itSystems: 70000,
    // Pre-opening
    preOpening: 100000,
    workingCapital: 300000,
    cashReserve: 150000,
    // Revenue
    guestRooms: 10,
    bedsPerRoom: 1.2,
    operatingWeeks: 32,
    baseAWR: 5650,
    priceEscalation: 0.025,
    // Hotel fill
    hotelNightlyRate: 280,
    hotelOccY1: 0.35,
    hotelOccY5: 0.50,
    // Occupancy
    occY1: 0.45,
    occY2: 0.55,
    occY3: 0.65,
    occY4: 0.72,
    occY5: 0.75,
    // Costs
    baseSalary: 549000,
    socialCharges: 0.40,
    medicalSupplies: 85000,
    foodBeverage: 95000,
    utilities: 48000,
    marketing: 125000,
    insurance: 45000,
    maintenance: 40000,
    professional: 35000,
    technology: 25000,
    otherOpex: 30000,
    staffEscalation: 0.03,
    costEscalation: 0.025,
    // Tax
    effectiveTaxRate: 0.28,
    // Exit
    exitYear: 5,
    exitMultiple: 6.5,
    exitCosts: 0.04,
    // Franchise
    franchiseFee: 150000,
    royaltyRate: 0.05,
    marketingFund: 0.02,
    franchiseUnitsY10: 10,
    avgFranchiseeRevenue: 1500000,
    franchiseRoyaltyMultiple: 10,
  });

  // Scenario adjustments
  const scenarioAdjustments = {
    conservative: { revenueAdj: 0.85, costAdj: 1.10, exitMultiple: 5.0, occCap: 0.65 },
    base: { revenueAdj: 1.0, costAdj: 1.0, exitMultiple: 6.5, occCap: 0.75 },
    optimistic: { revenueAdj: 1.12, costAdj: 0.95, exitMultiple: 8.0, occCap: 0.82 },
  };

  return (
    <div style={{ padding: '20px', background: '#0f172a', color: '#e5e7eb', minHeight: '100vh' }}>
      <h1>ITA Wellness Financial Model</h1>
      <p>Loading...</p>
    </div>
  );
}
