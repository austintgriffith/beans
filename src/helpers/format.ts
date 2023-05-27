import { round } from "@helpers/round";

export const formatTokenAmount = (amount: number | string, decimals = 2) => {
  const _amount = typeof amount === "string" ? parseFloat(amount) : amount;
  return Intl.NumberFormat("en-US", { maximumFractionDigits: decimals, minimumFractionDigits: 2 }).format(
    round(_amount, decimals),
  );
};
