import type { AdminUser } from "./types";

const colors = [
  "oklch(0.7 0.15 30)",
  "oklch(0.7 0.15 90)",
  "oklch(0.7 0.15 150)",
  "oklch(0.7 0.15 210)",
  "oklch(0.7 0.15 270)",
  "oklch(0.7 0.15 330)",
];
const c = (i: number) => colors[i % colors.length];

export const users: AdminUser[] = [
  // Students
  { id: "u1", name: "Aarav Mehta", email: "aarav@student.io", role: "student", organizationId: "org-school-3", status: "active", lastActive: "2025-04-19T09:14:00Z", country: "India", avatarColor: c(0) },
  { id: "u2", name: "Lina Park", email: "lina.park@student.io", role: "student", organizationId: "org-school-1", status: "active", lastActive: "2025-04-20T08:02:00Z", country: "South Korea", avatarColor: c(1) },
  { id: "u3", name: "Noah Williams", email: "noah.w@student.io", role: "student", organizationId: "org-school-1", status: "active", lastActive: "2025-04-18T16:30:00Z", country: "USA", avatarColor: c(2) },
  { id: "u4", name: "Sofia Rossi", email: "sofia.r@student.io", role: "student", organizationId: "org-school-2", status: "suspended", lastActive: "2025-03-29T12:00:00Z", country: "Italy", avatarColor: c(3) },
  { id: "u5", name: "Chen Wei", email: "chen.wei@student.io", role: "student", organizationId: "org-school-3", status: "active", lastActive: "2025-04-20T07:45:00Z", country: "China", avatarColor: c(4) },
  { id: "u6", name: "Emma Dubois", email: "emma.d@student.io", role: "student", organizationId: "org-school-2", status: "active", lastActive: "2025-04-19T22:11:00Z", country: "France", avatarColor: c(5) },
  { id: "u7", name: "Kofi Mensah", email: "kofi.m@student.io", role: "student", organizationId: "org-school-3", status: "active", lastActive: "2025-04-17T11:20:00Z", country: "Ghana", avatarColor: c(0) },
  { id: "u8", name: "Yuki Tanaka", email: "yuki.t@student.io", role: "student", organizationId: "org-school-1", status: "active", lastActive: "2025-04-20T03:10:00Z", country: "Japan", avatarColor: c(1) },
  { id: "u9", name: "Maria Silva", email: "maria.s@student.io", role: "student", organizationId: "org-school-2", status: "active", lastActive: "2025-04-16T18:00:00Z", country: "Brazil", avatarColor: c(2) },
  { id: "u10", name: "Omar Haddad", email: "omar.h@student.io", role: "student", organizationId: "org-school-3", status: "active", lastActive: "2025-04-19T14:00:00Z", country: "UAE", avatarColor: c(3) },
  { id: "u11", name: "Priya Sharma", email: "priya.s@student.io", role: "student", organizationId: "org-school-3", status: "active", lastActive: "2025-04-20T05:30:00Z", country: "India", avatarColor: c(4) },
  { id: "u12", name: "Hannah Schmidt", email: "hannah.s@student.io", role: "student", organizationId: "org-school-1", status: "active", lastActive: "2025-04-15T10:00:00Z", country: "Germany", avatarColor: c(5) },

  // University staff
  { id: "u13", name: "Dr. Alan Brooks", email: "abrooks@stanford.edu", role: "university", organizationId: "org-uni-1", status: "active", lastActive: "2025-04-20T09:00:00Z", country: "USA", avatarColor: c(0) },
  { id: "u14", name: "Prof. Mei Lin", email: "mlin@mit.edu", role: "university", organizationId: "org-uni-2", status: "active", lastActive: "2025-04-19T13:00:00Z", country: "USA", avatarColor: c(1) },
  { id: "u15", name: "Sarah Connor", email: "s.connor@utoronto.ca", role: "university", organizationId: "org-uni-3", status: "active", lastActive: "2025-04-18T11:00:00Z", country: "Canada", avatarColor: c(2) },
  { id: "u16", name: "James Whitfield", email: "j.whitfield@imperial.ac.uk", role: "university", organizationId: "org-uni-4", status: "active", lastActive: "2025-04-20T08:00:00Z", country: "UK", avatarColor: c(3) },
  { id: "u17", name: "Anna Müller", email: "a.muller@ethz.ch", role: "university", organizationId: "org-uni-5", status: "suspended", lastActive: "2025-03-10T09:00:00Z", country: "Switzerland", avatarColor: c(4) },

  // Bank staff
  { id: "u18", name: "Rachel Tan", email: "r.tan@hsbc.com", role: "bank", organizationId: "org-bank-1", status: "active", lastActive: "2025-04-20T07:00:00Z", country: "UK", avatarColor: c(5) },
  { id: "u19", name: "David Cohen", email: "d.cohen@citi.com", role: "bank", organizationId: "org-bank-2", status: "active", lastActive: "2025-04-19T18:00:00Z", country: "USA", avatarColor: c(0) },
  { id: "u20", name: "Lim Wei Ling", email: "wl.lim@dbs.com", role: "bank", organizationId: "org-bank-3", status: "active", lastActive: "2025-04-20T02:00:00Z", country: "Singapore", avatarColor: c(1) },
  { id: "u21", name: "Olivia Martin", email: "o.martin@sc.com", role: "bank", organizationId: "org-bank-4", status: "active", lastActive: "2025-04-18T16:00:00Z", country: "UK", avatarColor: c(2) },

  // Counselors
  { id: "u22", name: "Ms. Patel", email: "patel@lincoln.edu", role: "counselor", organizationId: "org-school-1", status: "active", lastActive: "2025-04-20T08:30:00Z", country: "USA", avatarColor: c(3) },
  { id: "u23", name: "Mr. Dubois", email: "dubois@stmary.ca", role: "counselor", organizationId: "org-school-2", status: "active", lastActive: "2025-04-19T14:00:00Z", country: "Canada", avatarColor: c(4) },
  { id: "u24", name: "Mrs. Iyer", email: "iyer@victoria.in", role: "counselor", organizationId: "org-school-3", status: "active", lastActive: "2025-04-20T06:00:00Z", country: "India", avatarColor: c(5) },
  { id: "u25", name: "Mr. Hassan", email: "hassan@victoria.in", role: "counselor", organizationId: "org-school-3", status: "suspended", lastActive: "2025-02-15T10:00:00Z", country: "India", avatarColor: c(0) },

  // Admins
  { id: "u26", name: "Jordan Reyes", email: "jordan@verifly.io", role: "admin", organizationId: null, status: "active", lastActive: "2025-04-20T09:30:00Z", country: "USA", avatarColor: c(1) },
  { id: "u27", name: "Sam Okafor", email: "sam@verifly.io", role: "admin", organizationId: null, status: "active", lastActive: "2025-04-20T09:00:00Z", country: "USA", avatarColor: c(2) },
  { id: "u28", name: "Ines Vidal", email: "ines@verifly.io", role: "admin", organizationId: null, status: "active", lastActive: "2025-04-19T22:00:00Z", country: "Spain", avatarColor: c(3) },
];
