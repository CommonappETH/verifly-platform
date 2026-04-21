import type { Applicant, MessageThread } from "./types";

const COUNTRIES: Array<[string, string]> = [
  ["India", "🇮🇳"], ["China", "🇨🇳"], ["Nigeria", "🇳🇬"], ["Brazil", "🇧🇷"],
  ["Vietnam", "🇻🇳"], ["South Korea", "🇰🇷"], ["Mexico", "🇲🇽"], ["Pakistan", "🇵🇰"],
  ["Turkey", "🇹🇷"], ["Egypt", "🇪🇬"], ["Indonesia", "🇮🇩"], ["Kenya", "🇰🇪"],
  ["Colombia", "🇨🇴"], ["Philippines", "🇵🇭"], ["Bangladesh", "🇧🇩"], ["Ghana", "🇬🇭"],
];

const MAJORS = [
  "Computer Science", "Mechanical Engineering", "Business Administration",
  "Economics", "Data Science", "Biomedical Engineering", "International Relations",
  "Architecture", "Public Health", "Finance", "Mathematics", "Psychology",
];

const NAMES = [
  "Aarav Sharma", "Mei Lin Chen", "Adaeze Okonkwo", "Lucas Oliveira",
  "Nguyen Minh Tu", "Ji-woo Park", "Sofia Hernández", "Hassan Raza",
  "Elif Demir", "Youssef Mansour", "Putri Wulandari", "Wanjiku Kamau",
  "Mateo Restrepo", "Maria Santos", "Tahmid Rahman", "Kwame Mensah",
  "Riya Patel", "Wei Zhang", "Chinedu Eze", "Camila Rocha",
  "Hoang Van Linh", "Min-jun Kim", "Diego Morales", "Ayesha Khan",
];

const COLORS = ["#1e3a5f", "#5b3a8c", "#2d6a4f", "#9d4e15", "#7a1f3d", "#1f5673"];

const DEGREES: Applicant["intendedDegree"][] = ["Bachelor's", "Master's", "Master's", "PhD", "Bachelor's"];
const STATUSES: Applicant["applicationStatus"][] = [
  "submitted", "under-review", "awaiting-info", "awaiting-verification",
  "committee-review", "conditionally-admitted", "admitted", "rejected", "draft", "waitlisted",
];

function pick<T>(arr: T[], i: number): T { return arr[i % arr.length]; }
function rand(seed: number) { return Math.abs(Math.sin(seed) * 10000) % 1; }

export const APPLICANTS: Applicant[] = NAMES.map((name, i) => {
  const [country, flag] = pick(COUNTRIES, i);
  const major = pick(MAJORS, i + 3);
  const degree = pick(DEGREES, i);
  const status = pick(STATUSES, i);
  const isPreApproved = i % 3 !== 0;
  const verifStatus =
    isPreApproved ? "verified" :
    i % 4 === 0 ? "pending" :
    i % 5 === 0 ? "in-review" : "not-started";

  const hasScholarship = i % 3 === 1;
  const tuition = 52000;
  const scholarshipAmt = hasScholarship ? Math.round(8000 + rand(i + 1) * 22000) : 0;
  const amountReq = tuition - scholarshipAmt + Math.round(15000 + rand(i + 7) * 10000);

  const decisionStatus: Applicant["decision"]["status"] =
    status === "admitted" ? "admit" :
    status === "conditionally-admitted" ? "conditional-admit" :
    status === "rejected" ? "reject" :
    status === "waitlisted" ? "waitlist" : "none";

  const submissionDate = new Date(2024, 8 + (i % 4), 1 + (i * 3) % 27).toISOString();

  return {
    id: `app-${1000 + i}`,
    applicationId: `VFY-${2024}-${(1000 + i).toString().padStart(5, "0")}`,
    name,
    email: name.toLowerCase().replace(/\s+/g, ".") + "@student.edu",
    avatarColor: pick(COLORS, i),
    country,
    countryFlag: flag,
    intendedDegree: degree,
    intendedMajor: major,
    gpa: Math.round((3.2 + rand(i) * 0.8) * 100) / 100,
    testScore: i % 2 === 0 ? { name: "TOEFL", value: `${95 + (i % 20)}` } : { name: "IELTS", value: `${(6 + rand(i) * 2).toFixed(1)}` },
    applicationStatus: status,
    applicantType: isPreApproved ? "pre-approved" : "normal",
    verification: {
      verificationId: `VER-${(50000 + i * 7).toString()}`,
      amountRequested: amountReq,
      currency: "USD",
      status: verifStatus,
      timing: isPreApproved ? "pre-application" : i % 2 === 0 ? "post-application" : "post-admission",
      partnerBank: pick(["HSBC", "Citi", "Standard Chartered", "DBS", "ICICI"], i),
      partnerBankStatus: verifStatus === "verified" ? "connected" : "pending",
      preApprovedBeforeApplying: isPreApproved,
      verifiedAt: verifStatus === "verified" ? new Date(2024, 7, 10 + i).toISOString() : undefined,
    },
    scholarship: hasScholarship ? {
      estimatedAmount: scholarshipAmt,
      tuitionAdjustment: scholarshipAmt,
      netVerificationAmount: amountReq,
      reviewStatus: pick(["proposed", "approved", "proposed", "approved"] as const, i),
      notes: "Merit-based award based on academic profile.",
    } : undefined,
    decision: {
      status: decisionStatus,
      date: decisionStatus !== "none" ? new Date(2024, 10, 5 + i).toISOString() : undefined,
      rationale: decisionStatus === "conditional-admit" ? "Strong academic profile; financial verification pending." : undefined,
      followUpRequirements: decisionStatus === "conditional-admit" ? ["Complete financial verification", "Submit final transcript"] : [],
      financialVerificationRequiredForEnrollment: decisionStatus === "conditional-admit",
      reviewer: "Dr. Eleanor Pierce",
    },
    submissionDate,
    completeness: Math.min(100, 60 + (i * 7) % 41),
    priority: i % 5 === 0,
    essays: [
      { id: "e1", prompt: "Why our university?", wordCount: 487, content: "From the moment I attended a virtual open house, I knew this institution embodied the academic rigor and global perspective I have been searching for. The interdisciplinary approach to " + major + " particularly resonates with my goal of bridging theory and applied research...\n\nThroughout my secondary education in " + country + ", I cultivated a deep curiosity for solving problems that matter. Your faculty's commitment to mentorship — evident in the work of Professor Hamilton on sustainable systems — would allow me to deepen this work meaningfully." },
      { id: "e2", prompt: "Personal statement", wordCount: 612, content: "Growing up in " + country + ", I learned early that opportunity is never evenly distributed. My grandmother, a teacher, would say that education is the one inheritance no one can take from you...\n\nThis perspective has shaped every academic choice I've made." },
    ],
    documents: [
      { id: "d1", name: "Official Transcript", type: "transcript", uploaded: true, required: true },
      { id: "d2", name: "Passport Copy", type: "passport", uploaded: true, required: true },
      { id: "d3", name: "TOEFL/IELTS Score Report", type: "test-score", uploaded: i % 4 !== 0, required: true },
      { id: "d4", name: "Letter of Recommendation #1", type: "recommendation", uploaded: true, required: true },
      { id: "d5", name: "Letter of Recommendation #2", type: "recommendation", uploaded: i % 3 !== 0, required: true },
      { id: "d6", name: "Financial Verification Statement", type: "financial", uploaded: isPreApproved, required: true },
    ],
    activities: [
      { name: "Model United Nations", role: "Secretary General", years: "2022–2024", description: "Led 200-delegate regional conference." },
      { name: "Robotics Club", role: "Lead Engineer", years: "2021–2024", description: "Built award-winning autonomous rover." },
      { name: "Community Tutoring", role: "Founder", years: "2020–2024", description: "Free STEM tutoring for 80+ underserved students." },
    ],
    honors: ["National Merit Finalist", "Regional Math Olympiad — Gold", "President's Volunteer Service Award"],
    notes: i % 4 === 0 ? [
      { id: "n1", author: "Dr. Eleanor Pierce", date: new Date(2024, 9, 12).toISOString(), content: "Exceptional essay voice. Recommend committee review.", tag: "priority" },
    ] : [],
    personal: {
      dateOfBirth: "2005-04-12",
      citizenship: country,
      languages: ["English", "Local language"],
      address: "City, " + country,
    },
    academic: {
      school: pick(["Delhi Public School", "Beijing No. 4 HS", "Lagos Grammar School", "Colégio Bandeirantes", "Hanoi-Amsterdam HS"], i),
      graduationYear: 2025,
      classRank: `${1 + (i % 10)} of ${100 + (i % 50)}`,
      coursework: ["AP Calculus BC", "AP Physics C", "AP English Literature", "IB Higher Level " + major.split(" ")[0]],
    },
  };
});

export const MESSAGE_THREADS: MessageThread[] = APPLICANTS.slice(0, 8).map((a, i) => {
  const cat: MessageThread["category"] =
    i % 4 === 0 ? "info-request" :
    i % 4 === 1 ? "verification-reminder" :
    i % 4 === 2 ? "conditional-followup" : "general";
  const subject = {
    "info-request": "Missing recommendation letter",
    "verification-reminder": "Reminder: complete financial verification",
    "conditional-followup": "Conditional admission — next steps",
    "general": "Welcome and program update",
  }[cat];
  return {
    id: `thread-${i}`,
    applicantId: a.id,
    applicantName: a.name,
    subject,
    category: cat,
    unread: i % 3 === 0,
    lastMessageAt: new Date(2024, 10, 1 + i, 9 + i).toISOString(),
    messages: [
      { id: "m1", from: "university", author: "Admissions Office", date: new Date(2024, 10, 1 + i).toISOString(), body: `Hello ${a.name.split(" ")[0]}, ${subject.toLowerCase()}. Please respond at your earliest convenience.` },
      { id: "m2", from: "applicant", author: a.name, date: new Date(2024, 10, 2 + i).toISOString(), body: "Thank you for reaching out — I'll get this to you within 48 hours." },
    ],
  };
});

export function getApplicant(id: string) {
  return APPLICANTS.find((a) => a.id === id);
}
