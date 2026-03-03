export function totalContractValue(monthlyPrice, contractMonths) {
  return Number(monthlyPrice) * Number(contractMonths);
}

export function currentVacancy(capacity, enrolledChildren = []) {
  return Number(capacity) - enrolledChildren.length;
}
