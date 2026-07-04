const DEFAULTS = {
  energyEarly: 1400,
  lateEnergyFactor: 0.9,
  electricityPrice: 1250,
  capacity: 1000,
  investmentUnit: 11000,
  operatingCost: 90000000,
  maintenanceCost: 60000000,
  marr: 0.09,
  inflation: 0.06,
  taxRate: 0.25,
  equityShare: 0.94,
  loanRate: 0.12,
  lifetime: 20,
  depreciationYears: 13,
  loanYears: 10,
  salvageValue: 0
};

const form = document.getElementById("modelForm");
const ids = Object.keys(DEFAULTS).filter((key) => document.getElementById(key));

const money = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

const number = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat("id-ID", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function readInputs() {
  const input = { ...DEFAULTS };
  ids.forEach((id) => {
    const value = Number(document.getElementById(id).value);
    input[id] = Number.isFinite(value) ? value : DEFAULTS[id];
  });
  input.equityShare = Math.min(Math.max(input.equityShare, 0), 1);
  return input;
}

function payment(rate, periods, presentValue) {
  if (periods <= 0) return 0;
  if (rate === 0) return -(presentValue / periods);
  const factor = Math.pow(1 + rate, periods);
  return -(rate * presentValue * factor) / (factor - 1);
}

function calculate(input) {
  const lateEnergy = input.energyEarly * input.lateEnergyFactor;
  const revenueEarly = input.energyEarly * 1000 * input.electricityPrice;
  const revenueLate = lateEnergy * 1000 * input.electricityPrice;
  const totalInvestment = input.capacity * 1000 * input.investmentUnit;
  const netEquity = input.equityShare * totalInvestment;
  const netDebt = (1 - input.equityShare) * totalInvestment;
  const depreciation = (totalInvestment - input.salvageValue) / input.depreciationYears;
  const annualPayment = payment(input.loanRate, input.loanYears, netDebt);

  let loanBalance = netDebt;
  const rows = [];

  rows.push({
    year: 0,
    revenue: 0,
    totalCost: netEquity,
    tax: 0,
    principal: 0,
    netCashFlow: -netEquity,
    discountFactor: 1,
    pvRevenue: 0,
    pvCost: netEquity,
    pvNetCash: -netEquity,
    cumulativePv: -netEquity
  });

  for (let year = 1; year <= input.lifetime; year += 1) {
    const revenue = year <= 16 ? revenueEarly : revenueLate;
    const operatingCost = input.operatingCost * Math.pow(1 + input.inflation, year - 1);
    const maintenanceCost = input.maintenanceCost * Math.pow(1 + input.inflation, year - 1);
    let interestPayment = 0;
    let principalPayment = 0;

    if (year <= input.loanYears && netDebt > 0) {
      interestPayment = -(loanBalance * input.loanRate);
      principalPayment = annualPayment - interestPayment;
      loanBalance += principalPayment;
      if (Math.abs(loanBalance) < 0.01) loanBalance = 0;
    }

    const totalCost = operatingCost + maintenanceCost - interestPayment;
    const depreciationExpense = year <= input.depreciationYears ? depreciation : 0;
    const taxableIncome = revenue - totalCost - depreciationExpense;
    const tax = taxableIncome * input.taxRate;
    const netCashFlow = revenue - totalCost - tax + principalPayment;
    const discountFactor = Math.pow(1 / (1 + input.marr), year);
    const pvRevenue = revenue * discountFactor;
    const pvCost = (totalCost + tax - principalPayment) * discountFactor;
    const pvNetCash = pvRevenue - pvCost;
    const previous = rows[rows.length - 1].cumulativePv;

    rows.push({
      year,
      revenue,
      totalCost,
      tax,
      principal: principalPayment,
      netCashFlow,
      discountFactor,
      pvRevenue,
      pvCost,
      pvNetCash,
      cumulativePv: previous + pvNetCash
    });
  }

  const pvRevenueTotal = rows.reduce((sum, row) => sum + row.pvRevenue, 0);
  const pvCostTotal = rows.reduce((sum, row) => sum + row.pvCost, 0);
  const npv = pvRevenueTotal - pvCostTotal;
  const cashflows = rows.map((row) => row.netCashFlow);
  const irr = internalRateOfReturn(cashflows);
  const dppRow = rows.find((row) => row.year > 0 && row.cumulativePv > 0);

  return {
    input,
    rows,
    pvRevenueTotal,
    pvCostTotal,
    npv,
    irr,
    dpp: dppRow ? dppRow.year : null,
    totalInvestment,
    netEquity,
    netDebt
  };
}

function discountedValue(rate, cashflows) {
  return cashflows.reduce((sum, cashflow, index) => sum + cashflow / Math.pow(1 + rate, index), 0);
}

function internalRateOfReturn(cashflows) {
  const hasPositive = cashflows.some((value) => value > 0);
  const hasNegative = cashflows.some((value) => value < 0);
  if (!hasPositive || !hasNegative) return null;

  let low = -0.9999;
  let high = 1;
  let fLow = discountedValue(low, cashflows);
  let fHigh = discountedValue(high, cashflows);

  while (fLow * fHigh > 0 && high < 100) {
    high *= 2;
    fHigh = discountedValue(high, cashflows);
  }
  if (fLow * fHigh > 0) return null;

  for (let i = 0; i < 120; i += 1) {
    const mid = (low + high) / 2;
    const fMid = discountedValue(mid, cashflows);
    if (Math.abs(fMid) < 0.0001) return mid;
    if (fLow * fMid <= 0) {
      high = mid;
      fHigh = fMid;
    } else {
      low = mid;
      fLow = fMid;
    }
  }

  return (low + high) / 2;
}

function render() {
  const result = calculate(readInputs());
  renderMetrics(result);
  renderCashflow(result);
  renderSensitivity(result.input);
}

function renderMetrics(result) {
  const npvCard = document.getElementById("npvValue").closest(".metric-card");
  npvCard.classList.toggle("positive", result.npv >= 0);
  npvCard.classList.toggle("negative", result.npv < 0);

  document.getElementById("npvValue").textContent = money.format(result.npv);
  document.getElementById("npvStatus").textContent = result.npv >= 0 ? "Feasible by NPV" : "Not feasible by NPV";
  document.getElementById("irrValue").textContent = result.irr === null ? "N/A" : percent.format(result.irr);
  document.getElementById("dppValue").textContent = result.dpp === null ? "N/A" : `Tahun ${result.dpp}`;
  document.getElementById("pvNetValue").textContent = money.format(result.pvRevenueTotal - result.pvCostTotal);
}

function renderCashflow(result) {
  const body = document.getElementById("cashflowBody");
  body.innerHTML = result.rows.map((row) => `
    <tr>
      <td>${row.year}</td>
      <td>${money.format(row.revenue)}</td>
      <td>${money.format(row.totalCost)}</td>
      <td class="${row.tax < 0 ? "is-negative" : ""}">${money.format(row.tax)}</td>
      <td class="${row.netCashFlow >= 0 ? "is-positive" : "is-negative"}">${money.format(row.netCashFlow)}</td>
      <td class="${row.pvNetCash >= 0 ? "is-positive" : "is-negative"}">${money.format(row.pvNetCash)}</td>
    </tr>
  `).join("");
}

function renderSensitivity(input) {
  const scenarios = [
    ["Produksi Energi", (base, factor) => ({ ...base, energyEarly: base.energyEarly * factor })],
    ["Biaya Investasi", (base, factor) => ({ ...base, investmentUnit: base.investmentUnit * factor })],
    ["Biaya Operasional", (base, factor) => ({ ...base, operatingCost: base.operatingCost * factor })],
    ["Biaya Pemeliharaan", (base, factor) => ({ ...base, maintenanceCost: base.maintenanceCost * factor })],
    ["Suku Bunga Pinjaman", (base, factor) => ({ ...base, loanRate: base.loanRate * factor })]
  ];
  const baseline = calculate(input);

  document.getElementById("sensitivityBody").innerHTML = scenarios.map(([label, mutate]) => {
    const low = calculate(mutate(input, 0.8));
    const high = calculate(mutate(input, 1.2));
    const irrRange = `${formatIrr(low.irr)} - ${formatIrr(high.irr)}`;
    return `
      <tr>
        <td>${label}</td>
        <td class="${low.npv >= 0 ? "is-positive" : "is-negative"}">${money.format(low.npv)}</td>
        <td>${money.format(baseline.npv)}</td>
        <td class="${high.npv >= 0 ? "is-positive" : "is-negative"}">${money.format(high.npv)}</td>
        <td>${irrRange}</td>
      </tr>
    `;
  }).join("");
}

function formatIrr(value) {
  return value === null ? "N/A" : percent.format(value);
}

form.addEventListener("input", render);
document.getElementById("resetBtn").addEventListener("click", () => {
  ids.forEach((id) => {
    document.getElementById(id).value = DEFAULTS[id];
  });
  render();
});

render();
