// Pre-computed series for the Reports page so charts feel realistic.

export const applicationsOverTime = Array.from({ length: 90 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (89 - i));
  const base = 6 + Math.sin(i / 8) * 3 + (i / 90) * 4;
  const noise = ((i * 9301 + 49297) % 233280) / 233280;
  return {
    date: d.toISOString().slice(0, 10),
    applications: Math.max(1, Math.round(base + noise * 5)),
  };
});

export const verificationApprovalRate = [
  { name: "Approved", value: 9 },
  { name: "Rejected", value: 2 },
  { name: "Pending", value: 7 },
  { name: "Flagged", value: 2 },
];

export const avgVerificationTime = [
  { week: "W1", days: 6.2 },
  { week: "W2", days: 5.8 },
  { week: "W3", days: 5.1 },
  { week: "W4", days: 4.7 },
  { week: "W5", days: 4.9 },
  { week: "W6", days: 4.3 },
  { week: "W7", days: 3.9 },
  { week: "W8", days: 4.1 },
];

export const studentsByCountry = [
  { country: "India", count: 14 },
  { country: "USA", count: 11 },
  { country: "China", count: 9 },
  { country: "South Korea", count: 7 },
  { country: "Brazil", count: 5 },
  { country: "Germany", count: 4 },
  { country: "France", count: 4 },
  { country: "UAE", count: 3 },
];

export const documentCompletionByType = [
  { type: "Transcript", completed: 28, missing: 4, review: 2 },
  { type: "Recommendation", completed: 22, missing: 6, review: 3 },
  { type: "Passport", completed: 30, missing: 2, review: 1 },
  { type: "Financial Stmt", completed: 18, missing: 8, review: 5 },
  { type: "Personal Stmt", completed: 20, missing: 7, review: 4 },
  { type: "Test Scores", completed: 24, missing: 3, review: 2 },
];

export const applicationsByStatus = [
  { name: "Submitted", value: 5 },
  { name: "Under Review", value: 6 },
  { name: "Awaiting Verif.", value: 3 },
  { name: "Conditional", value: 3 },
  { name: "Admitted", value: 4 },
  { name: "Rejected", value: 3 },
  { name: "Missing Docs", value: 4 },
];
