import { HOUSING, TRANSPORT, JOBS, ORIGINS } from "../../content/catalog.js";
import { apply, random, log } from "../engine/state.js";

export const netWorth = (s) =>
  Math.round(
    s.cash +
      s.savings +
      s.investments +
      HOUSING[s.housing].value +
      TRANSPORT[s.transport].value -
      s.debt,
  );
export const salary = (s) =>
  s.retired
    ? s.pension
    : s.career
      ? Math.round(
          JOBS.find((j) => j.id === s.career.id).salary *
            (1 + (s.career.level - 1) * 0.28),
        )
      : 0;
export function forecast(s) {
  const income = salary(s) + (s.age < 18 ? ORIGINS[s.origin].allowance : 0);
  const living =
    s.age < 18
      ? 0
      : Math.round(
          (HOUSING[s.housing].yearly +
            TRANSPORT[s.transport].yearly +
            2800 +
            s.relationships.filter(
              (r) => r.type === "child" && s.age - r.since < 18,
            ).length *
              1800) *
            (s.traits.includes("impulsive") ? 1.15 : 1),
        );
  const tuition = s.education.current ? s.education.current.annualCost : 0;
  const interest = Math.round(s.debt * 0.08);
  return {
    income,
    living,
    tuition,
    interest,
    expenses: living + tuition + interest,
    balance: income - living - tuition - interest,
  };
}
export function settleYear(s) {
  const ledger = forecast(s);
  const savingsReturn = Math.round(s.savings * 0.025);
  const rate = random(s) * 0.24 - 0.08 + s.skills.finance * 0.0004;
  const investmentReturn = Math.round(s.investments * rate) || 0;
  s.savings += savingsReturn;
  s.investments = Math.max(0, s.investments + investmentReturn);
  apply(s, { cash: ledger.balance });
  s.lastYear = { ...ledger, savingsReturn, investmentReturn, age: s.age };
  if (ledger.balance < 0 && s.debt > 0) apply(s, { stress: 7, happiness: -3 });
  if (s.debt >= 10000) s.flags.bigDebt = true;
  return s.lastYear;
}
export function transact(s, action) {
  if (s.age < 18)
    return "Las decisiones financieras se desbloquean a los 18 años.";
  if (action === "save" || action === "invest") {
    const amount = action === "save" ? 1000 : 2000;
    if (s.cash < amount) return "Necesitas más dinero disponible.";
    if (action === "invest" && s.skills.finance < 20)
      return "Necesitas Finanzas 20 para invertir.";
    s.cash -= amount;
    s[action === "save" ? "savings" : "investments"] += amount;
    log(
      s,
      action === "save"
        ? "Apartaste $1.000 en tu fondo de ahorro."
        : "Invertiste $2.000 en un fondo diversificado.",
      false,
      "wallet",
    );
  } else if (action === "withdraw" || action === "sell") {
    const key = action === "withdraw" ? "savings" : "investments";
    const amount = Math.min(s[key], action === "withdraw" ? 1000 : 2000);
    if (!amount) return "No hay saldo para retirar.";
    s[key] -= amount;
    s.cash += amount;
  } else if (action === "repay") {
    const amount = Math.min(s.cash, s.debt, 5000);
    if (!amount) return "Necesitas dinero disponible y una deuda pendiente.";
    s.cash -= amount;
    s.debt -= amount;
    log(
      s,
      `Pagaste $${amount.toLocaleString("es")} de deuda.`,
      false,
      "wallet",
    );
  } else if (action.startsWith("housing:")) {
    const id = action.split(":")[1],
      home = HOUSING[id];
    if (!home || s.housing === id) return "Ya tienes esta vivienda.";
    if (s.housing === "home")
      return "Tu casa es un patrimonio permanente durante esta vida.";
    if (s.cash < home.cost) return "No tienes suficiente dinero disponible.";
    s.cash -= home.cost;
    s.housing = id;
    apply(s, { happiness: id === "home" ? 14 : id === "rent" ? 7 : -5 });
    log(
      s,
      id === "home"
        ? "Compraste tu primera casa. Ya tienes un lugar al que llamar tuyo."
        : `Te mudaste: ${home.name.toLowerCase()}.`,
      true,
      "home",
    );
  } else if (action.startsWith("transport:")) {
    const id = action.split(":")[1],
      item = TRANSPORT[id];
    if (!item || s.transport === id) return "Ya usas este transporte.";
    if (s.cash + TRANSPORT[s.transport].value < item.cost)
      return "No tienes suficiente dinero disponible.";
    s.cash += TRANSPORT[s.transport].value - item.cost;
    s.transport = id;
    log(
      s,
      `Cambiaste tu transporte: ${item.name.toLowerCase()}.`,
      false,
      "compass",
    );
  } else return "Operación desconocida.";
  return null;
}
