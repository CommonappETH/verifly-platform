import type { Organization } from "./types";

export const organizations: Organization[] = [
  { id: "org-uni-1", name: "Stanford University", type: "university", country: "USA" },
  { id: "org-uni-2", name: "MIT", type: "university", country: "USA" },
  { id: "org-uni-3", name: "University of Toronto", type: "university", country: "Canada" },
  { id: "org-uni-4", name: "Imperial College London", type: "university", country: "UK" },
  { id: "org-uni-5", name: "ETH Zurich", type: "university", country: "Switzerland" },
  { id: "org-uni-6", name: "NUS Singapore", type: "university", country: "Singapore" },

  { id: "org-bank-1", name: "HSBC Global", type: "bank", country: "UK" },
  { id: "org-bank-2", name: "Citibank International", type: "bank", country: "USA" },
  { id: "org-bank-3", name: "DBS Bank", type: "bank", country: "Singapore" },
  { id: "org-bank-4", name: "Standard Chartered", type: "bank", country: "UK" },

  { id: "org-school-1", name: "Lincoln High School", type: "school", country: "USA" },
  { id: "org-school-2", name: "St. Mary Academy", type: "school", country: "Canada" },
  { id: "org-school-3", name: "Victoria College", type: "school", country: "India" },
];
