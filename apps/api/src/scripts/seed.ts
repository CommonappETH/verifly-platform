// Phase 10.2 — idempotent dev/test seed. Boots a known-good fixture so each
// portal can be dogfooded end-to-end against `bun run db:seed` without
// curling /auth/register by hand.
//
// Same fixture as Phase 14.3 (1 admin, 2 universities + linked university_users,
// 2 banks + linked bank_users, 1 counselor, 3 students with guardians, 5
// applications across lifecycle states, 3 verifications). Pulled forward into
// Phase 10 because every per-app migration needs a known-good DB to verify.
//
// Idempotency: every row uses a deterministic `seed-…` id (or natural unique
// key for users/orgs) plus `.onConflictDoNothing()`. Re-running this script
// against a populated DB inserts no duplicates and never throws.
//
// All seeded users have password "correct-horse-battery" — same as the
// integration tests, so test-known credentials work in the browser too.

import { eq } from "drizzle-orm";

import { createDb, resolveDatabasePath, toDrizzle } from "../db/client";
import {
  applications,
  bankUsers,
  counselors,
  guardians,
  organizations,
  students,
  universityUsers,
  users,
  verifications,
} from "../db/schema";
import type { ApplicationStatus, VerificationStatus } from "../db/enums";
import { hashPassword } from "../lib/crypto/password";

const SEED_PASSWORD = "correct-horse-battery";
const PEPPER = process.env.SESSION_PEPPER ?? "dev-pepper-change-me-dev-pepper-change-me";
const NOW = Date.now();

type Drizzle = ReturnType<typeof toDrizzle>;

interface SeedUser {
  id: string;
  email: string;
  role: "admin" | "student" | "counselor" | "bank" | "university";
  name: string;
}

const SEED_USERS: SeedUser[] = [
  { id: "seed-u-admin", email: "admin@verifly.test", role: "admin", name: "Verifly Admin" },
  { id: "seed-u-uni-eth", email: "admissions@eth.test", role: "university", name: "ETH Admissions" },
  { id: "seed-u-uni-mit", email: "admissions@mit.test", role: "university", name: "MIT Admissions" },
  { id: "seed-u-bank-ubs", email: "ops@ubs.test", role: "bank", name: "UBS Ops" },
  { id: "seed-u-bank-chase", email: "ops@chase.test", role: "bank", name: "Chase Ops" },
  { id: "seed-u-counselor", email: "counselor@school.test", role: "counselor", name: "Carla Counselor" },
  { id: "seed-u-stu-alice", email: "alice@example.com", role: "student", name: "Alice Anderson" },
  { id: "seed-u-stu-bob", email: "bob@example.com", role: "student", name: "Bob Brown" },
  { id: "seed-u-stu-carol", email: "carol@example.com", role: "student", name: "Carol Chen" },
];

interface SeedOrg {
  id: string;
  kind: "university" | "bank";
  name: string;
  slug: string;
  country: string;
}

const SEED_ORGS: SeedOrg[] = [
  { id: "seed-o-eth", kind: "university", name: "ETH Zurich", slug: "eth-zurich", country: "CH" },
  { id: "seed-o-mit", kind: "university", name: "MIT", slug: "mit", country: "US" },
  { id: "seed-o-ubs", kind: "bank", name: "UBS", slug: "ubs", country: "CH" },
  { id: "seed-o-chase", kind: "bank", name: "Chase", slug: "chase", country: "US" },
];

interface SeedStudent {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  country: string;
  nationality: string;
  gpa: number;
}

const SEED_STUDENTS: SeedStudent[] = [
  { id: "seed-s-alice", userId: "seed-u-stu-alice", firstName: "Alice", lastName: "Anderson", fullName: "Alice Anderson", country: "US", nationality: "US", gpa: 3.9 },
  { id: "seed-s-bob", userId: "seed-u-stu-bob", firstName: "Bob", lastName: "Brown", fullName: "Bob Brown", country: "DE", nationality: "DE", gpa: 3.6 },
  { id: "seed-s-carol", userId: "seed-u-stu-carol", firstName: "Carol", lastName: "Chen", fullName: "Carol Chen", country: "SG", nationality: "SG", gpa: 4.0 },
];

interface SeedApp {
  id: string;
  studentId: string;
  universityId: string;
  program: string;
  status: ApplicationStatus;
  submittedAt: number | null;
}

const SEED_APPS: SeedApp[] = [
  { id: "seed-app-1", studentId: "seed-s-alice", universityId: "seed-o-eth", program: "Computer Science", status: "draft", submittedAt: null },
  { id: "seed-app-2", studentId: "seed-s-alice", universityId: "seed-o-mit", program: "Computer Science", status: "submitted", submittedAt: NOW - 7 * 24 * 3600 * 1000 },
  { id: "seed-app-3", studentId: "seed-s-bob", universityId: "seed-o-eth", program: "Mechanical Engineering", status: "under_review", submittedAt: NOW - 14 * 24 * 3600 * 1000 },
  { id: "seed-app-4", studentId: "seed-s-bob", universityId: "seed-o-mit", program: "Aerospace Engineering", status: "committee_review", submittedAt: NOW - 21 * 24 * 3600 * 1000 },
  { id: "seed-app-5", studentId: "seed-s-carol", universityId: "seed-o-eth", program: "Mathematics", status: "admitted", submittedAt: NOW - 30 * 24 * 3600 * 1000 },
];

interface SeedVerification {
  id: string;
  code: string;
  studentId: string;
  applicationId: string | null;
  bankId: string;
  guardianId: string | null;
  requestedAmount: number;
  verifiedAmount: number | null;
  currency: string;
  status: VerificationStatus;
  submittedAt: number | null;
  decidedAt: number | null;
  verifiedAt: number | null;
}

const SEED_VERIFICATIONS: SeedVerification[] = [
  { id: "seed-v-1", code: "VF-SEED1", studentId: "seed-s-alice", applicationId: "seed-app-2", bankId: "seed-o-ubs", guardianId: "seed-g-alice-1", requestedAmount: 5000000, verifiedAmount: null, currency: "USD", status: "pending_submission", submittedAt: null, decidedAt: null, verifiedAt: null },
  { id: "seed-v-2", code: "VF-SEED2", studentId: "seed-s-bob", applicationId: "seed-app-4", bankId: "seed-o-chase", guardianId: "seed-g-bob-1", requestedAmount: 7500000, verifiedAmount: null, currency: "USD", status: "pending", submittedAt: NOW - 5 * 24 * 3600 * 1000, decidedAt: null, verifiedAt: null },
  { id: "seed-v-3", code: "VF-SEED3", studentId: "seed-s-carol", applicationId: "seed-app-5", bankId: "seed-o-chase", guardianId: "seed-g-carol-1", requestedAmount: 9000000, verifiedAmount: 9000000, currency: "USD", status: "verified", submittedAt: NOW - 25 * 24 * 3600 * 1000, decidedAt: NOW - 20 * 24 * 3600 * 1000, verifiedAt: NOW - 20 * 24 * 3600 * 1000 },
];

async function seedUsers(db: Drizzle): Promise<void> {
  for (const u of SEED_USERS) {
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, u.email)).limit(1);
    if (existing.length > 0) continue;
    const passwordHash = await hashPassword(SEED_PASSWORD, PEPPER);
    await db
      .insert(users)
      .values({
        id: u.id,
        email: u.email,
        passwordHash,
        role: u.role,
        name: u.name,
        createdAt: NOW,
        updatedAt: NOW,
        deletedAt: null,
      })
      .onConflictDoNothing();
  }
}

async function seedOrganizations(db: Drizzle): Promise<void> {
  for (const o of SEED_ORGS) {
    await db
      .insert(organizations)
      .values({
        id: o.id,
        kind: o.kind,
        name: o.name,
        slug: o.slug,
        country: o.country,
        createdAt: NOW,
        updatedAt: NOW,
      })
      .onConflictDoNothing();
  }
}

async function seedRoleLinks(db: Drizzle): Promise<void> {
  // Universities ↔ users
  await db
    .insert(universityUsers)
    .values([
      { id: "seed-uu-eth", userId: "seed-u-uni-eth", universityId: "seed-o-eth", title: "Admissions Officer", createdAt: NOW, updatedAt: NOW },
      { id: "seed-uu-mit", userId: "seed-u-uni-mit", universityId: "seed-o-mit", title: "Admissions Officer", createdAt: NOW, updatedAt: NOW },
    ])
    .onConflictDoNothing();

  // Banks ↔ users
  await db
    .insert(bankUsers)
    .values([
      { id: "seed-bu-ubs", userId: "seed-u-bank-ubs", bankId: "seed-o-ubs", createdAt: NOW, updatedAt: NOW },
      { id: "seed-bu-chase", userId: "seed-u-bank-chase", bankId: "seed-o-chase", createdAt: NOW, updatedAt: NOW },
    ])
    .onConflictDoNothing();

  // Counselor profile
  await db
    .insert(counselors)
    .values([
      { id: "seed-c-1", userId: "seed-u-counselor", schoolName: "International School Zurich", createdAt: NOW, updatedAt: NOW },
    ])
    .onConflictDoNothing();
}

async function seedStudentsAndGuardians(db: Drizzle): Promise<void> {
  for (const s of SEED_STUDENTS) {
    await db
      .insert(students)
      .values({
        id: s.id,
        userId: s.userId,
        firstName: s.firstName,
        lastName: s.lastName,
        fullName: s.fullName,
        country: s.country,
        nationality: s.nationality,
        gpa: s.gpa,
        university: null,
        intendedStudy: null,
        createdAt: NOW,
        updatedAt: NOW,
        deletedAt: null,
      })
      .onConflictDoNothing();
  }

  await db
    .insert(guardians)
    .values([
      { id: "seed-g-alice-1", studentId: "seed-s-alice", fullName: "Adam Anderson", relationship: "father", email: "adam@example.com", phone: "+1-555-0101", createdAt: NOW, updatedAt: NOW },
      { id: "seed-g-bob-1", studentId: "seed-s-bob", fullName: "Beate Brown", relationship: "mother", email: "beate@example.com", phone: "+49-30-555-0101", createdAt: NOW, updatedAt: NOW },
      { id: "seed-g-carol-1", studentId: "seed-s-carol", fullName: "Chen Wei", relationship: "father", email: "wei@example.com", phone: "+65-9000-0101", createdAt: NOW, updatedAt: NOW },
    ])
    .onConflictDoNothing();
}

async function seedApplications(db: Drizzle): Promise<void> {
  for (const a of SEED_APPS) {
    await db
      .insert(applications)
      .values({
        id: a.id,
        studentId: a.studentId,
        universityId: a.universityId,
        program: a.program,
        status: a.status,
        verificationStatus: null,
        documentStatus: null,
        decisionStatus: null,
        applicantType: "normal",
        submittedAt: a.submittedAt,
        updatedAt: NOW,
      })
      .onConflictDoNothing();
  }
}

async function seedVerifications(db: Drizzle): Promise<void> {
  for (const v of SEED_VERIFICATIONS) {
    await db
      .insert(verifications)
      .values({
        id: v.id,
        code: v.code,
        studentId: v.studentId,
        applicationId: v.applicationId,
        bankId: v.bankId,
        guardianId: v.guardianId,
        requestedAmount: v.requestedAmount,
        verifiedAmount: v.verifiedAmount,
        currency: v.currency,
        status: v.status,
        rejectionReason: null,
        submittedAt: v.submittedAt,
        decidedAt: v.decidedAt,
        verifiedAt: v.verifiedAt,
      })
      .onConflictDoNothing();
  }
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL ?? "file:./.data/verifly-dev.sqlite";
  const path = resolveDatabasePath(databaseUrl);
  const sqlite = createDb(path);
  const db = toDrizzle(sqlite);

  try {
    // Order matters: parents before children for FK satisfaction.
    await seedUsers(db);
    await seedOrganizations(db);
    await seedRoleLinks(db);
    await seedStudentsAndGuardians(db);
    await seedApplications(db);
    await seedVerifications(db);

    const counts = {
      users: (await db.select().from(users)).length,
      organizations: (await db.select().from(organizations)).length,
      students: (await db.select().from(students)).length,
      applications: (await db.select().from(applications)).length,
      verifications: (await db.select().from(verifications)).length,
    };
    console.log(`seeded ${path}:`, JSON.stringify(counts));
    console.log(`login as any user with password "${SEED_PASSWORD}".`);
  } finally {
    sqlite.close();
  }
}

main().catch((err) => {
  console.error("seed failed:", err);
  process.exit(1);
});
