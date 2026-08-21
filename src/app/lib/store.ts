// ─── Types ───────────────────────────────────────────────────────────────────

export type UserRole = "student" | "club_admin" | "super_admin";

export interface User {
  id: string;
  email: string;
  name: string;
  student_id: string;
  department: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
}

export interface Club {
  id: string;
  name: string;
  short_name: string;
  description: string;
  category: string;
  admin_user_id: string;
  member_count: number;
  cover_url: string;
  founded: string;
  contact_email: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  venue: string;
  capacity: number;
  registered_count: number;
  waitlisted_count: number;
  poster_url: string;
  status: "draft" | "published" | "cancelled";
  club_id: string;
  created_by: string;
  tags: string[];
}

export interface Registration {
  id: string;
  user_id: string;
  event_id: string;
  status: "registered" | "waitlisted";
  registered_at: string;
}

export interface Membership {
  id: string;
  user_id: string;
  club_id: string;
  status: "pending" | "approved" | "rejected";
  applied_at: string;
  role?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: "registration" | "waitlist" | "event_update" | "membership" | "general" | "role_request";
  message: string;
  is_read: boolean;
  created_at: string;
  event_id?: string;
  club_id?: string;
}

// A student's request to the Super Admin to either lead/officer an existing club
// or create a brand-new club (which promotes them to club_admin).
export interface RoleRequest {
  id: string;
  user_id: string;
  kind: "lead_existing" | "create_club";
  requested_role: string; // e.g. "President", "General Secretary"
  club_id?: string; // for lead_existing
  club_name?: string; // for create_club
  club_category?: string; // for create_club
  club_description?: string; // for create_club
  message?: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface StoreState {
  users: User[];
  clubs: Club[];
  events: Event[];
  registrations: Registration[];
  memberships: Membership[];
  notifications: Notification[];
  roleRequests: RoleRequest[];
  currentUserId: string;
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

const USERS: User[] = [
  {
    id: "user_1",
    email: "anika.rahman@iub.edu.bd",
    name: "Anika Rahman",
    student_id: "2321200",
    department: "CSE",
    role: "student",
    bio: "Third-year CSE student passionate about AI and open-source.",
  },
  {
    id: "user_2",
    email: "shoikat.azad@iub.edu.bd",
    name: "S.M. Shoikat Azad Shawon",
    student_id: "2320246",
    department: "CSE",
    role: "club_admin",
    bio: "President of IUB Computer Science Society.",
  },
  {
    id: "user_3",
    email: "admin@iub.edu.bd",
    name: "System Administrator",
    student_id: "ADM001",
    department: "Student Affairs",
    role: "super_admin",
    bio: "IUB Student Affairs Office.",
  },
  {
    id: "user_4",
    email: "nishe.nipa@iub.edu.bd",
    name: "Nishe Akther Nipa",
    student_id: "2321153",
    department: "EEE",
    role: "student",
    bio: "EEE student, photography enthusiast.",
  },
  {
    id: "user_5",
    email: "ahnaf.pushon@iub.edu.bd",
    name: "Ahnaf Pushon",
    student_id: "2320401",
    department: "BBA",
    role: "student",
    bio: "BBA student, loves debating.",
  },
  {
    id: "user_6",
    email: "raisa.akter@iub.edu.bd",
    name: "Raisa Akter",
    student_id: "2321045",
    department: "CSE",
    role: "student",
  },
  {
    id: "user_7",
    email: "tanvir.hasan@iub.edu.bd",
    name: "Tanvir Hasan",
    student_id: "2320812",
    department: "EEE",
    role: "student",
  },
  {
    id: "user_8",
    email: "fatema.begum@iub.edu.bd",
    name: "Fatema Begum",
    student_id: "2321300",
    department: "BBA",
    role: "student",
  },
];

const CLUBS: Club[] = [
  {
    id: "club_1",
    name: "IUB Computer Science Society",
    short_name: "CSS",
    description:
      "The largest technical club at IUB, fostering innovation through hackathons, workshops, and tech talks. We connect students with industry leaders and prepare them for the digital economy.",
    category: "Technology",
    admin_user_id: "user_2",
    member_count: 247,
    cover_url:
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=400&fit=crop&auto=format",
    founded: "2015",
    contact_email: "css@iub.edu.bd",
  },
  {
    id: "club_2",
    name: "IUB Debate & Oratory Club",
    short_name: "DOC",
    description:
      "Sharpening critical thinking and public speaking skills through competitive debate, Model UN, and oratory competitions at national and international levels.",
    category: "Academic",
    admin_user_id: "user_4",
    member_count: 118,
    cover_url:
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=400&fit=crop&auto=format",
    founded: "2012",
    contact_email: "doc@iub.edu.bd",
  },
  {
    id: "club_3",
    name: "IUB Photography Society",
    short_name: "PS",
    description:
      "Capturing life through lenses — we run photo walks, darkroom workshops, and an annual exhibition. Open to all skill levels, from phone photographers to DSLR enthusiasts.",
    category: "Arts & Culture",
    admin_user_id: "user_5",
    member_count: 85,
    cover_url:
      "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&h=400&fit=crop&auto=format",
    founded: "2018",
    contact_email: "ps@iub.edu.bd",
  },
  {
    id: "club_4",
    name: "IUB Cultural Club",
    short_name: "CC",
    description:
      "Celebrating the rich cultural diversity of Bangladesh through music, dance, drama, and seasonal festivals. The heart of campus life.",
    category: "Arts & Culture",
    admin_user_id: "user_6",
    member_count: 312,
    cover_url:
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=400&fit=crop&auto=format",
    founded: "2010",
    contact_email: "cc@iub.edu.bd",
  },
  {
    id: "club_5",
    name: "IUB Green Campus Initiative",
    short_name: "GCI",
    description:
      "Driving sustainability on campus through tree plantations, recycling drives, awareness campaigns, and eco-friendly project funding.",
    category: "Social",
    admin_user_id: "user_7",
    member_count: 64,
    cover_url:
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=400&fit=crop&auto=format",
    founded: "2020",
    contact_email: "gci@iub.edu.bd",
  },
];

const EVENTS: Event[] = [
  {
    id: "event_1",
    title: "IUB Hackathon 2026",
    description:
      "A 36-hour intensive hackathon where teams of up to 4 students compete to build innovative solutions to real-world problems. Featuring mentorship from industry professionals, prize money of ৳1,50,000, and networking opportunities with tech companies.",
    date: "2026-08-01",
    start_time: "09:00",
    end_time: "21:00",
    venue: "IUB Main Auditorium, Block A",
    capacity: 150,
    registered_count: 45,
    waitlisted_count: 0,
    poster_url:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop&auto=format",
    status: "published",
    club_id: "club_1",
    created_by: "user_2",
    tags: ["Hackathon", "Tech", "Competition"],
  },
  {
    id: "event_2",
    title: "Intro to Machine Learning Workshop",
    description:
      "A hands-on workshop covering the fundamentals of machine learning using Python and scikit-learn. Participants will build and evaluate their first ML model. Laptops are required. Pre-registration is mandatory as seats are very limited.",
    date: "2026-07-25",
    start_time: "14:00",
    end_time: "17:00",
    venue: "Computer Lab 3, Block C",
    capacity: 30,
    registered_count: 30,
    waitlisted_count: 3,
    poster_url:
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=500&fit=crop&auto=format",
    status: "published",
    club_id: "club_1",
    created_by: "user_2",
    tags: ["Workshop", "AI/ML", "Python"],
  },
  {
    id: "event_3",
    title: "National Debate Championship Qualifier",
    description:
      "IUB's internal qualifier round for the National University Debate Championship. British Parliamentary format. Open to all IUB students. Winners represent IUB at the nationals.",
    date: "2026-08-10",
    start_time: "10:00",
    end_time: "18:00",
    venue: "Seminar Hall, Block B",
    capacity: 80,
    registered_count: 56,
    waitlisted_count: 0,
    poster_url:
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=500&fit=crop&auto=format",
    status: "published",
    club_id: "club_2",
    created_by: "user_4",
    tags: ["Debate", "Competition", "National"],
  },
  {
    id: "event_4",
    title: "Photo Walk: Old Dhaka Streets",
    description:
      "An early morning photography expedition through the historic lanes of Old Dhaka — Sadarghat, Ahsan Manzil, and Shankhari Bazar. Capture the soul of the city at golden hour. All skill levels welcome.",
    date: "2026-07-22",
    start_time: "06:00",
    end_time: "11:00",
    venue: "Meet at IUB Main Gate",
    capacity: 20,
    registered_count: 8,
    waitlisted_count: 0,
    poster_url:
      "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&h=500&fit=crop&auto=format",
    status: "published",
    club_id: "club_3",
    created_by: "user_5",
    tags: ["Photography", "Cultural", "Outdoor"],
  },
  {
    id: "event_5",
    title: "Monsoon Cultural Fest 2026",
    description:
      "The biggest event of the year! A full-day celebration of Bangladeshi arts, music, food, and heritage. Featuring live performances by student bands, traditional dance, folk music, and art installations. Free entry for all IUB students.",
    date: "2026-08-15",
    start_time: "10:00",
    end_time: "22:00",
    venue: "IUB Open Grounds",
    capacity: 500,
    registered_count: 312,
    waitlisted_count: 0,
    poster_url:
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=500&fit=crop&auto=format",
    status: "published",
    club_id: "club_4",
    created_by: "user_6",
    tags: ["Cultural", "Festival", "Music"],
  },
  {
    id: "event_6",
    title: "Guest Lecture: AI in Healthcare",
    description:
      "Dr. Mahbub Hossain from BRAC University will discuss how artificial intelligence is transforming diagnostics, drug discovery, and patient care in Bangladesh. Q&A session to follow.",
    date: "2026-07-30",
    start_time: "15:00",
    end_time: "17:00",
    venue: "Lecture Hall 1, Block A",
    capacity: 100,
    registered_count: 94,
    waitlisted_count: 0,
    poster_url:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&h=500&fit=crop&auto=format",
    status: "published",
    club_id: "club_1",
    created_by: "user_2",
    tags: ["Lecture", "AI", "Healthcare"],
  },
  {
    id: "event_7",
    title: "Monsoon Tree Plantation Drive",
    description:
      "Join us to plant 200 saplings across the IUB campus as part of our commitment to a greener future. Gloves and tools provided. Refreshments included.",
    date: "2026-07-19",
    start_time: "08:00",
    end_time: "12:00",
    venue: "IUB East Campus Garden",
    capacity: 50,
    registered_count: 12,
    waitlisted_count: 0,
    poster_url:
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=500&fit=crop&auto=format",
    status: "published",
    club_id: "club_5",
    created_by: "user_7",
    tags: ["Volunteering", "Environment", "Outdoor"],
  },
  {
    id: "event_8",
    title: "Annual Photography Exhibition",
    description:
      "The Photography Society's flagship annual showcase — 80+ prints from student photographers displayed in a gallery format. Opening night features live acoustic music and light refreshments.",
    date: "2026-09-05",
    start_time: "17:00",
    end_time: "21:00",
    venue: "IUB Gallery Space, Block D",
    capacity: 200,
    registered_count: 67,
    waitlisted_count: 0,
    poster_url:
      "https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=800&h=500&fit=crop&auto=format",
    status: "published",
    club_id: "club_3",
    created_by: "user_5",
    tags: ["Photography", "Exhibition", "Arts"],
  },
];

const REGISTRATIONS: Registration[] = [
  // user_1 (Anika) registrations
  {
    id: "reg_1",
    user_id: "user_1",
    event_id: "event_1",
    status: "registered",
    registered_at: "2026-07-10T09:15:00Z",
  },
  {
    id: "reg_2",
    user_id: "user_1",
    event_id: "event_2",
    status: "waitlisted",
    registered_at: "2026-07-12T14:30:00Z",
  },
  {
    id: "reg_3",
    user_id: "user_1",
    event_id: "event_4",
    status: "registered",
    registered_at: "2026-07-15T11:00:00Z",
  },
  // Other users registered for event_1 (for admin roster)
  {
    id: "reg_4",
    user_id: "user_4",
    event_id: "event_1",
    status: "registered",
    registered_at: "2026-07-09T08:00:00Z",
  },
  {
    id: "reg_5",
    user_id: "user_5",
    event_id: "event_1",
    status: "registered",
    registered_at: "2026-07-09T10:00:00Z",
  },
  {
    id: "reg_6",
    user_id: "user_6",
    event_id: "event_1",
    status: "registered",
    registered_at: "2026-07-10T07:00:00Z",
  },
  {
    id: "reg_7",
    user_id: "user_7",
    event_id: "event_2",
    status: "registered",
    registered_at: "2026-07-08T12:00:00Z",
  },
  {
    id: "reg_8",
    user_id: "user_8",
    event_id: "event_2",
    status: "waitlisted",
    registered_at: "2026-07-13T09:00:00Z",
  },
];

const MEMBERSHIPS: Membership[] = [
  // user_1 (Anika) memberships
  {
    id: "mem_1",
    user_id: "user_1",
    club_id: "club_1",
    status: "approved",
    applied_at: "2026-01-10T09:00:00Z",
    role: "Member",
  },
  {
    id: "mem_2",
    user_id: "user_1",
    club_id: "club_2",
    status: "pending",
    applied_at: "2026-07-14T14:00:00Z",
  },
  // user_2 (Shawon) — admin of club_1
  {
    id: "mem_3",
    user_id: "user_2",
    club_id: "club_1",
    status: "approved",
    applied_at: "2025-09-01T09:00:00Z",
    role: "President",
  },
  // Pending requests for club_1 (for admin to review)
  {
    id: "mem_4",
    user_id: "user_4",
    club_id: "club_1",
    status: "pending",
    applied_at: "2026-07-15T11:30:00Z",
  },
  {
    id: "mem_5",
    user_id: "user_5",
    club_id: "club_1",
    status: "pending",
    applied_at: "2026-07-16T08:45:00Z",
  },
  {
    id: "mem_6",
    user_id: "user_6",
    club_id: "club_1",
    status: "approved",
    applied_at: "2026-02-01T10:00:00Z",
    role: "Member",
  },
  {
    id: "mem_7",
    user_id: "user_7",
    club_id: "club_1",
    status: "approved",
    applied_at: "2026-02-05T10:00:00Z",
    role: "Member",
  },
  // user_4 memberships
  {
    id: "mem_8",
    user_id: "user_4",
    club_id: "club_2",
    status: "approved",
    applied_at: "2026-01-15T10:00:00Z",
    role: "President",
  },
  // user_5 memberships
  {
    id: "mem_9",
    user_id: "user_5",
    club_id: "club_3",
    status: "approved",
    applied_at: "2026-01-20T10:00:00Z",
    role: "President",
  },
];

const NOTIFICATIONS: Notification[] = [
  {
    id: "notif_1",
    user_id: "user_1",
    type: "registration",
    message: "You have successfully registered for IUB Hackathon 2026.",
    is_read: true,
    created_at: "2026-07-10T09:15:00Z",
    event_id: "event_1",
  },
  {
    id: "notif_2",
    user_id: "user_1",
    type: "waitlist",
    message:
      "You joined the waitlist for 'Intro to Machine Learning Workshop'. Your position: #1.",
    is_read: false,
    created_at: "2026-07-12T14:30:00Z",
    event_id: "event_2",
  },
  {
    id: "notif_3",
    user_id: "user_1",
    type: "registration",
    message: "You have successfully registered for 'Photo Walk: Old Dhaka Streets'.",
    is_read: false,
    created_at: "2026-07-15T11:00:00Z",
    event_id: "event_4",
  },
  {
    id: "notif_4",
    user_id: "user_1",
    type: "event_update",
    message:
      "Heads up: 'Guest Lecture: AI in Healthcare' is almost at capacity (94/100 spots filled).",
    is_read: false,
    created_at: "2026-07-16T10:00:00Z",
    event_id: "event_6",
  },
  // Admin notifications
  {
    id: "notif_5",
    user_id: "user_2",
    type: "membership",
    message: "Nishe Akther Nipa has requested to join IUB Computer Science Society.",
    is_read: false,
    created_at: "2026-07-15T11:30:00Z",
    club_id: "club_1",
  },
  {
    id: "notif_6",
    user_id: "user_2",
    type: "membership",
    message: "Ahnaf Pushon has requested to join IUB Computer Science Society.",
    is_read: false,
    created_at: "2026-07-16T08:45:00Z",
    club_id: "club_1",
  },
];

const ROLE_REQUESTS: RoleRequest[] = [
  {
    id: "rr_1",
    user_id: "user_8",
    kind: "create_club",
    requested_role: "President",
    club_name: "IUB Robotics Club",
    club_category: "Technology",
    club_description:
      "A hands-on club for building robots, competing in national robotics challenges, and running Arduino & embedded-systems workshops.",
    message: "We already have 15 interested students and a faculty advisor from EEE.",
    status: "pending",
    created_at: "2026-07-16T10:20:00Z",
  },
  {
    id: "rr_2",
    user_id: "user_6",
    kind: "lead_existing",
    requested_role: "General Secretary",
    club_id: "club_4",
    message: "I've been an active member for two years and would like to take on an officer role.",
    status: "pending",
    created_at: "2026-07-15T16:05:00Z",
  },
];

// ─── Initial State ────────────────────────────────────────────────────────────

export const initialState: StoreState = {
  users: USERS,
  clubs: CLUBS,
  events: EVENTS,
  registrations: REGISTRATIONS,
  memberships: MEMBERSHIPS,
  notifications: NOTIFICATIONS,
  roleRequests: ROLE_REQUESTS,
  currentUserId: "user_1",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _notifCounter = 100;
function newNotifId() {
  return `notif_${++_notifCounter}`;
}
let _regCounter = 100;
function newRegId() {
  return `reg_${++_regCounter}`;
}
let _memCounter = 100;
function newMemId() {
  return `mem_${++_memCounter}`;
}
let _evtCounter = 100;
function newEvtId() {
  return `event_${++_evtCounter}`;
}
let _userCounter = 100;
function newUserId() {
  return `user_${++_userCounter}`;
}
let _rrCounter = 100;
function newRoleReqId() {
  return `rr_${++_rrCounter}`;
}
let _clubCounter = 100;
function newClubId() {
  return `club_${++_clubCounter}`;
}

function superAdminIds(state: StoreState): string[] {
  return state.users.filter((u) => u.role === "super_admin").map((u) => u.id);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function registerForEvent(state: StoreState, userId: string, eventId: string): StoreState {
  const event = state.events.find((e) => e.id === eventId);
  if (!event) return state;

  const existing = state.registrations.find(
    (r) => r.user_id === userId && r.event_id === eventId
  );
  if (existing) return state;

  const isFull = event.registered_count >= event.capacity;
  const status: Registration["status"] = isFull ? "waitlisted" : "registered";
  const waitlistPos = isFull ? event.waitlisted_count + 1 : undefined;

  const newReg: Registration = {
    id: newRegId(),
    user_id: userId,
    event_id: eventId,
    status,
    registered_at: new Date().toISOString(),
  };

  const newNotif: Notification = {
    id: newNotifId(),
    user_id: userId,
    type: status === "registered" ? "registration" : "waitlist",
    message:
      status === "registered"
        ? `You have successfully registered for "${event.title}".`
        : `You joined the waitlist for "${event.title}". Your position: #${waitlistPos}.`,
    is_read: false,
    created_at: new Date().toISOString(),
    event_id: eventId,
  };

  const updatedEvents = state.events.map((e) => {
    if (e.id !== eventId) return e;
    return status === "registered"
      ? { ...e, registered_count: e.registered_count + 1 }
      : { ...e, waitlisted_count: e.waitlisted_count + 1 };
  });

  return {
    ...state,
    events: updatedEvents,
    registrations: [...state.registrations, newReg],
    notifications: [...state.notifications, newNotif],
  };
}

export function cancelRegistration(state: StoreState, userId: string, eventId: string): StoreState {
  const reg = state.registrations.find(
    (r) => r.user_id === userId && r.event_id === eventId
  );
  if (!reg) return state;

  let newState = {
    ...state,
    registrations: state.registrations.filter((r) => r.id !== reg.id),
    events: state.events.map((e) => {
      if (e.id !== eventId) return e;
      return reg.status === "registered"
        ? { ...e, registered_count: Math.max(0, e.registered_count - 1) }
        : { ...e, waitlisted_count: Math.max(0, e.waitlisted_count - 1) };
    }),
  };

  // Waitlist auto-promotion: if cancelled was registered, promote first waitlisted
  if (reg.status === "registered") {
    const nextWaitlisted = newState.registrations
      .filter((r) => r.event_id === eventId && r.status === "waitlisted")
      .sort((a, b) => a.registered_at.localeCompare(b.registered_at))[0];

    if (nextWaitlisted) {
      const promotionNotif: Notification = {
        id: newNotifId(),
        user_id: nextWaitlisted.user_id,
        type: "registration",
        message: `Great news! A spot opened up — you are now registered for "${state.events.find((e) => e.id === eventId)?.title}".`,
        is_read: false,
        created_at: new Date().toISOString(),
        event_id: eventId,
      };

      newState = {
        ...newState,
        registrations: newState.registrations.map((r) =>
          r.id === nextWaitlisted.id ? { ...r, status: "registered" } : r
        ),
        events: newState.events.map((e) => {
          if (e.id !== eventId) return e;
          return {
            ...e,
            registered_count: e.registered_count + 1,
            waitlisted_count: Math.max(0, e.waitlisted_count - 1),
          };
        }),
        notifications: [...newState.notifications, promotionNotif],
      };
    }
  }

  return newState;
}

export function applyToClub(state: StoreState, userId: string, clubId: string): StoreState {
  const existing = state.memberships.find(
    (m) => m.user_id === userId && m.club_id === clubId
  );
  if (existing) return state;

  const club = state.clubs.find((c) => c.id === clubId);
  if (!club) return state;

  const newMem: Membership = {
    id: newMemId(),
    user_id: userId,
    club_id: clubId,
    status: "pending",
    applied_at: new Date().toISOString(),
  };

  const user = state.users.find((u) => u.id === userId);
  const adminNotif: Notification = {
    id: newNotifId(),
    user_id: club.admin_user_id,
    type: "membership",
    message: `${user?.name ?? "A student"} has requested to join ${club.name}.`,
    is_read: false,
    created_at: new Date().toISOString(),
    club_id: clubId,
  };

  return {
    ...state,
    memberships: [...state.memberships, newMem],
    notifications: [...state.notifications, adminNotif],
  };
}

export function reviewMembership(
  state: StoreState,
  membershipId: string,
  action: "approved" | "rejected"
): StoreState {
  const mem = state.memberships.find((m) => m.id === membershipId);
  if (!mem) return state;

  const club = state.clubs.find((c) => c.id === mem.club_id);

  const userNotif: Notification = {
    id: newNotifId(),
    user_id: mem.user_id,
    type: "membership",
    message:
      action === "approved"
        ? `Your membership request for ${club?.name} has been approved! Welcome aboard.`
        : `Your membership request for ${club?.name} has been declined.`,
    is_read: false,
    created_at: new Date().toISOString(),
    club_id: mem.club_id,
  };

  const updatedClubs =
    action === "approved"
      ? state.clubs.map((c) =>
          c.id === mem.club_id ? { ...c, member_count: c.member_count + 1 } : c
        )
      : state.clubs;

  return {
    ...state,
    memberships: state.memberships.map((m) =>
      m.id === membershipId ? { ...m, status: action, role: action === "approved" ? "Member" : m.role } : m
    ),
    clubs: updatedClubs,
    notifications: [...state.notifications, userNotif],
  };
}

export function removeMember(state: StoreState, membershipId: string): StoreState {
  const mem = state.memberships.find((m) => m.id === membershipId);
  if (!mem) return state;

  return {
    ...state,
    memberships: state.memberships.filter((m) => m.id !== membershipId),
    clubs: state.clubs.map((c) =>
      c.id === mem.club_id ? { ...c, member_count: Math.max(0, c.member_count - 1) } : c
    ),
  };
}

export function createEvent(state: StoreState, eventData: Omit<Event, "id" | "registered_count" | "waitlisted_count">): StoreState {
  const newEvent: Event = {
    ...eventData,
    id: newEvtId(),
    registered_count: 0,
    waitlisted_count: 0,
  };
  return { ...state, events: [...state.events, newEvent] };
}

export function updateEvent(state: StoreState, eventId: string, updates: Partial<Event>): StoreState {
  const event = state.events.find((e) => e.id === eventId);
  if (!event) return state;

  const changed =
    (updates.date && updates.date !== event.date) ||
    (updates.start_time && updates.start_time !== event.start_time) ||
    (updates.venue && updates.venue !== event.venue);

  // Notify registered attendees of changes
  const attendeeNotifs: Notification[] = changed
    ? state.registrations
        .filter((r) => r.event_id === eventId && r.status === "registered")
        .map((r) => ({
          id: newNotifId(),
          user_id: r.user_id,
          type: "event_update" as const,
          message: `"${event.title}" has been updated. Please check the new details.`,
          is_read: false,
          created_at: new Date().toISOString(),
          event_id: eventId,
        }))
    : [];

  return {
    ...state,
    events: state.events.map((e) =>
      e.id === eventId ? { ...e, ...updates } : e
    ),
    notifications: [...state.notifications, ...attendeeNotifs],
  };
}

export function cancelEvent(state: StoreState, eventId: string): StoreState {
  const event = state.events.find((e) => e.id === eventId);
  if (!event) return state;

  const attendeeNotifs: Notification[] = state.registrations
    .filter((r) => r.event_id === eventId)
    .map((r) => ({
      id: newNotifId(),
      user_id: r.user_id,
      type: "event_update" as const,
      message: `"${event.title}" has been cancelled. We're sorry for the inconvenience.`,
      is_read: false,
      created_at: new Date().toISOString(),
      event_id: eventId,
    }));

  return {
    ...state,
    events: state.events.map((e) =>
      e.id === eventId ? { ...e, status: "cancelled" } : e
    ),
    notifications: [...state.notifications, ...attendeeNotifs],
  };
}

export function deleteEventAdmin(state: StoreState, eventId: string): StoreState {
  return {
    ...state,
    events: state.events.filter((e) => e.id !== eventId),
    registrations: state.registrations.filter((r) => r.event_id !== eventId),
  };
}

export function deleteClubAdmin(state: StoreState, clubId: string): StoreState {
  return {
    ...state,
    clubs: state.clubs.filter((c) => c.id !== clubId),
    memberships: state.memberships.filter((m) => m.club_id !== clubId),
    events: state.events.filter((e) => e.club_id !== clubId),
  };
}

export function markNotificationsRead(state: StoreState, userId: string): StoreState {
  return {
    ...state,
    notifications: state.notifications.map((n) =>
      n.user_id === userId ? { ...n, is_read: true } : n
    ),
  };
}

export function updateProfile(
  state: StoreState,
  userId: string,
  updates: Partial<Pick<User, "name" | "department" | "bio">>
): StoreState {
  return {
    ...state,
    users: state.users.map((u) =>
      u.id === userId ? { ...u, ...updates } : u
    ),
  };
}

// ─── Account creation ─────────────────────────────────────────────────────────

// Registers a new account. New accounts always default to the "student" role.
export function registerUser(
  state: StoreState,
  data: { name: string; email: string; student_id: string; department: string }
): { state: StoreState; userId: string } {
  const id = newUserId();
  const newUser: User = {
    id,
    email: data.email,
    name: data.name,
    student_id: data.student_id,
    department: data.department,
    role: "student",
  };
  const welcome: Notification = {
    id: newNotifId(),
    user_id: id,
    type: "general",
    message: "Welcome to IUB Campus Hub! Explore events and join clubs to get started.",
    is_read: false,
    created_at: new Date().toISOString(),
  };
  return {
    state: {
      ...state,
      users: [...state.users, newUser],
      notifications: [...state.notifications, welcome],
    },
    userId: id,
  };
}

// ─── Role requests (student → super admin) ────────────────────────────────────

export function submitRoleRequest(
  state: StoreState,
  userId: string,
  payload: Omit<RoleRequest, "id" | "user_id" | "status" | "created_at">
): StoreState {
  const user = state.users.find((u) => u.id === userId);
  const req: RoleRequest = {
    id: newRoleReqId(),
    user_id: userId,
    status: "pending",
    created_at: new Date().toISOString(),
    ...payload,
  };

  const target =
    payload.kind === "create_club"
      ? `to create "${payload.club_name}"`
      : `to become ${payload.requested_role} of ${
          state.clubs.find((c) => c.id === payload.club_id)?.name ?? "a club"
        }`;

  const adminNotifs: Notification[] = superAdminIds(state).map((adminId) => ({
    id: newNotifId(),
    user_id: adminId,
    type: "role_request" as const,
    message: `${user?.name ?? "A student"} has requested ${target}.`,
    is_read: false,
    created_at: new Date().toISOString(),
    club_id: payload.club_id,
  }));

  return {
    ...state,
    roleRequests: [...state.roleRequests, req],
    notifications: [...state.notifications, ...adminNotifs],
  };
}

export function reviewRoleRequest(
  state: StoreState,
  requestId: string,
  action: "approved" | "rejected"
): StoreState {
  const req = state.roleRequests.find((r) => r.id === requestId);
  if (!req) return state;

  let newState: StoreState = {
    ...state,
    roleRequests: state.roleRequests.map((r) =>
      r.id === requestId ? { ...r, status: action } : r
    ),
  };

  let userMessage: string;

  if (action === "approved") {
    // Promote requester to club_admin.
    newState = {
      ...newState,
      users: newState.users.map((u) =>
        u.id === req.user_id ? { ...u, role: "club_admin" } : u
      ),
    };

    if (req.kind === "create_club") {
      const clubId = newClubId();
      const newClub: Club = {
        id: clubId,
        name: req.club_name ?? "New Club",
        short_name: (req.club_name ?? "NC")
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 4),
        description: req.club_description ?? "",
        category: req.club_category ?? "General",
        admin_user_id: req.user_id,
        member_count: 1,
        cover_url:
          "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop&auto=format",
        founded: String(new Date().getFullYear()),
        contact_email: state.users.find((u) => u.id === req.user_id)?.email ?? "",
      };
      const founderMem: Membership = {
        id: newMemId(),
        user_id: req.user_id,
        club_id: clubId,
        status: "approved",
        applied_at: new Date().toISOString(),
        role: req.requested_role,
      };
      newState = {
        ...newState,
        clubs: [...newState.clubs, newClub],
        memberships: [...newState.memberships, founderMem],
      };
      userMessage = `Your request to create "${req.club_name}" has been approved! You are now its ${req.requested_role}.`;
    } else {
      // lead_existing: make them the club admin/officer.
      const existingMem = newState.memberships.find(
        (m) => m.user_id === req.user_id && m.club_id === req.club_id
      );
      newState = {
        ...newState,
        clubs: newState.clubs.map((c) =>
          c.id === req.club_id ? { ...c, admin_user_id: req.user_id } : c
        ),
        memberships: existingMem
          ? newState.memberships.map((m) =>
              m.id === existingMem.id
                ? { ...m, status: "approved", role: req.requested_role }
                : m
            )
          : [
              ...newState.memberships,
              {
                id: newMemId(),
                user_id: req.user_id,
                club_id: req.club_id!,
                status: "approved",
                applied_at: new Date().toISOString(),
                role: req.requested_role,
              },
            ],
      };
      const clubName = newState.clubs.find((c) => c.id === req.club_id)?.name ?? "the club";
      userMessage = `Your request to become ${req.requested_role} of ${clubName} has been approved!`;
    }
  } else {
    userMessage =
      req.kind === "create_club"
        ? `Your request to create "${req.club_name}" has been declined.`
        : `Your request for an officer role has been declined.`;
  }

  const userNotif: Notification = {
    id: newNotifId(),
    user_id: req.user_id,
    type: "role_request",
    message: userMessage,
    is_read: false,
    created_at: new Date().toISOString(),
    club_id: req.club_id,
  };

  return { ...newState, notifications: [...newState.notifications, userNotif] };
}

// Super admin directly changes a user's role.
export function changeUserRole(
  state: StoreState,
  userId: string,
  newRole: UserRole
): StoreState {
  const user = state.users.find((u) => u.id === userId);
  if (!user || user.role === newRole) return state;

  const label: Record<UserRole, string> = {
    student: "Student",
    club_admin: "Club Admin",
    super_admin: "Super Admin",
  };

  const notif: Notification = {
    id: newNotifId(),
    user_id: userId,
    type: "role_request",
    message: `An administrator has changed your account role to ${label[newRole]}.`,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  return {
    ...state,
    users: state.users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
    notifications: [...state.notifications, notif],
  };
}
