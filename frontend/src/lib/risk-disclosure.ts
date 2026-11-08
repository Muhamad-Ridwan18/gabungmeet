const STORAGE_KEY = "sp_risk_disclosure_accepted";

export function hasAcceptedRiskDisclosure(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "1";
}

export function acceptRiskDisclosure(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, "1");
}
