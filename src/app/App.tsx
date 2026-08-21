import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
  useParams,
  useLocation,
} from "react-router";

import { toast, Toaster } from "sonner";
import { format, parseISO, isPast } from "date-fns";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Bell,
  User as UserIcon,
  Menu,
  ChevronRight,
  Search,
  Plus,
  Clock,
  MapPin,
  Ticket,
  AlertCircle,
  CheckCircle2,
  XCircle,
  List,
  UserCheck,
  Settings,
  Trash2,
  Edit3,
  BookOpen,
  Shield,
  UserCog,
  BadgeCheck,
  Hourglass,
  ChevronDown,
  ArrowLeft,
  Globe,
  CalendarCheck,
  Share2,
  CalendarPlus,
  Download,
  Repeat,
  MailCheck,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./components/ui/tabs";
import {
  Avatar,
  AvatarFallback,
} from "./components/ui/avatar";
import { Separator } from "./components/ui/separator";
import { Textarea } from "./components/ui/textarea";
import { Label } from "./components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import {
  downloadICS,
  googleCalendarUrl,
  shareEvent,
  checkInCode,
  parseCheckInCode,
  getOccurrences,
  recurrenceLabel,
  formatEventTime,
} from "./lib/eventUtils";
import { QRCodeSVG } from "qrcode.react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type {
  StoreState,
  User,
  UserRole,
  ClubRole,
  Club,
  Event,
  Notification,
  RoleRequest,
} from "./lib/store";
import {
  initialState,
  registerForEvent,
  cancelRegistration,
  applyToClub,
  reviewMembership,
  removeMember,
  assignClubRoles,
  updateMemberRole,
  createEvent,
  updateEvent,
  cancelEvent,
  deleteEventAdmin,
  deleteClubAdmin,
  markNotificationsRead,
  updateProfile,
  registerUser,
  submitRoleRequest,
  reviewRoleRequest,
  changeUserRole,
  seedCounters,
  setCheckIn,
  toggleEventException,
  sendDigest,
} from "./lib/store";
import { authService } from "./services/authService";
import {
  fetchAppState,
  persistAppState,
} from "./services/stateService";
import {
  fetchClubMembers,
  assignRoles as assignClubRolesApi,
  updateMemberRole as updateMemberRoleApi,
  deleteMember as deleteMemberApi,
  type GetClubMembersResponse,
  type MemberSummary,
} from "./services/memberService";

function createEmptyStore(): StoreState {
  return {
    ...initialState,
    users: [],
    clubs: [],
    events: [],
    registrations: [],
    memberships: [],
    notifications: [],
    roleRequests: [],
    currentUserId: "",
  };
}

function cloneStore(state: StoreState): StoreState {
  return {
    ...state,
    users: state.users.map((u) => ({ ...u })),
    clubs: state.clubs.map((c) => ({ ...c })),
    events: state.events.map((e) => ({
      ...e,
      tags: [...e.tags],
      exception_dates: e.exception_dates
        ? [...e.exception_dates]
        : undefined,
    })),
    registrations: state.registrations.map((r) => ({ ...r })),
    memberships: state.memberships.map((m) => ({ ...m })),
    notifications: state.notifications.map((n) => ({ ...n })),
    roleRequests: state.roleRequests.map((r) => ({ ...r })),
  };
}

function createDemoStore(): StoreState {
  const next = cloneStore(initialState);
  next.currentUserId = "";
  seedCounters(next);
  return next;
}

// ─── Auth Context ─────────────────────────────────────────────────────────────

interface AuthContextValue {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    student_id: string;
    department: string;
    password: string;
  }) => Promise<void>;
  switchRole: (userId: string) => void;
  logout: () => void;
  isStudent: boolean;
  isClubAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue>(
  {} as AuthContextValue,
);
const useAuth = () => useContext(AuthContext);

// ─── Data Context ─────────────────────────────────────────────────────────────

interface DataContextValue {
  store: StoreState;
  doRegister: (eventId: string) => void;
  doCancel: (eventId: string) => void;
  doApplyClub: (clubId: string) => void;
  doReviewMembership: (
    membershipId: string,
    action: "approved" | "rejected",
  ) => void;
  doRemoveMember: (membershipId: string) => void;
  doAssignRoles: (clubId: string) => void;
  doUpdateMemberRole: (membershipId: string, newRole: ClubRole) => void;
  doCreateEvent: (
    data: Omit<
      Event,
      "id" | "registered_count" | "waitlisted_count"
    >,
  ) => void;
  doUpdateEvent: (
    eventId: string,
    updates: Partial<Event>,
  ) => void;
  doCancelEvent: (eventId: string) => void;
  doDeleteEvent: (eventId: string) => void;
  doDeleteClub: (clubId: string) => void;
  doMarkNotificationsRead: () => void;
  doUpdateProfile: (
    updates: Partial<Pick<User, "name" | "department" | "bio">>,
  ) => void;
  doRegisterUser: (data: {
    name: string;
    email: string;
    student_id: string;
    department: string;
  }) => string;
  doSubmitRoleRequest: (
    payload: Omit<
      RoleRequest,
      "id" | "user_id" | "status" | "created_at"
    >,
  ) => void;
  doReviewRoleRequest: (
    requestId: string,
    action: "approved" | "rejected",
  ) => void;
  doChangeUserRole: (userId: string, newRole: UserRole) => void;
  doCheckIn: (registrationId: string, value: boolean) => void;
  doToggleException: (eventId: string, date: string) => void;
  doSendDigest: () => void;
}

const DataContext = createContext<DataContextValue>(
  {} as DataContextValue,
);
const useData = () => useContext(DataContext);

// ─── Providers ────────────────────────────────────────────────────────────────

function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const [store, setStore] = useState<StoreState>(createEmptyStore);
  // Always-current ref so callbacks with [] deps can read the latest store
  // without going stale.
  const storeRef = React.useRef<StoreState>(store);
  storeRef.current = store;

  const [currentUserId, setCurrentUserId] = useState<
    string | null
  >(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isBackendAvailable, setIsBackendAvailable] =
    useState(true);

  const currentUser =
    store.users.find((u) => u.id === currentUserId) ?? null;

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const snapshot = await fetchAppState();
        if (cancelled) return;
        seedCounters(snapshot.store);
        setStore(snapshot.store);
        setCurrentUserId(snapshot.currentUserId);
        setIsBackendAvailable(true);
      } catch (error) {
        console.error("Failed to load backend state.", error);
        const demoStore = createDemoStore();
        if (cancelled) return;
        setStore(demoStore);
        setCurrentUserId(null);
        setIsBackendAvailable(false);
        toast.info("Backend unavailable — demo mode enabled", {
          description:
            "Using local seeded demo data for login and browsing.",
        });
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isBootstrapping || !isBackendAvailable) return;
    void persistAppState({ store, currentUserId }).catch((error) => {
      console.error("Failed to persist backend state.", error);
      toast.error("Failed to sync changes", {
        description:
          "Your latest updates were not saved to the backend.",
      });
    });
  }, [
    store,
    currentUserId,
    isBootstrapping,
    isBackendAvailable,
  ]);

  const login = useCallback(
    async (email: string, password: string) => {
      const userId = await authService.login({ email, password });
      try {
        const snapshot = await fetchAppState();
        seedCounters(snapshot.store);
        setStore(snapshot.store);
        setCurrentUserId(userId);
        setIsBackendAvailable(true);
      } catch (error) {
        console.error("Backend state unavailable after login.", error);
        const demoStore = createDemoStore();
        demoStore.currentUserId = userId;
        setStore(demoStore);
        setCurrentUserId(userId);
        setIsBackendAvailable(false);
      }
    },
    [],
  );

  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      student_id: string;
      department: string;
      password: string;
    }) => {
      const userId = await authService.register(payload);
      const snapshot = await fetchAppState();
      seedCounters(snapshot.store);
      setStore(snapshot.store);
      setCurrentUserId(userId);
    },
    [],
  );

  const switchRole = useCallback((userId: string) => {
    setCurrentUserId(userId);
    setStore((s) => ({ ...s, currentUserId: userId }));
  }, []);

  const logout = useCallback(() => {
    void authService.logout().catch((error) => {
      console.error("Failed to log out on backend.", error);
      toast.error("Logout failed", {
        description: "Could not close your backend session.",
      });
    });
    setCurrentUserId(null);
    setStore((s) => ({ ...s, currentUserId: "" }));
  }, []);

  const doRegister = useCallback(
    (eventId: string) => {
      setStore((s) => {
        const event = s.events.find((e) => e.id === eventId)!;
        const isFull = event.registered_count >= event.capacity;
        const next = registerForEvent(
          s,
          currentUserId ?? "",
          eventId,
        );
        toast.success(
          isFull
            ? "Added to waitlist"
            : "Registered successfully!",
          {
            description: isFull
              ? `You joined the waitlist for "${event.title}".`
              : `See you at "${event.title}"!`,
          },
        );
        return next;
      });
    },
    [currentUserId],
  );

  const doCancel = useCallback(
    (eventId: string) => {
      setStore((s) => {
        const event = s.events.find((e) => e.id === eventId)!;
        const next = cancelRegistration(
          s,
          currentUserId ?? "",
          eventId,
        );
        toast.info("Registration cancelled", {
          description: `Cancelled for "${event.title}".`,
        });
        return next;
      });
    },
    [currentUserId],
  );

  const doApplyClub = useCallback(
    (clubId: string) => {
      setStore((s) => {
        const club = s.clubs.find((c) => c.id === clubId)!;
        const next = applyToClub(
          s,
          currentUserId ?? "",
          clubId,
        );
        toast.success("Application submitted", {
          description: `Your request to join ${club.name} has been sent.`,
        });
        return next;
      });
    },
    [currentUserId],
  );

  const doReviewMembership = useCallback(
    (membershipId: string, action: "approved" | "rejected") => {
      setStore((s) => {
        const mem = s.memberships.find(
          (m) => m.id === membershipId,
        );
        const user = s.users.find((u) => u.id === mem?.user_id);
        const next = reviewMembership(s, membershipId, action);
        toast.success(
          action === "approved"
            ? "Member approved"
            : "Application rejected",
          {
            description: `${user?.name}'s request was ${action}.`,
          },
        );
        return next;
      });
    },
    [],
  );

  const doRemoveMember = useCallback((membershipId: string) => {
    // Read current values via ref to avoid stale closure.
    const mem = storeRef.current.memberships.find((m) => m.id === membershipId);
    const clubId = mem?.club_id ?? "";
    const userName = storeRef.current.users.find((u) => u.id === mem?.user_id)?.name ?? "Member";

    // Optimistic local update.
    setStore((s) => removeMember(s, membershipId));
    toast.info("Member removed", { description: `${userName} removed from club.` });

    // Persist to DB — count is re-derived from actual rows on the backend.
    if (clubId) {
      void deleteMemberApi(clubId, membershipId).catch(() => {
        toast.error("Failed to sync removal with server");
      });
    }
  }, []);

  const doAssignRoles = useCallback((clubId: string) => {
    void assignClubRolesApi(clubId)
      .then((result) => {
        // Replace local membership roles with authoritative DB values.
        setStore((s) => {
          const roleMap = new Map(result.members.map((m) => [m.id, m]));
          return {
            ...s,
            memberships: s.memberships.map((existing) => {
              const api = roleMap.get(existing.id);
              return api
                ? { ...existing, role: api.role ?? existing.role, committee_type: api.committee_type ?? existing.committee_type }
                : existing;
            }),
          };
        });
        toast.success("Roles assigned", {
          description: "Executive and sub-committee roles have been randomly assigned.",
        });
      })
      .catch(() => {
        // Fallback: local algorithm when backend is unreachable.
        setStore((s) => assignClubRoles(s, clubId));
        toast.success("Roles assigned", {
          description: "Executive and sub-committee roles have been randomly assigned.",
        });
      });
  }, []);

  const doUpdateMemberRole = useCallback(
    (membershipId: string, newRole: ClubRole) => {
      const mem = storeRef.current.memberships.find((m) => m.id === membershipId);
      const clubId = mem?.club_id ?? "";

      // Optimistic local update.
      setStore((s) => {
        try {
          return updateMemberRole(s, membershipId, newRole);
        } catch {
          return s;
        }
      });

      // Persist to DB; backend enforces exec-role limits.
      if (clubId) {
        void updateMemberRoleApi(clubId, membershipId, newRole)
          .then(() => toast.success("Role updated"))
          .catch((err) => {
            toast.error("Role update failed", {
              description: err instanceof Error ? err.message : undefined,
            });
          });
      } else {
        toast.success("Role updated");
      }
    },
    [],
  );

  const doCreateEvent = useCallback(
    (
      data: Omit<
        Event,
        "id" | "registered_count" | "waitlisted_count"
      >,
    ) => {
      setStore((s) => {
        const next = createEvent(s, data);
        toast.success("Event created", {
          description: `"${data.title}" is now published.`,
        });
        return next;
      });
    },
    [],
  );

  const doUpdateEvent = useCallback(
    (eventId: string, updates: Partial<Event>) => {
      setStore((s) => {
        const next = updateEvent(s, eventId, updates);
        toast.success("Event updated");
        return next;
      });
    },
    [],
  );

  const doCancelEvent = useCallback((eventId: string) => {
    setStore((s) => {
      const event = s.events.find((e) => e.id === eventId)!;
      const next = cancelEvent(s, eventId);
      toast.warning("Event cancelled", {
        description: `"${event.title}" cancelled. Attendees notified.`,
      });
      return next;
    });
  }, []);

  const doDeleteEvent = useCallback((eventId: string) => {
    setStore((s) => {
      const next = deleteEventAdmin(s, eventId);
      toast.info("Event deleted");
      return next;
    });
  }, []);

  const doDeleteClub = useCallback((clubId: string) => {
    setStore((s) => {
      const next = deleteClubAdmin(s, clubId);
      toast.info("Club removed");
      return next;
    });
  }, []);

  const doMarkNotificationsRead = useCallback(() => {
    setStore((s) =>
      markNotificationsRead(s, currentUserId ?? ""),
    );
  }, [currentUserId]);

  const doUpdateProfile = useCallback(
    (
      updates: Partial<
        Pick<User, "name" | "department" | "bio">
      >,
    ) => {
      setStore((s) => {
        const next = updateProfile(
          s,
          currentUserId ?? "",
          updates,
        );
        toast.success("Profile updated");
        return next;
      });
    },
    [currentUserId],
  );

  const doRegisterUser = useCallback(
    (data: {
      name: string;
      email: string;
      student_id: string;
      department: string;
    }) => {
      const { state: next, userId } = registerUser(store, data);
      setStore(next);
      return userId;
    },
    [store],
  );

  const doSubmitRoleRequest = useCallback(
    (
      payload: Omit<
        RoleRequest,
        "id" | "user_id" | "status" | "created_at"
      >,
    ) => {
      setStore((s) => {
        const next = submitRoleRequest(
          s,
          currentUserId ?? "",
          payload,
        );
        toast.success("Request submitted", {
          description:
            "The Student Affairs office will review your request.",
        });
        return next;
      });
    },
    [currentUserId],
  );

  const doReviewRoleRequest = useCallback(
    (requestId: string, action: "approved" | "rejected") => {
      setStore((s) => {
        const next = reviewRoleRequest(s, requestId, action);
        toast.success(
          action === "approved"
            ? "Request approved"
            : "Request rejected",
        );
        return next;
      });
    },
    [],
  );

  const doChangeUserRole = useCallback(
    (userId: string, newRole: UserRole) => {
      setStore((s) => {
        const next = changeUserRole(s, userId, newRole);
        toast.success("User role updated");
        return next;
      });
    },
    [],
  );

  const doCheckIn = useCallback(
    (registrationId: string, value: boolean) => {
      setStore((s) => setCheckIn(s, registrationId, value));
    },
    [],
  );

  const doToggleException = useCallback(
    (eventId: string, date: string) => {
      setStore((s) => {
        const wasSkipped = (
          s.events.find((e) => e.id === eventId)
            ?.exception_dates ?? []
        ).includes(date);
        const next = toggleEventException(s, eventId, date);
        toast.info(
          wasSkipped ? "Session restored" : "Session cancelled",
          {
            description: `${wasSkipped ? "Re-added" : "Skipped"} the ${date} occurrence.`,
          },
        );
        return next;
      });
    },
    [],
  );

  const doSendDigest = useCallback(() => {
    setStore((s) => {
      const next = sendDigest(s, currentUserId ?? "");
      toast.success("Digest sent", {
        description:
          "Your reminder digest is in your notifications.",
      });
      return next;
    });
  }, [currentUserId]);

  const authValue: AuthContextValue = {
    currentUser,
    login,
    register,
    switchRole,
    logout,
    isStudent: currentUser?.role === "student",
    isClubAdmin: currentUser?.role === "club_admin",
    isSuperAdmin: currentUser?.role === "super_admin",
  };

  if (isBootstrapping) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Loading campus hub...
        </p>
      </div>
    );
  }

  const dataValue: DataContextValue = {
    store,
    doRegister,
    doCancel,
    doApplyClub,
    doReviewMembership,
    doRemoveMember,
    doAssignRoles,
    doUpdateMemberRole,
    doCreateEvent,
    doUpdateEvent,
    doCancelEvent,
    doDeleteEvent,
    doDeleteClub,
    doMarkNotificationsRead,
    doUpdateProfile,
    doRegisterUser,
    doSubmitRoleRequest,
    doReviewRoleRequest,
    doChangeUserRole,
    doCheckIn,
    doToggleException,
    doSendDigest,
  };

  return (
    <AuthContext.Provider value={authValue}>
      <DataContext.Provider value={dataValue}>
        {children}
      </DataContext.Provider>
    </AuthContext.Provider>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function capacityColor(pct: number) {
  if (pct >= 100) return "bg-destructive";
  if (pct >= 80) return "bg-accent";
  return "bg-primary";
}

function roleBadge(role: string) {
  const map: Record<string, string> = {
    student: "bg-secondary text-secondary-foreground",
    club_admin: "bg-accent/15 text-accent",
    super_admin: "bg-primary/15 text-primary",
  };
  return map[role] ?? "bg-muted text-muted-foreground";
}

function categoryColor(cat: string) {
  const map: Record<string, string> = {
    Technology: "bg-primary/10 text-primary border-primary/30",
    Academic:
      "bg-secondary/15 text-secondary-foreground border-secondary/40",
    "Arts & Culture":
      "bg-accent/15 text-accent-foreground border-accent/40",
    Social:
      "bg-quaternary/15 text-foreground border-quaternary/40",
  };
  return (
    map[cat] ??
    "bg-muted text-muted-foreground border-border-soft"
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────

function CapacityBar({
  registered,
  capacity,
}: {
  registered: number;
  capacity: number;
}) {
  const pct = Math.min(
    100,
    Math.round((registered / capacity) * 100),
  );
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground font-mono">
          {registered}/{capacity} seats
        </span>
        <span className="text-xs text-muted-foreground font-mono">
          {pct}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${capacityColor(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  const { store } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const club = store.clubs.find((c) => c.id === event.club_id);
  const myReg = store.registrations.find(
    (r) =>
      r.user_id === currentUser?.id && r.event_id === event.id,
  );
  const isFull = event.registered_count >= event.capacity;

  return (
    <Card
      className="group overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-all duration-200 border-border"
      onClick={() => navigate(`/events/${event.id}`)}
    >
      <div className="relative h-44 overflow-hidden bg-muted">
        <ImageWithFallback
          src={event.poster_url}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
        />
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          {event.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-black/50 text-white backdrop-blur-sm"
            >
              {tag}
            </span>
          ))}
        </div>
        {myReg && (
          <div className="absolute top-3 right-3">
            <span
              className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded ${
                myReg.status === "registered"
                  ? "bg-quaternary text-foreground"
                  : "bg-accent text-foreground"
              }`}
            >
              {myReg.status === "registered"
                ? "Registered"
                : "Waitlisted"}
            </span>
          </div>
        )}
        {event.status === "cancelled" && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              Cancelled
            </span>
          </div>
        )}
        {isFull && !myReg && event.status !== "cancelled" && (
          <div className="absolute bottom-3 right-3">
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-destructive/90 text-white">
              Full
            </span>
          </div>
        )}
      </div>

      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {event.title}
        </CardTitle>
        <CardDescription className="text-xs font-mono text-muted-foreground">
          {club?.short_name ?? club?.name}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-3 flex-1 space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="size-3 shrink-0" />
          <span>
            {format(parseISO(event.date), "d MMM yyyy")}
          </span>
          <span>·</span>
          <Clock className="size-3 shrink-0" />
          <span>{formatEventTime(event.start_time)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3 shrink-0" />
          <span className="line-clamp-1">{event.venue}</span>
        </div>
      </CardContent>

      <CardFooter className="pt-0 pb-4">
        <CapacityBar
          registered={event.registered_count}
          capacity={event.capacity}
        />
      </CardFooter>
    </Card>
  );
}

function ClubCard({ club }: { club: Club }) {
  const { store } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const membership = store.memberships.find(
    (m) =>
      m.user_id === currentUser?.id && m.club_id === club.id,
  );

  return (
    <Card
      className="group overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 border-border"
      onClick={() => navigate(`/clubs/${club.id}`)}
    >
      <div className="h-32 overflow-hidden bg-muted">
        <ImageWithFallback
          src={club.cover_url}
          alt={club.name}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
        />
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span
              className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${categoryColor(club.category)}`}
            >
              {club.category}
            </span>
            <CardTitle className="text-base mt-2 group-hover:text-primary transition-colors line-clamp-1">
              {club.name}
            </CardTitle>
          </div>
          {membership && (
            <BadgeCheck
              className={`size-5 shrink-0 mt-1 ${
                membership.status === "approved"
                  ? "text-quaternary"
                  : "text-accent"
              }`}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-4 space-y-2">
        <p className="text-xs text-muted-foreground line-clamp-2">
          {club.description}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
          <Users className="size-3" />
          <span>
            {club.member_count.toLocaleString()} members
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "primary",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: "primary" | "accent" | "green" | "purple";
}) {
  const bg = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/15 text-accent-foreground",
    green: "bg-quaternary/15 text-foreground",
    purple: "bg-secondary/15 text-secondary-foreground",
  }[color];

  return (
    <div className="bg-card border border-border rounded-lg p-5 flex items-start gap-4">
      <div className={`rounded-md p-2.5 ${bg}`}>
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-2xl font-bold font-mono text-foreground">
          {value}
        </p>
        <p className="text-sm font-medium text-foreground mt-0.5">
          {label}
        </p>
        {sub && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="size-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-foreground mb-1">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-4">
        {description}
      </p>
      {action}
    </div>
  );
}

function NotificationBell() {
  const { store, doMarkNotificationsRead } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const myNotifs = store.notifications
    .filter((n) => n.user_id === currentUser?.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 8);

  const unread = store.notifications.filter(
    (n) => n.user_id === currentUser?.id && !n.is_read,
  ).length;

  const notifIcon = (type: Notification["type"]) => {
    const map: Record<string, React.ElementType> = {
      registration: CheckCircle2,
      waitlist: Hourglass,
      event_update: AlertCircle,
      membership: UserCheck,
      role_request: BadgeCheck,
      general: Bell,
    };
    return map[type] ?? Bell;
  };

  function handleOpen(val: boolean) {
    setOpen(val);
    if (val && unread > 0) doMarkNotificationsRead();
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 max-h-[480px] overflow-y-auto"
      >
        <DropdownMenuLabel className="flex items-center justify-between sticky top-0 bg-popover z-10">
          <span>Notifications</span>
          {myNotifs.length > 0 && (
            <button
              onClick={() => {
                setOpen(false);
                navigate("/notifications");
              }}
              className="text-xs text-primary hover:underline font-normal"
            >
              View all
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {myNotifs.length === 0 ? (
          <div className="py-8 text-center">
            <Bell className="size-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No notifications yet
            </p>
          </div>
        ) : (
          myNotifs.map((n) => {
            const Icon = notifIcon(n.type);
            return (
              <div
                key={n.id}
                className={`flex gap-3 px-3 py-3 border-b border-border/50 last:border-0 ${!n.is_read ? "bg-primary/5" : ""}`}
              >
                <div
                  className={`mt-0.5 shrink-0 size-7 rounded-full flex items-center justify-center ${!n.is_read ? "bg-primary/10" : "bg-muted"}`}
                >
                  <Icon
                    className={`size-3.5 ${!n.is_read ? "text-primary" : "text-muted-foreground"}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-relaxed text-foreground">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-1">
                    {n.created_at.slice(0, 10)}
                  </p>
                </div>
                {!n.is_read && (
                  <span className="size-2 rounded-full bg-accent shrink-0 mt-1.5" />
                )}
              </div>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RoleSwitcher() {
  const { currentUser, switchRole } = useAuth();
  const { store } = useData();

  const roles = [
    { id: "user_1", label: "Student", icon: UserIcon },
    { id: "user_2", label: "Club Admin", icon: UserCog },
    { id: "user_3", label: "Super Admin", icon: Shield },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs border-border font-mono"
        >
          <Settings className="size-3" />
          Demo Role
          <ChevronDown className="size-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Switch demo user
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {roles.map(({ id, label, icon: Icon }) => {
          const user = store.users.find((u) => u.id === id);
          return (
            <DropdownMenuItem
              key={id}
              onClick={() => switchRole(id)}
              className={`gap-2 ${currentUser?.id === id ? "bg-secondary" : ""}`}
            >
              <Icon className="size-3.5" />
              <div>
                <div className="text-xs font-medium">
                  {label}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {user?.name}
                </div>
              </div>
              {currentUser?.id === id && (
                <CheckCircle2 className="size-3.5 ml-auto text-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Sidebar Nav ──────────────────────────────────────────────────────────────

function NavLink({
  to,
  icon: Icon,
  label,
  badge,
  onClick,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
  onClick?: () => void;
}) {
  const location = useLocation();
  const isActive =
    location.pathname === to ||
    (to !== "/" && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 relative ${
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      }`}
    >
      <Icon className="size-4 shrink-0" />
      <span>{label}</span>
      {badge != null && badge > 0 && (
        <span className="ml-auto size-5 flex items-center justify-center rounded-full bg-accent text-accent-foreground text-[10px] font-bold">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
      {isActive && (
        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-sidebar-primary rounded-l" />
      )}
    </Link>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { currentUser, isStudent, isClubAdmin, isSuperAdmin } =
    useAuth();
  const { store } = useData();

  const myClub = isClubAdmin
    ? store.clubs.find(
        (c) => c.admin_user_id === currentUser?.id,
      )
    : null;

  const pendingRequests = myClub
    ? store.memberships.filter(
        (m) =>
          m.club_id === myClub.id && m.status === "pending",
      ).length
    : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded bg-sidebar-primary/20 flex items-center justify-center">
            <BookOpen className="size-4 text-sidebar-primary" />
          </div>
          <div>
            <p
              className="text-sm font-bold text-sidebar-foreground leading-tight"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              IUB Campus
            </p>
            <p className="text-[10px] text-sidebar-foreground/50 font-mono uppercase tracking-wide">
              Event & Club Hub
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {!isSuperAdmin && (
          <NavLink
            to="/dashboard"
            icon={LayoutDashboard}
            label="Dashboard"
            onClick={onClose}
          />
        )}
        <NavLink
          to="/events"
          icon={CalendarDays}
          label="Events"
          onClick={onClose}
        />
        <NavLink
          to="/clubs"
          icon={Globe}
          label="Clubs"
          onClick={onClose}
        />
        {isStudent && (
          <NavLink
            to="/request-role"
            icon={BadgeCheck}
            label="Become an Organizer"
            onClick={onClose}
          />
        )}
        {isClubAdmin && myClub && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-[10px] font-mono font-medium text-sidebar-foreground/40 uppercase tracking-wider">
                Club Admin
              </p>
            </div>
            <NavLink
              to="/admin/dashboard"
              icon={LayoutDashboard}
              label="Admin Dashboard"
              onClick={onClose}
            />
            <NavLink
              to="/admin/events"
              icon={CalendarDays}
              label="Manage Events"
              onClick={onClose}
            />
            <NavLink
              to="/admin/requests"
              icon={UserCheck}
              label="Membership Requests"
              badge={pendingRequests}
              onClick={onClose}
            />
            <NavLink
              to="/admin/members"
              icon={Users}
              label="Member Roster"
              onClick={onClose}
            />
          </>
        )}

        {isSuperAdmin && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-[10px] font-mono font-medium text-sidebar-foreground/40 uppercase tracking-wider">
                Administration
              </p>
            </div>
            <NavLink
              to="/superadmin"
              icon={Shield}
              label="Admin Console"
              onClick={onClose}
            />
          </>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs font-semibold">
              {getInitials(currentUser?.name ?? "U")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">
              {currentUser?.name}
            </p>
            <p className="text-[10px] text-sidebar-foreground/50 font-mono truncate">
              {currentUser?.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopBarUserMenu() {
  const { currentUser, logout, isClubAdmin, isSuperAdmin } =
    useAuth();
  const navigate = useNavigate();

  const roleLabel = isSuperAdmin
    ? "Super Admin"
    : isClubAdmin
      ? "Club Admin"
      : "Student";

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2 h-9">
          <Avatar className="size-7">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {getInitials(currentUser?.name ?? "U")}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:block text-xs font-medium max-w-[100px] truncate">
            {currentUser?.name?.split(" ")[0]}
          </span>
          <ChevronDown className="size-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2">
          <p className="text-sm font-semibold truncate">
            {currentUser?.name}
          </p>
          <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">
            {currentUser?.email}
          </p>
          <span className="inline-flex items-center mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-primary/10 text-primary font-medium">
            {roleLabel}
          </span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <UserIcon className="size-4 mr-2" />
          My Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive"
        >
          <ArrowLeft className="size-4 mr-2" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!currentUser) return <>{children}</>;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden lg:flex flex-col w-60 bg-sidebar shrink-0 border-r border-sidebar-border">
        <SidebarContent />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="p-0 w-60 bg-sidebar border-sidebar-border"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation menu</SheetTitle>
            <SheetDescription>
              Primary navigation links for IUB Campus Hub.
            </SheetDescription>
          </SheetHeader>
          <SidebarContent
            onClose={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-card border-b border-border flex items-center gap-3 px-4 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-4" />
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <RoleSwitcher />
            <NotificationBell />
            <TopBarUserMenu />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

// ─── Protected Route ──────────────────────────────────────────────────────────

function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: "club_admin" | "super_admin";
}) {
  const { currentUser, isClubAdmin, isSuperAdmin } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (role === "club_admin" && !isClubAdmin)
    return <Navigate to="/dashboard" replace />;
  if (role === "super_admin" && !isSuperAdmin)
    return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

// ─── Login ────────────────────────────────────────────────────────────────────

// ─── Auth Brand Panel (shared) ────────────────────────────────────────────────

function CampusBuildingArt() {
  return (
    <svg
      viewBox="0 0 320 200"
      fill="none"
      className="w-full max-w-[300px] text-primary-foreground/80"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* ground line */}
      <line x1="10" y1="185" x2="310" y2="185" />
      {/* steps */}
      <path d="M70 185v-8h180v8" />
      <path d="M82 177v-8h156v8" />
      {/* base platform */}
      <path d="M92 169h136" />
      {/* columns */}
      {[104, 128, 152, 176, 200].map((x) => (
        <g key={x}>
          <line x1={x} y1="169" x2={x} y2="96" />
          <line x1={x + 12} y1="169" x2={x + 12} y2="96" />
          <path d={`M${x - 2} 96h16`} />
          <path d={`M${x - 2} 169h16`} />
        </g>
      ))}
      {/* architrave */}
      <path d="M96 96h132" />
      <path d="M96 88h132" />
      {/* pediment */}
      <path d="M92 88 160 52 232 88" />
      <path d="M160 52v36" />
      {/* clock / emblem in pediment */}
      <circle cx="160" cy="76" r="6" />
      {/* flag */}
      <line x1="160" y1="52" x2="160" y2="34" />
      <path d="M160 34h16v9h-16" />
      {/* side wings */}
      <path d="M92 169v-46h-28v46" />
      <path d="M228 169v-46h28v46" />
      <path d="M64 123h28" />
      <path d="M228 123h28" />
      {/* wing windows */}
      <rect x="70" y="131" width="7" height="12" rx="1" />
      <rect x="80" y="131" width="7" height="12" rx="1" />
      <rect x="243" y="131" width="7" height="12" rx="1" />
      <rect x="233" y="131" width="7" height="12" rx="1" />
      {/* trees */}
      <path d="M44 185v-20" />
      <circle cx="44" cy="158" r="10" />
      <path d="M276 185v-20" />
      <circle cx="276" cy="158" r="10" />
    </svg>
  );
}

function AuthBrandPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between w-[46%] max-w-[560px] bg-primary text-primary-foreground p-12 shrink-0">
      <div className="flex items-center gap-2.5">
        <BookOpen className="size-5" />
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-primary-foreground/70">
          IUB Campus Hub
        </span>
      </div>

      <div className="flex flex-col items-center text-center">
        <h1
          style={{ fontFamily: "'Outfit', sans-serif" }}
          className="text-3xl font-semibold leading-tight mb-10 max-w-xs"
        >
          Campus Event &amp; Club Management
        </h1>
        <CampusBuildingArt />
      </div>

      <div className="border-t border-white/15 pt-6">
        <p
          style={{ fontFamily: "'Outfit', sans-serif" }}
          className="text-lg font-semibold tracking-[0.35em]"
        >
          IUB
        </p>
        <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-primary-foreground/60 mt-1">
          Independent University, Bangladesh
        </p>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.endsWith("@iub.edu.bd")) {
      toast.error("Invalid email", {
        description: "Use your @iub.edu.bd email address.",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await login(normalizedEmail, password);
      navigate("/dashboard");
    } catch (error) {
      console.error("Login failed.", error);
      toast.error("Login failed", {
        description:
          "Could not sign you in. Please verify your credentials.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-stretch">
      <AuthBrandPanel />

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <BookOpen className="size-5 text-primary" />
              <span
                style={{ fontFamily: "'Outfit', sans-serif" }}
                className="font-semibold text-primary"
              >
                Campus Event &amp; Club Management
              </span>
            </div>
            <h1
              style={{ fontFamily: "'Outfit', sans-serif" }}
              className="text-3xl font-semibold text-foreground mb-1.5"
            >
              Welcome Back!
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to continue to your campus hub.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="yourname@iub.edu.bd"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? "Signing in..." : "Login"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
              or
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            className="w-full gap-2.5 font-normal"
            disabled
          >
            <GoogleIcon className="size-4" />
            Continue with Google (Coming soon)
          </Button>

          <p className="text-sm text-center text-muted-foreground mt-6">
            {"Don't have an account? "}
            <Link
              to="/register"
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}

// ─── Register ─────────────────────────────────────────────────────────────────

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    studentId: "",
    department: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalizedEmail = form.email.trim().toLowerCase();
    if (!normalizedEmail.endsWith("@iub.edu.bd")) {
      toast.error("Invalid email", {
        description:
          "Registration requires a valid @iub.edu.bd email.",
      });
      return;
    }
    if (form.password.length < 8) {
      toast.error("Weak password", {
        description: "Password must be at least 8 characters.",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await register({
        name: form.name,
        email: normalizedEmail,
        student_id: form.studentId,
        department: form.department,
        password: form.password,
      });
      toast.success("Account created!", {
        description:
          "Welcome to IUB Campus Hub. You're signed in as a student.",
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Registration failed.", error);
      toast.error("Registration failed", {
        description:
          "Could not create the account. Try a different email.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-stretch">
      <AuthBrandPanel />

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <BookOpen className="size-5 text-primary" />
              <span
                style={{ fontFamily: "'Outfit', sans-serif" }}
                className="font-semibold text-primary"
              >
                Campus Event &amp; Club Management
              </span>
            </div>
            <h1
              style={{ fontFamily: "'Outfit', sans-serif" }}
              className="text-3xl font-semibold mb-1.5"
            >
              Create Account
            </h1>
            <p className="text-sm text-muted-foreground">
              Join your campus hub with your IUB email.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                placeholder="e.g. Anika Rahman"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>IUB Email</Label>
              <Input
                type="email"
                placeholder="yourname@iub.edu.bd"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Student ID</Label>
                <Input
                  placeholder="e.g. 2321200"
                  value={form.studentId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      studentId: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select
                  value={form.department}
                  onValueChange={(v) =>
                    setForm({ ...form, department: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "CSE",
                      "EEE",
                      "BBA",
                      "MBA",
                      "ECO",
                      "PHY",
                      "ENG",
                      "SOC",
                    ].map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isSubmitting
                ? "Creating account..."
                : "Create Account"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
              or
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            className="w-full gap-2.5 font-normal"
            onClick={() => navigate("/login")}
          >
            <GoogleIcon className="size-4" />
            Sign up with Google
          </Button>

          <p className="text-sm text-center text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.endsWith("@iub.edu.bd")) {
      toast.error("Invalid email", {
        description: "Please enter your @iub.edu.bd email.",
      });
      return;
    }
    setSent(true);
    toast.success("OTP sent", {
      description: "Check your IUB inbox for the reset code.",
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-sm">
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="size-4" /> Back to login
        </button>
        <h1
          style={{ fontFamily: "'Outfit', sans-serif" }}
          className="text-2xl font-semibold mb-1"
        >
          Reset password
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Enter your IUB email and we'll send a reset OTP.
        </p>
        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="yourname@iub.edu.bd"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
            >
              Send reset OTP
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-quaternary/10 border border-quaternary/30 p-4 flex gap-3">
              <CheckCircle2 className="size-5 text-quaternary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  OTP sent!
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  We sent a 6-digit code to{" "}
                  <strong>{email}</strong>. Expires in 10
                  minutes.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/login")}
            >
              Back to login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Student Dashboard ────────────────────────────────────────────────────────

function DashboardPage() {
  const { store, doSendDigest } = useData();
  const { currentUser, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  // Super admins have no student dashboard — the Admin Console is their home.
  if (isSuperAdmin)
    return <Navigate to="/superadmin" replace />;

  const myRegs = store.registrations.filter(
    (r) => r.user_id === currentUser?.id,
  );
  const myRegistered = myRegs.filter(
    (r) => r.status === "registered",
  );
  const myWaitlisted = myRegs.filter(
    (r) => r.status === "waitlisted",
  );

  const upcomingEvents = myRegistered
    .map((r) => store.events.find((e) => e.id === r.event_id))
    .filter(Boolean)
    .filter(
      (e) =>
        e!.status !== "cancelled" && !isPast(parseISO(e!.date)),
    )
    .sort((a, b) => a!.date.localeCompare(b!.date))
    .slice(0, 3) as Event[];

  const myMemberships = store.memberships.filter(
    (m) =>
      m.user_id === currentUser?.id && m.status === "approved",
  );
  const myClubs = myMemberships
    .map((m) => store.clubs.find((c) => c.id === m.club_id))
    .filter(Boolean) as Club[];

  const unread = store.notifications.filter(
    (n) => n.user_id === currentUser?.id && !n.is_read,
  ).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
            Welcome back
          </p>
          <h1
            style={{ fontFamily: "'Outfit', sans-serif" }}
            className="text-3xl font-semibold text-foreground"
          >
            {currentUser?.name?.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {currentUser?.department} ·{" "}
            {currentUser?.student_id}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={doSendDigest}
        >
          <MailCheck className="size-4 mr-2" /> Email me a
          digest
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CalendarCheck}
          label="Registered"
          value={myRegistered.length}
          sub="upcoming events"
        />
        <StatCard
          icon={Hourglass}
          label="Waitlisted"
          value={myWaitlisted.length}
          color="accent"
        />
        <StatCard
          icon={Users}
          label="Clubs Joined"
          value={myClubs.length}
          color="green"
        />
        {unread > 0 && (
          <StatCard
            icon={Bell}
            label="Unread"
            value={unread}
            sub="notifications"
            color="purple"
          />
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2
            style={{ fontFamily: "'Outfit', sans-serif" }}
            className="text-lg font-semibold"
          >
            Your Upcoming Events
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary text-xs"
            onClick={() => navigate("/events")}
          >
            Browse all{" "}
            <ChevronRight className="size-3.5 ml-1" />
          </Button>
        </div>
        {upcomingEvents.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No upcoming events"
            description="You haven't registered for any events yet."
            action={
              <Button
                size="sm"
                onClick={() => navigate("/events")}
              >
                Explore events
              </Button>
            }
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </div>

      {myWaitlisted.length > 0 && (
        <div>
          <h2
            style={{ fontFamily: "'Outfit', sans-serif" }}
            className="text-lg font-semibold mb-4"
          >
            Waitlisted Events
          </h2>
          <div className="space-y-2">
            {myWaitlisted.map((r) => {
              const event = store.events.find(
                (e) => e.id === r.event_id,
              );
              if (!event) return null;
              return (
                <div
                  key={r.id}
                  onClick={() =>
                    navigate(`/events/${event.id}`)
                  }
                  className="flex items-center gap-4 p-3 bg-card border border-border rounded-lg hover:border-primary/30 cursor-pointer transition-colors"
                >
                  <Hourglass className="size-4 text-accent shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">
                      {event.title}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {format(parseISO(event.date), "d MMM")} ·{" "}
                      {formatEventTime(event.start_time)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-foreground border-accent/50 bg-accent/10 text-[10px] font-mono shrink-0"
                  >
                    Waitlisted
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2
            style={{ fontFamily: "'Outfit', sans-serif" }}
            className="text-lg font-semibold"
          >
            My Clubs
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary text-xs"
            onClick={() => navigate("/clubs")}
          >
            All clubs <ChevronRight className="size-3.5 ml-1" />
          </Button>
        </div>
        {myClubs.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No club memberships"
            description="Join a club to connect with fellow students."
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate("/clubs")}
              >
                Browse clubs
              </Button>
            }
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myClubs.map((c) => (
              <ClubCard key={c.id} club={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Event Feed ───────────────────────────────────────────────────────────────

function EventFeedPage() {
  const { store } = useData();
  const [search, setSearch] = useState("");
  const [clubFilter, setClubFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const events = store.events
    .filter((e) => e.status === "published")
    .filter((e) => {
      const q = search.toLowerCase();
      return (
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
      );
    })
    .filter(
      (e) => clubFilter === "all" || e.club_id === clubFilter,
    )
    .filter((e) => {
      if (statusFilter === "available")
        return e.registered_count < e.capacity;
      if (statusFilter === "full")
        return e.registered_count >= e.capacity;
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
          Discover
        </p>
        <h1
          style={{ fontFamily: "'Outfit', sans-serif" }}
          className="text-3xl font-semibold"
        >
          Campus Events
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {events.length} upcoming event
          {events.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <Select
          value={clubFilter}
          onValueChange={setClubFilter}
        >
          <SelectTrigger className="w-[180px] bg-card border-border">
            <SelectValue placeholder="All clubs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All clubs</SelectItem>
            {store.clubs.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.short_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-[140px] bg-card border-border">
            <SelectValue placeholder="Availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="full">
              Full (Waitlist)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Event Detail ─────────────────────────────────────────────────────────────

function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { store, doRegister, doCancel, doToggleException } =
    useData();
  const { currentUser, isClubAdmin } = useAuth();
  const navigate = useNavigate();

  const event = store.events.find((e) => e.id === id);
  const club = store.clubs.find((c) => c.id === event?.club_id);
  const myReg = store.registrations.find(
    (r) => r.user_id === currentUser?.id && r.event_id === id,
  );
  const isAdmin =
    isClubAdmin && club?.admin_user_id === currentUser?.id;

  if (!event) {
    return (
      <div className="p-6">
        <EmptyState
          icon={AlertCircle}
          title="Event not found"
          description="This event may have been removed."
        />
      </div>
    );
  }

  const isFull = event.registered_count >= event.capacity;
  const isEventPast = isPast(
    parseISO(`${event.date}T${event.end_time}`),
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="size-4" /> Back
      </button>

      <div className="relative h-64 sm:h-80 rounded-xl overflow-hidden bg-muted mb-6">
        <ImageWithFallback
          src={event.poster_url}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {event.status === "cancelled" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Badge className="bg-destructive text-white text-sm px-4 py-1.5">
              Event Cancelled
            </Badge>
          </div>
        )}
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
          {event.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-8">
        <div className="space-y-6">
          <div>
            <p className="text-xs font-mono text-muted-foreground mb-1">
              {club?.name}
            </p>
            <h1
              style={{ fontFamily: "'Outfit', sans-serif" }}
              className="text-3xl font-semibold leading-snug"
            >
              {event.title}
            </h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                icon: CalendarDays,
                label: "Date",
                value: format(
                  parseISO(event.date),
                  "EEEE, d MMMM yyyy",
                ),
              },
              {
                icon: Clock,
                label: "Time",
                value: `${formatEventTime(event.start_time)} – ${formatEventTime(event.end_time)}`,
              },
              {
                icon: MapPin,
                label: "Venue",
                value: event.venue,
              },
              {
                icon: Users,
                label: "Capacity",
                value: `${event.capacity} seats`,
              },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex gap-3 p-3 bg-card border border-border rounded-lg"
              >
                <Icon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {label}
                  </p>
                  <p className="text-sm font-medium">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div>
            <h2
              style={{ fontFamily: "'Outfit', sans-serif" }}
              className="font-semibold text-lg mb-3"
            >
              About this event
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {recurrenceLabel(event) && (
            <div>
              <Separator className="mb-6" />
              <div className="flex items-center gap-2 mb-3">
                <Repeat className="size-4 text-primary" />
                <h2
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                  className="font-semibold text-lg"
                >
                  Schedule
                </h2>
                <Badge
                  variant="outline"
                  className="text-xs font-mono"
                >
                  {recurrenceLabel(event)}
                </Badge>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {getOccurrences(event).map((occ) => (
                  <div
                    key={occ.date}
                    className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border ${
                      occ.skipped
                        ? "border-border/50 bg-muted/40 text-muted-foreground line-through"
                        : "border-border bg-card"
                    }`}
                  >
                    <span className="text-sm font-medium">
                      {format(
                        parseISO(occ.date),
                        "EEE, d MMM yyyy",
                      )}
                    </span>
                    {isAdmin ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs no-underline"
                        onClick={() =>
                          doToggleException(event.id, occ.date)
                        }
                      >
                        {occ.skipped ? "Restore" : "Cancel"}
                      </Button>
                    ) : (
                      occ.skipped && (
                        <Badge
                          variant="outline"
                          className="text-xs font-mono text-destructive border-destructive/30"
                        >
                          Cancelled
                        </Badge>
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(`/admin/events/edit/${event.id}`)
                }
              >
                <Edit3 className="size-3.5 mr-1.5" /> Edit Event
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(`/admin/events/${event.id}/roster`)
                }
              >
                <List className="size-3.5 mr-1.5" /> View Roster
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-semibold">
                  Availability
                </p>
                {isFull && (
                  <Badge
                    variant="outline"
                    className="text-destructive border-destructive/30 text-xs font-mono"
                  >
                    Full
                  </Badge>
                )}
                {!isFull && event.waitlisted_count > 0 && (
                  <Badge
                    variant="outline"
                    className="text-foreground border-accent/50 text-xs font-mono"
                  >
                    {event.waitlisted_count} waitlisted
                  </Badge>
                )}
              </div>
              <CapacityBar
                registered={event.registered_count}
                capacity={event.capacity}
              />
            </div>

            <Separator />

            {event.status === "cancelled" ? (
              <div className="rounded-md bg-destructive/8 border border-destructive/20 p-3 text-sm text-destructive text-center">
                This event has been cancelled.
              </div>
            ) : isEventPast ? (
              <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground text-center">
                This event has ended.
              </div>
            ) : myReg ? (
              <div className="space-y-3">
                <div
                  className={`rounded-md p-3 text-sm text-center font-medium ${
                    myReg.status === "registered"
                      ? "bg-quaternary/10 text-foreground border border-quaternary/30"
                      : "bg-accent/10 text-foreground border border-accent/30"
                  }`}
                >
                  {myReg.status === "registered" ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="size-4" /> You
                      are registered
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <Hourglass className="size-4" /> You are
                      on the waitlist
                    </span>
                  )}
                </div>
                {myReg.status === "registered" &&
                  (myReg.checked_in ? (
                    <div className="rounded-md bg-quaternary/15 border border-quaternary/40 p-3 text-xs text-foreground text-center font-medium flex items-center justify-center gap-1.5">
                      <BadgeCheck className="size-4" /> Checked
                      in
                      {myReg.checked_in_at &&
                        ` · ${format(parseISO(myReg.checked_in_at), "d MMM, HH:mm")}`}
                    </div>
                  ) : (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full"
                        >
                          <Ticket className="size-4 mr-2" />{" "}
                          Show Check-in QR
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-sm">
                        <DialogHeader>
                          <DialogTitle>
                            Your check-in ticket
                          </DialogTitle>
                          <DialogDescription>
                            Present this QR code at the event
                            entrance for contactless check-in.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col items-center gap-4 py-4">
                          <div className="bg-white p-4 rounded-xl border-2 border-border">
                            <QRCodeSVG
                              value={checkInCode(
                                event.id,
                                myReg.id,
                              )}
                              size={200}
                              level="M"
                            />
                          </div>
                          <p className="text-xs font-mono text-muted-foreground">
                            {currentUser?.name} · {event.title}
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full text-destructive hover:text-destructive border-destructive/30"
                    >
                      Cancel Registration
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        Cancel registration?
                      </DialogTitle>
                      <DialogDescription>
                        {myReg.status === "waitlisted"
                          ? "You will lose your waitlist spot."
                          : "Your spot may be given to someone on the waitlist."}
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline">
                        Keep my spot
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          doCancel(event.id);
                          navigate("/events");
                        }}
                      >
                        Yes, cancel
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ) : isFull ? (
              <div className="space-y-3">
                <div className="rounded-md bg-accent/10 border border-accent/30 p-3 text-xs text-foreground text-center">
                  This event is full. Join the waitlist and
                  you'll be notified if a spot opens.
                </div>
                <Button
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={() => doRegister(event.id)}
                >
                  <Hourglass className="size-4 mr-2" /> Join
                  Waitlist
                </Button>
              </div>
            ) : (
              <Button
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => doRegister(event.id)}
              >
                <Ticket className="size-4 mr-2" /> Register Now
              </Button>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <p className="text-xs font-mono text-muted-foreground">
              Add & share
            </p>
            <div className="grid grid-cols-1 gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <CalendarPlus className="size-4 mr-2" /> Add
                    to Calendar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-56"
                >
                  <DropdownMenuItem
                    onClick={() =>
                      window.open(
                        googleCalendarUrl(event, club),
                        "_blank",
                        "noopener",
                      )
                    }
                  >
                    <CalendarDays className="size-4 mr-2" />{" "}
                    Google Calendar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => downloadICS(event, club)}
                  >
                    <Download className="size-4 mr-2" />{" "}
                    Download .ics
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={async () => {
                  const result = await shareEvent(event);
                  if (result === "copied")
                    toast.success("Link copied", {
                      description:
                        "Event link copied to your clipboard.",
                    });
                  else if (result === "failed")
                    toast.error("Couldn't share", {
                      description:
                        "Please copy the page URL manually.",
                    });
                }}
              >
                <Share2 className="size-4 mr-2" /> Share Event
              </Button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs font-mono text-muted-foreground mb-2">
              Organised by
            </p>
            <div
              className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors"
              onClick={() => navigate(`/clubs/${club?.id}`)}
            >
              <div className="size-10 rounded-md overflow-hidden bg-muted shrink-0">
                <ImageWithFallback
                  src={club?.cover_url ?? ""}
                  alt={club?.name ?? ""}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {club?.name}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {club?.member_count?.toLocaleString()} members
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Club Directory ───────────────────────────────────────────────────────────

function ClubDirectoryPage() {
  const { store } = useData();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  const categories = Array.from(
    new Set(store.clubs.map((c) => c.category)),
  );
  const clubs = store.clubs
    .filter((c) => {
      const q = search.toLowerCase();
      return (
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    })
    .filter(
      (c) => catFilter === "all" || c.category === catFilter,
    );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
          Explore
        </p>
        <h1
          style={{ fontFamily: "'Outfit', sans-serif" }}
          className="text-3xl font-semibold"
        >
          Club Directory
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {clubs.length} clubs
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search clubs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {clubs.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clubs found"
          description="Try a different search."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {clubs.map((c) => (
            <ClubCard key={c.id} club={c} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Club Detail ──────────────────────────────────────────────────────────────

function ClubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { store, doApplyClub } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const club = store.clubs.find((c) => c.id === id);
  const membership = store.memberships.find(
    (m) => m.user_id === currentUser?.id && m.club_id === id,
  );
  const clubEvents = store.events
    .filter((e) => e.club_id === id && e.status === "published")
    .sort((a, b) => a.date.localeCompare(b.date));

  const clubMembers = store.memberships
    .filter((m) => m.club_id === id && m.status === "approved")
    .map((m) => ({
      ...m,
      user: store.users.find((u) => u.id === m.user_id),
    }));

  const adminUser = store.users.find(
    (u) => u.id === club?.admin_user_id,
  );

  if (!club) {
    return (
      <div className="p-6">
        <EmptyState
          icon={AlertCircle}
          title="Club not found"
          description=""
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="size-4" /> Back
      </button>

      <div className="relative h-52 rounded-xl overflow-hidden bg-muted mb-6">
        <ImageWithFallback
          src={club.cover_url}
          alt={club.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-5">
          <span
            className={`text-[11px] font-mono font-medium px-2.5 py-0.5 rounded border ${categoryColor(club.category)}`}
          >
            {club.category}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-8">
        <div className="space-y-6">
          <div>
            <h1
              style={{ fontFamily: "'Outfit', sans-serif" }}
              className="text-3xl font-semibold"
            >
              {club.name}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground font-mono">
              <span className="flex items-center gap-1">
                <Users className="size-3.5" />{" "}
                {club.member_count}
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3.5" /> Est.{" "}
                {club.founded}
              </span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {club.description}
          </p>

          <Separator />

          <div>
            <h2
              style={{ fontFamily: "'Outfit', sans-serif" }}
              className="font-semibold text-lg mb-4"
            >
              Upcoming Events
            </h2>
            {clubEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No upcoming events.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {clubEvents.slice(0, 4).map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            )}
          </div>

          {clubMembers.length > 0 && (
            <>
              <Separator />
              <div>
                <h2
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                  className="font-semibold text-lg mb-4"
                >
                  Members
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {clubMembers
                    .slice(0, 6)
                    .map(({ user, role }) =>
                      user ? (
                        <div
                          key={user.id}
                          className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg"
                        >
                          <Avatar className="size-8">
                            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {user.name}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {role ?? "Member"}
                            </p>
                          </div>
                        </div>
                      ) : null,
                    )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-sm">
              Membership
            </h3>
            {membership ? (
              <div
                className={`rounded-md p-3 text-sm text-center font-medium ${
                  membership.status === "approved"
                    ? "bg-quaternary/10 text-foreground border border-quaternary/30"
                    : membership.status === "pending"
                      ? "bg-accent/10 text-foreground border border-accent/30"
                      : "bg-destructive/8 text-destructive border border-destructive/20"
                }`}
              >
                {membership.status === "approved" && (
                  <span className="flex items-center justify-center gap-1.5">
                    <BadgeCheck className="size-4" /> You are a
                    member
                  </span>
                )}
                {membership.status === "pending" && (
                  <span className="flex items-center justify-center gap-1.5">
                    <Hourglass className="size-4" /> Application
                    pending
                  </span>
                )}
                {membership.status === "rejected" &&
                  "Application rejected"}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Join this club to participate in events and
                  connect with members.
                </p>
                <Button
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={() => doApplyClub(club.id)}
                >
                  Apply to Join
                </Button>
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <p className="text-xs font-mono text-muted-foreground">
              Contact
            </p>
            <div className="text-sm">{club.contact_email}</div>
            {adminUser && (
              <div className="flex items-center gap-2 pt-1 border-t border-border">
                <Avatar className="size-7">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                    {getInitials(adminUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs font-medium">
                    {adminUser.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Club Admin
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────

function ProfilePage() {
  const { currentUser } = useAuth();
  const { store, doUpdateProfile } = useData();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: currentUser?.name ?? "",
    department: currentUser?.department ?? "",
    bio: currentUser?.bio ?? "",
  });

  useEffect(() => {
    if (currentUser) {
      setForm({
        name: currentUser.name,
        department: currentUser.department,
        bio: currentUser.bio ?? "",
      });
    }
  }, [currentUser]);

  const myRegs = store.registrations.filter(
    (r) => r.user_id === currentUser?.id,
  );
  const myMems = store.memberships.filter(
    (m) =>
      m.user_id === currentUser?.id && m.status === "approved",
  );

  if (!currentUser) return null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
          Account
        </p>
        <h1
          style={{ fontFamily: "'Outfit', sans-serif" }}
          className="text-3xl font-semibold"
        >
          My Profile
        </h1>
      </div>

      <div className="grid lg:grid-cols-[1fr_240px] gap-6">
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                    {getInitials(currentUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    {currentUser.name}
                  </CardTitle>
                  <CardDescription className="font-mono text-xs mt-0.5">
                    {currentUser.email}
                  </CardDescription>
                  <Badge
                    className={`mt-2 text-xs font-mono ${roleBadge(currentUser.role)}`}
                    variant="outline"
                  >
                    {currentUser.role.replace("_", " ")}
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(!editing)}
              >
                <Edit3 className="size-3.5 mr-1.5" />{" "}
                {editing ? "Cancel" : "Edit"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {editing ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Select
                    value={form.department}
                    onValueChange={(v) =>
                      setForm({ ...form, department: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "CSE",
                        "EEE",
                        "BBA",
                        "MBA",
                        "ECO",
                        "PHY",
                        "ENG",
                        "SOC",
                      ].map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Bio</Label>
                  <Textarea
                    value={form.bio}
                    onChange={(e) =>
                      setForm({ ...form, bio: e.target.value })
                    }
                    rows={3}
                    placeholder="Tell us about yourself..."
                    className="resize-none"
                  />
                </div>
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => {
                    doUpdateProfile(form);
                    setEditing(false);
                  }}
                >
                  Save Changes
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-mono text-muted-foreground">
                      Student ID
                    </p>
                    <p className="text-sm font-medium mt-0.5">
                      {currentUser.student_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-mono text-muted-foreground">
                      Department
                    </p>
                    <p className="text-sm font-medium mt-0.5">
                      {currentUser.department}
                    </p>
                  </div>
                </div>
                {currentUser.bio && (
                  <div>
                    <p className="text-xs font-mono text-muted-foreground">
                      Bio
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {currentUser.bio}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <StatCard
            icon={Ticket}
            label="Events"
            value={myRegs.length}
            sub="registered total"
          />
          <StatCard
            icon={Users}
            label="Clubs"
            value={myMems.length}
            sub="active memberships"
            color="green"
          />
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs font-mono text-muted-foreground mb-2">
              My Clubs
            </p>
            <div className="space-y-2">
              {myMems.slice(0, 3).map((m) => {
                const club = store.clubs.find(
                  (c) => c.id === m.club_id,
                );
                return club ? (
                  <div
                    key={m.id}
                    className="text-xs font-medium truncate"
                  >
                    {club.short_name}
                  </div>
                ) : null;
              })}
              {myMems.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No memberships yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Notifications ────────────────────────────────────────────────────────────

function NotificationsPage() {
  const { store, doMarkNotificationsRead } = useData();
  const { currentUser } = useAuth();

  const notifs = store.notifications
    .filter((n) => n.user_id === currentUser?.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const unread = notifs.filter((n) => !n.is_read).length;

  const typeInfo = (type: Notification["type"]) => {
    const map: Record<
      string,
      { icon: React.ElementType; color: string }
    > = {
      registration: {
        icon: CheckCircle2,
        color: "text-quaternary",
      },
      waitlist: { icon: Hourglass, color: "text-accent" },
      event_update: {
        icon: AlertCircle,
        color: "text-secondary",
      },
      membership: { icon: UserCheck, color: "text-primary" },
      role_request: { icon: BadgeCheck, color: "text-primary" },
      general: { icon: Bell, color: "text-muted-foreground" },
    };
    return (
      map[type] ?? {
        icon: Bell,
        color: "text-muted-foreground",
      }
    );
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
            Inbox
          </p>
          <h1
            style={{ fontFamily: "'Outfit', sans-serif" }}
            className="text-3xl font-semibold"
          >
            Notifications
          </h1>
        </div>
        {unread > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={doMarkNotificationsRead}
          >
            Mark all read
          </Button>
        )}
      </div>

      {notifs.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All caught up"
          description="No notifications yet. Register for an event to get started."
        />
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => {
            const { icon: Icon, color } = typeInfo(n.type);
            return (
              <div
                key={n.id}
                className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                  !n.is_read
                    ? "bg-secondary/40 border-primary/20"
                    : "bg-card border-border"
                }`}
              >
                <div
                  className={`rounded-full p-2 shrink-0 ${!n.is_read ? "bg-primary/8" : "bg-muted"}`}
                >
                  <Icon
                    className={`size-4 ${!n.is_read ? color : "text-muted-foreground"}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm leading-relaxed ${!n.is_read ? "font-medium" : ""}`}
                  >
                    {n.message}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    {format(
                      parseISO(n.created_at),
                      "d MMM yyyy · HH:mm",
                    )}
                  </p>
                </div>
                {!n.is_read && (
                  <span className="size-2 rounded-full bg-accent shrink-0 mt-2" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

function AdminDashboardPage() {
  const { store } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const myClub = store.clubs.find(
    (c) => c.admin_user_id === currentUser?.id,
  );
  if (!myClub)
    return (
      <EmptyState
        icon={AlertCircle}
        title="No club found"
        description=""
      />
    );

  const myEvents = store.events.filter(
    (e) => e.club_id === myClub.id,
  );
  const upcoming = myEvents.filter(
    (e) =>
      e.status === "published" && !isPast(parseISO(e.date)),
  );
  const totalRegistrations = store.registrations.filter((r) =>
    myEvents.some((e) => e.id === r.event_id),
  ).length;
  const pendingReqs = store.memberships.filter(
    (m) => m.club_id === myClub.id && m.status === "pending",
  ).length;
  const approvedMems = store.memberships.filter(
    (m) => m.club_id === myClub.id && m.status === "approved",
  ).length;

  // Attendance analytics: registrations vs check-ins across this club's events.
  const chartData = myEvents
    .map((e) => {
      const regs = store.registrations.filter(
        (r) => r.event_id === e.id && r.status === "registered",
      );
      return {
        id: e.id,
        name:
          e.title.length > 18
            ? `${e.title.slice(0, 18)}…`
            : e.title,
        registrations: e.registered_count,
        checkedIn: regs.filter((r) => r.checked_in).length,
      };
    })
    .sort((a, b) => b.registrations - a.registrations)
    .slice(0, 6);
  const totalCheckedIn = store.registrations.filter(
    (r) =>
      myEvents.some((e) => e.id === r.event_id) && r.checked_in,
  ).length;
  const attendanceRate =
    totalRegistrations > 0
      ? Math.round((totalCheckedIn / totalRegistrations) * 100)
      : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
          Club Admin
        </p>
        <h1
          style={{ fontFamily: "'Outfit', sans-serif" }}
          className="text-3xl font-semibold"
        >
          {myClub.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1 font-mono">
          {myClub.short_name} · {myClub.category}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Members"
          value={approvedMems}
        />
        <StatCard
          icon={CalendarDays}
          label="Upcoming Events"
          value={upcoming.length}
          color="accent"
        />
        <StatCard
          icon={Ticket}
          label="Registrations"
          value={totalRegistrations}
          color="green"
        />
        <StatCard
          icon={UserCheck}
          label="Pending Requests"
          value={pendingReqs}
          color="purple"
        />
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2
            style={{ fontFamily: "'Outfit', sans-serif" }}
            className="text-lg font-semibold"
          >
            Event Engagement
          </h2>
          <div className="text-right">
            <p className="text-2xl font-mono font-bold text-quaternary">
              {attendanceRate}%
            </p>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
              attendance rate
            </p>
          </div>
        </div>
        {chartData.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No events yet"
            description="Create an event to see engagement analytics."
          />
        ) : (
          <ResponsiveContainer
            width="100%"
            height={Math.max(160, chartData.length * 46)}
          >
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              barCategoryGap={12}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fontSize: 11, fontFamily: "monospace" }}
                axisLine={false}
                tickLine={false}
              />
              <RTooltip
                cursor={{ fill: "var(--muted)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "2px solid var(--border)",
                  fontSize: 12,
                  fontFamily: "monospace",
                }}
                formatter={(value: number, name: string) => [
                  value,
                  name === "registrations"
                    ? "Registered"
                    : "Checked in",
                ]}
              />
              <Bar
                dataKey="registrations"
                radius={[0, 6, 6, 0]}
                fill="var(--primary)"
              >
                {chartData.map((d) => (
                  <Cell key={d.id} fill="var(--primary)" />
                ))}
              </Bar>
              <Bar
                dataKey="checkedIn"
                radius={[0, 6, 6, 0]}
                fill="var(--quaternary)"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="flex items-center gap-4 mt-3 text-xs font-mono text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-sm"
              style={{ background: "var(--primary)" }}
            />{" "}
            Registered
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-sm"
              style={{ background: "var(--quaternary)" }}
            />{" "}
            Checked in
          </span>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Button
          className="bg-primary hover:bg-primary/90 h-auto py-4 flex-col gap-1.5"
          onClick={() => navigate("/admin/events/new")}
        >
          <Plus className="size-5" />
          <span>Create Event</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex-col gap-1.5 border-border"
          onClick={() => navigate("/admin/requests")}
        >
          <UserCheck className="size-5" />
          <span>
            Review Requests{" "}
            {pendingReqs > 0 && `(${pendingReqs})`}
          </span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex-col gap-1.5 border-border"
          onClick={() => navigate("/admin/members")}
        >
          <List className="size-5" />
          <span>View Members</span>
        </Button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2
            style={{ fontFamily: "'Outfit', sans-serif" }}
            className="text-lg font-semibold"
          >
            Upcoming Events
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary text-xs"
            onClick={() => navigate("/admin/events")}
          >
            Manage all{" "}
            <ChevronRight className="size-3.5 ml-1" />
          </Button>
        </div>
        {upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No upcoming events"
            description="Create your first event to get started."
            action={
              <Button
                size="sm"
                onClick={() => navigate("/admin/events/new")}
              >
                Create Event
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {upcoming.slice(0, 5).map((e) => {
              const regs = store.registrations.filter(
                (r) =>
                  r.event_id === e.id &&
                  r.status === "registered",
              ).length;
              return (
                <div
                  key={e.id}
                  className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:border-primary/30 cursor-pointer transition-colors"
                  onClick={() =>
                    navigate(`/admin/events/${e.id}/roster`)
                  }
                >
                  <CalendarDays className="size-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {e.title}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {format(parseISO(e.date), "d MMM")} ·{" "}
                      {formatEventTime(e.start_time)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-mono font-semibold">
                      {regs}/{e.capacity}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      registrations
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Event Manage ─────────────────────────────────────────────────────────────

function EventManagePage() {
  const { store, doCancelEvent, doDeleteEvent } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const myClub = store.clubs.find(
    (c) => c.admin_user_id === currentUser?.id,
  );
  const myEvents = store.events
    .filter((e) => e.club_id === myClub?.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
            Club Admin
          </p>
          <h1
            style={{ fontFamily: "'Outfit', sans-serif" }}
            className="text-3xl font-semibold"
          >
            Manage Events
          </h1>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90"
          onClick={() => navigate("/admin/events/new")}
        >
          <Plus className="size-4 mr-1.5" /> New Event
        </Button>
      </div>

      {myEvents.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events yet"
          description="Create your first event."
          action={
            <Button
              size="sm"
              onClick={() => navigate("/admin/events/new")}
            >
              Create Event
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {myEvents.map((e) => {
            const regs = store.registrations.filter(
              (r) =>
                r.event_id === e.id &&
                r.status === "registered",
            ).length;
            const waitlisted = store.registrations.filter(
              (r) =>
                r.event_id === e.id &&
                r.status === "waitlisted",
            ).length;
            return (
              <div
                key={e.id}
                className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg"
              >
                <div className="w-14 h-14 rounded-md overflow-hidden bg-muted shrink-0">
                  <ImageWithFallback
                    src={e.poster_url}
                    alt={e.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold truncate">
                      {e.title}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-mono shrink-0 ${
                        e.status === "published"
                          ? "text-quaternary border-quaternary/40"
                          : e.status === "cancelled"
                            ? "text-destructive border-destructive/30"
                            : "text-muted-foreground"
                      }`}
                    >
                      {e.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {format(parseISO(e.date), "d MMM yyyy")} ·{" "}
                    {formatEventTime(e.start_time)}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {regs}/{e.capacity} registered
                    {waitlisted > 0 &&
                      ` · ${waitlisted} waitlisted`}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() =>
                      navigate(`/admin/events/${e.id}/roster`)
                    }
                    title="View roster"
                  >
                    <List className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() =>
                      navigate(`/admin/events/edit/${e.id}`)
                    }
                    title="Edit event"
                  >
                    <Edit3 className="size-3.5" />
                  </Button>
                  {e.status === "published" && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-accent"
                          title="Cancel event"
                        >
                          <XCircle className="size-3.5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            Cancel event?
                          </DialogTitle>
                          <DialogDescription>
                            All {regs} registered attendees will
                            be notified.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline">
                            Keep event
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => doCancelEvent(e.id)}
                          >
                            Cancel event
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        title="Delete event"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete event?</DialogTitle>
                        <DialogDescription>
                          This action is irreversible. All
                          registrations will be removed.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline">Keep</Button>
                        <Button
                          variant="destructive"
                          onClick={() => doDeleteEvent(e.id)}
                        >
                          Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Event Form ───────────────────────────────────────────────────────────────

function EventFormPage() {
  const { id } = useParams<{ id: string }>();
  const { store, doCreateEvent, doUpdateEvent } = useData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const isEdit = !!id;
  const existingEvent = store.events.find((e) => e.id === id);
  const myClub = store.clubs.find(
    (c) => c.admin_user_id === currentUser?.id,
  );

  const [form, setForm] = useState({
    title: existingEvent?.title ?? "",
    description: existingEvent?.description ?? "",
    date: existingEvent?.date ?? "",
    start_time: existingEvent?.start_time ?? "",
    end_time: existingEvent?.end_time ?? "",
    venue: existingEvent?.venue ?? "",
    capacity: existingEvent?.capacity ?? 50,
    poster_url: existingEvent?.poster_url ?? "",
    tags: (existingEvent?.tags ?? []).join(", "),
    status: (existingEvent?.status ?? "published") as
      "draft" | "published",
    recurrence: (existingEvent?.recurrence ?? "none") as
      "none" | "daily" | "weekly" | "monthly",
    recurrence_count: existingEvent?.recurrence_count ?? 4,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!myClub) return;
    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const recurrenceFields = {
      recurrence: form.recurrence,
      recurrence_count:
        form.recurrence === "none"
          ? 1
          : Math.max(1, Number(form.recurrence_count)),
    };

    if (isEdit && existingEvent) {
      doUpdateEvent(existingEvent.id, {
        title: form.title,
        description: form.description,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        venue: form.venue,
        capacity: Number(form.capacity),
        poster_url: form.poster_url,
        tags,
        status: form.status,
        ...recurrenceFields,
      });
    } else {
      doCreateEvent({
        title: form.title,
        description: form.description,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        venue: form.venue,
        capacity: Number(form.capacity),
        poster_url: form.poster_url,
        tags,
        status: form.status,
        club_id: myClub.id,
        created_by: currentUser!.id,
        ...recurrenceFields,
        exception_dates: [],
      });
    }
    navigate("/admin/events");
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="size-4" /> Back
      </button>
      <h1
        style={{ fontFamily: "'Outfit', sans-serif" }}
        className="text-2xl font-semibold mb-6"
      >
        {isEdit ? "Edit Event" : "Create New Event"}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label>Event Title *</Label>
          <Input
            value={form.title}
            onChange={(e) =>
              setForm({ ...form, title: e.target.value })
            }
            placeholder="e.g. IUB Hackathon 2026"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Description *</Label>
          <Textarea
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            rows={4}
            placeholder="Describe the event..."
            className="resize-none"
            required
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Date *</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm({ ...form, date: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Start Time *</Label>
            <Input
              type="time"
              value={form.start_time}
              onChange={(e) =>
                setForm({ ...form, start_time: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>End Time *</Label>
            <Input
              type="time"
              value={form.end_time}
              onChange={(e) =>
                setForm({ ...form, end_time: e.target.value })
              }
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Venue *</Label>
          <Input
            value={form.venue}
            onChange={(e) =>
              setForm({ ...form, venue: e.target.value })
            }
            placeholder="e.g. Main Auditorium, Block A"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Max Capacity *</Label>
            <Input
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) =>
                setForm({
                  ...form,
                  capacity: Number(e.target.value),
                })
              }
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) =>
                setForm({
                  ...form,
                  status: v as "draft" | "published",
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published">
                  Published
                </SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Repeats</Label>
            <Select
              value={form.recurrence}
              onValueChange={(v) =>
                setForm({
                  ...form,
                  recurrence: v as typeof form.recurrence,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  Does not repeat
                </SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.recurrence !== "none" && (
            <div className="space-y-1.5">
              <Label>Number of sessions</Label>
              <Input
                type="number"
                min={1}
                max={52}
                value={form.recurrence_count}
                onChange={(e) =>
                  setForm({
                    ...form,
                    recurrence_count: Number(e.target.value),
                  })
                }
              />
            </div>
          )}
        </div>
        {form.recurrence !== "none" && (
          <p className="text-xs text-muted-foreground -mt-2">
            Creates a series of{" "}
            {Math.max(1, Number(form.recurrence_count))}{" "}
            {form.recurrence} sessions starting from the date
            above. You can cancel individual sessions later from
            the event page.
          </p>
        )}
        <div className="space-y-1.5">
          <Label>Poster Image URL</Label>
          <Input
            value={form.poster_url}
            onChange={(e) =>
              setForm({ ...form, poster_url: e.target.value })
            }
            placeholder="https://images.unsplash.com/..."
          />
        </div>
        <div className="space-y-1.5">
          <Label>Tags</Label>
          <Input
            value={form.tags}
            onChange={(e) =>
              setForm({ ...form, tags: e.target.value })
            }
            placeholder="e.g. Tech, Workshop, Competition"
          />
          <p className="text-xs text-muted-foreground">
            Comma-separated list of tags
          </p>
        </div>
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90"
          >
            {isEdit ? "Save Changes" : "Create Event"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Attendee Roster ──────────────────────────────────────────────────────────

const FAKE_NAMES = [
  "Sadia Islam",
  "Rafiq Hossain",
  "Mehrin Akter",
  "Arif Khan",
  "Tasnuva Begum",
  "Nabil Ahmed",
  "Samiha Chowdhury",
  "Imran Ali",
  "Lamia Rahman",
  "Sakib Hassan",
  "Puja Roy",
  "Zahid Hasan",
  "Ayesha Siddiqua",
  "Rony Das",
  "Farhan Kabir",
  "Nadia Sultana",
  "Tashfin Ahmed",
  "Minhaj Uddin",
  "Rabeya Khatun",
  "Asif Iqbal",
  "Sharmin Akter",
  "Jubayer Islam",
  "Maliha Hoque",
  "Rifat Hossain",
  "Sumona Begum",
  "Masud Rana",
  "Dilruba Khanam",
  "Tanveer Ahmed",
  "Shamima Nasrin",
  "Rashed Khan",
];

function AttendeeRosterPage() {
  const { id } = useParams<{ id: string }>();
  const { store, doCheckIn } = useData();
  const navigate = useNavigate();
  const [scanOpen, setScanOpen] = useState(false);
  const [scanCode, setScanCode] = useState("");

  const event = store.events.find((e) => e.id === id);
  const realRegs = store.registrations.filter(
    (r) => r.event_id === id,
  );
  const realRegistered = realRegs.filter(
    (r) => r.status === "registered",
  );
  const realWaitlisted = realRegs.filter(
    (r) => r.status === "waitlisted",
  );
  const checkedInCount = realRegistered.filter(
    (r) => r.checked_in,
  ).length;

  const fakePadding = Math.max(
    0,
    (event?.registered_count ?? 0) - realRegistered.length,
  );
  const fakeAttendees = FAKE_NAMES.slice(0, fakePadding);

  const handleScan = () => {
    const parsed = parseCheckInCode(scanCode);
    if (!parsed || parsed.eventId !== id) {
      toast.error("Invalid code", {
        description: "That QR code isn't for this event.",
      });
      return;
    }
    const reg = realRegistered.find(
      (r) => r.id === parsed.registrationId,
    );
    if (!reg) {
      toast.error("Not found", {
        description: "No matching registration for this event.",
      });
      return;
    }
    const attendee = store.users.find(
      (u) => u.id === reg.user_id,
    );
    if (reg.checked_in) {
      toast.info("Already checked in", {
        description: `${attendee?.name} is already checked in.`,
      });
    } else {
      doCheckIn(reg.id, true);
      toast.success("Checked in", {
        description: `${attendee?.name} is now checked in.`,
      });
    }
    setScanCode("");
    setScanOpen(false);
  };

  if (!event) {
    return (
      <div className="p-6">
        <EmptyState
          icon={AlertCircle}
          title="Event not found"
          description=""
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="size-4" /> Back
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-mono text-muted-foreground mb-1">
            Attendee Roster
          </p>
          <h1
            style={{ fontFamily: "'Outfit', sans-serif" }}
            className="text-2xl font-semibold"
          >
            {event.title}
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            {format(parseISO(event.date), "d MMM yyyy")} ·{" "}
            {formatEventTime(event.start_time)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-mono font-bold">
            {event.registered_count}/{event.capacity}
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            registered
          </p>
          <p className="text-xs text-quaternary font-mono mt-0.5">
            {checkedInCount} checked in
          </p>
          {event.waitlisted_count > 0 && (
            <p className="text-xs text-accent font-mono mt-0.5">
              {event.waitlisted_count} waitlisted
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 mb-4">
        <CapacityBar
          registered={event.registered_count}
          capacity={event.capacity}
        />
        <Dialog open={scanOpen} onOpenChange={setScanOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 bg-primary hover:bg-primary/90">
              <CheckCircle2 className="size-4 mr-2" /> Scan
              Check-in
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Scan attendee QR</DialogTitle>
              <DialogDescription>
                Scan the attendee's QR with any reader and paste
                the decoded code below, or enter it manually to
                check them in.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label
                htmlFor="scan-code"
                className="text-xs font-mono"
              >
                Check-in code
              </Label>
              <Input
                id="scan-code"
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value)}
                placeholder="CHK|event_1|reg_1"
                onKeyDown={(e) =>
                  e.key === "Enter" && handleScan()
                }
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setScanOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleScan}
                disabled={!scanCode.trim()}
              >
                Check in
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="registered" className="mt-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="registered">
            Registered ({event.registered_count})
          </TabsTrigger>
          <TabsTrigger value="waitlisted">
            Waitlist ({event.waitlisted_count})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registered" className="mt-4">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-mono">
                    #
                  </TableHead>
                  <TableHead className="text-xs font-mono">
                    Name
                  </TableHead>
                  <TableHead className="text-xs font-mono">
                    Department
                  </TableHead>
                  <TableHead className="text-xs font-mono">
                    Registered At
                  </TableHead>
                  <TableHead className="text-xs font-mono text-right">
                    Check-in
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {realRegistered.map((r, i) => {
                  const user = store.users.find(
                    (u) => u.id === r.user_id,
                  );
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {i + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="size-6">
                            <AvatarFallback className="bg-secondary text-secondary-foreground text-[10px]">
                              {getInitials(user?.name ?? "?")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {user?.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {user?.department}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {format(
                          parseISO(r.registered_at),
                          "d MMM · HH:mm",
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.checked_in ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-quaternary hover:text-quaternary h-7"
                            onClick={() =>
                              doCheckIn(r.id, false)
                            }
                          >
                            <BadgeCheck className="size-3.5 mr-1" />{" "}
                            In
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7"
                            onClick={() =>
                              doCheckIn(r.id, true)
                            }
                          >
                            Check in
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {fakeAttendees.map((name, i) => (
                  <TableRow key={`fake_${i}`}>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {realRegistered.length + i + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6">
                          <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                            {getInitials(name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      CSE
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      —
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono text-muted-foreground">
                      —
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="waitlisted" className="mt-4">
          {realWaitlisted.length === 0 &&
          event.waitlisted_count === 0 ? (
            <EmptyState
              icon={Hourglass}
              title="No one on waitlist"
              description="Waitlist is empty."
            />
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs font-mono">
                      Position
                    </TableHead>
                    <TableHead className="text-xs font-mono">
                      Name
                    </TableHead>
                    <TableHead className="text-xs font-mono">
                      Joined Waitlist
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {realWaitlisted.map((r, i) => {
                    const user = store.users.find(
                      (u) => u.id === r.user_id,
                    );
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs font-mono text-accent font-semibold">
                          #{i + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="size-6">
                              <AvatarFallback className="bg-accent/10 text-foreground text-[10px]">
                                {getInitials(user?.name ?? "?")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {user?.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {format(
                            parseISO(r.registered_at),
                            "d MMM · HH:mm",
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Membership Requests ──────────────────────────────────────────────────────

function MembershipRequestsPage() {
  const { store, doReviewMembership } = useData();
  const { currentUser } = useAuth();

  const myClub = store.clubs.find(
    (c) => c.admin_user_id === currentUser?.id,
  );
  const pending = store.memberships
    .filter(
      (m) => m.club_id === myClub?.id && m.status === "pending",
    )
    .map((m) => ({
      ...m,
      user: store.users.find((u) => u.id === m.user_id),
    }));

  const reviewed = store.memberships
    .filter(
      (m) => m.club_id === myClub?.id && m.status !== "pending",
    )
    .sort((a, b) => b.applied_at.localeCompare(a.applied_at))
    .slice(0, 10)
    .map((m) => ({
      ...m,
      user: store.users.find((u) => u.id === m.user_id),
    }));

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
          Club Admin
        </p>
        <h1
          style={{ fontFamily: "'Outfit', sans-serif" }}
          className="text-2xl font-semibold"
        >
          Membership Requests
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {myClub?.name}
        </p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="bg-muted">
          <TabsTrigger value="pending">
            Pending{" "}
            {pending.length > 0 && `(${pending.length})`}
          </TabsTrigger>
          <TabsTrigger value="reviewed">History</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pending.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="No pending requests"
              description="All requests have been reviewed."
            />
          ) : (
            <div className="space-y-3">
              {pending.map(({ user, ...mem }) => (
                <div
                  key={mem.id}
                  className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg"
                >
                  <Avatar className="size-10 shrink-0">
                    <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">
                      {getInitials(user?.name ?? "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">
                      {user?.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {user?.department} · {user?.student_id}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      Applied{" "}
                      {format(
                        parseISO(mem.applied_at),
                        "d MMM yyyy",
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="bg-quaternary hover:bg-quaternary/80 text-foreground"
                      onClick={() =>
                        doReviewMembership(mem.id, "approved")
                      }
                    >
                      <CheckCircle2 className="size-3.5 mr-1" />{" "}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive/30 hover:bg-destructive/8"
                      onClick={() =>
                        doReviewMembership(mem.id, "rejected")
                      }
                    >
                      <XCircle className="size-3.5 mr-1" />{" "}
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviewed" className="mt-4">
          {reviewed.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No history"
              description=""
            />
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs font-mono">
                      Name
                    </TableHead>
                    <TableHead className="text-xs font-mono">
                      Department
                    </TableHead>
                    <TableHead className="text-xs font-mono">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-mono">
                      Date
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewed.map(({ user, ...mem }) => (
                    <TableRow key={mem.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="size-6">
                            <AvatarFallback className="bg-secondary text-secondary-foreground text-[10px]">
                              {getInitials(user?.name ?? "?")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {user?.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {user?.department}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-mono ${
                            mem.status === "approved"
                              ? "text-foreground border-quaternary/40 bg-quaternary/10"
                              : "text-destructive border-destructive/30 bg-destructive/5"
                          }`}
                        >
                          {mem.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {format(
                          parseISO(mem.applied_at),
                          "d MMM yyyy",
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Member Roster ────────────────────────────────────────────────────────────

const CLUB_ROLES: ClubRole[] = [
  "President",
  "Vice President",
  "General Secretary",
  "Treasurer",
  "Organizing Secretary",
  "Event Manager",
  "Member",
];

// Role badge colour: exec roles get a distinct tint.
const EXEC_ROLES = new Set([
  "President",
  "Vice President",
  "General Secretary",
  "Treasurer",
  "Organizing Secretary",
]);

function roleBadgeClass(role: string | undefined) {
  if (!role) return "text-primary border-primary/30";
  if (EXEC_ROLES.has(role))
    return "text-quaternary border-quaternary/40 bg-quaternary/10";
  if (role === "Event Manager")
    return "text-accent border-accent/40 bg-accent/10";
  return "text-primary border-primary/30";
}

/**
 * MemberRosterPage
 *
 * Single source of truth: both `totalCount` and `members` come from the same
 * GET /clubs/:clubId/members response so the count and the rendered list are
 * always in sync with the database.
 *
 * Mutations (remove, assign-roles, role-edit) call the backend directly and
 * re-fetch after each operation — no local derivation, no slice tricks.
 */
function MemberRosterPage() {
  const { store } = useData();
  const { currentUser } = useAuth();

  const myClub = store.clubs.find(
    (c) => c.admin_user_id === currentUser?.id,
  );

  // ── API-sourced state ────────────────────────────────────────────────────
  const [apiData, setApiData] =
    useState<GetClubMembersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [assigningRoles, setAssigningRoles] = useState(false);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  // Fetch members + authoritative count from the same DB query.
  const refresh = useCallback(async () => {
    if (!myClub) return;
    setLoading(true);
    try {
      const data = await fetchClubMembers(myClub.id);
      setApiData(data);
    } catch {
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  }, [myClub?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // totalCount = DB aggregate; members = DB rows — always the same dataset.
  const totalCount = apiData?.totalCount ?? 0;
  const members: MemberSummary[] = apiData?.members ?? [];

  // ── Mutations ────────────────────────────────────────────────────────────

  async function handleRemove(membershipId: string, memberName: string) {
    if (!myClub) return;
    setRemovingId(membershipId);
    try {
      await deleteMemberApi(myClub.id, membershipId);
      toast.info("Member removed", {
        description: `${memberName} removed from ${myClub.name}.`,
      });
      await refresh();
    } catch (err) {
      toast.error("Remove failed", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setRemovingId(null);
    }
  }

  async function handleAssignRoles() {
    if (!myClub) return;
    setAssigningRoles(true);
    try {
      // Backend runs Fisher-Yates shuffle, enforces exec-role limits, then
      // returns the updated list + count from the same query.
      const result = await assignClubRolesApi(myClub.id);
      setApiData(result);
      toast.success("Roles assigned", {
        description:
          "Executive and sub-committee roles have been randomly assigned.",
      });
    } catch (err) {
      toast.error("Role assignment failed", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setAssigningRoles(false);
    }
  }

  async function handleUpdateRole(membershipId: string, newRole: ClubRole) {
    if (!myClub) return;
    setUpdatingRoleId(membershipId);
    try {
      // Backend enforces exec-role limits before persisting.
      await updateMemberRoleApi(myClub.id, membershipId, newRole);
      toast.success("Role updated");
      await refresh();
    } catch (err) {
      toast.error("Role update failed", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setUpdatingRoleId(null);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
            Club Admin
          </p>
          <h1
            style={{ fontFamily: "'Outfit', sans-serif" }}
            className="text-2xl font-semibold"
          >
            Member Roster
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {myClub?.name} ·{" "}
            {loading ? "…" : `${totalCount} approved members`}
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => void handleAssignRoles()}
          disabled={assigningRoles || loading || totalCount === 0}
        >
          {assigningRoles ? "Assigning…" : "Assign Roles"}
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center font-mono">
          Loading members…
        </p>
      ) : members.length === 0 ? (
        <EmptyState icon={Users} title="No members yet" description="" />
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-mono">Member</TableHead>
                <TableHead className="text-xs font-mono">Department</TableHead>
                <TableHead className="text-xs font-mono">Role</TableHead>
                <TableHead className="text-xs font-mono">Joined</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((mem) => (
                <TableRow key={mem.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
                          {getInitials(mem.name ?? "?")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{mem.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {mem.student_id}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {mem.department}
                  </TableCell>

                  <TableCell>
                    <Select
                      value={mem.role ?? "Member"}
                      onValueChange={(val) =>
                        void handleUpdateRole(mem.id, val as ClubRole)
                      }
                      disabled={updatingRoleId === mem.id}
                    >
                      <SelectTrigger
                        className={`h-7 w-44 text-[10px] font-mono border ${roleBadgeClass(mem.role ?? "Member")}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CLUB_ROLES.map((r) => (
                          <SelectItem
                            key={r}
                            value={r}
                            className="text-xs font-mono"
                          >
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {format(parseISO(mem.applied_at), "d MMM yyyy")}
                  </TableCell>

                  <TableCell>
                    {mem.user_id !== currentUser?.id && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive hover:bg-destructive/8"
                            disabled={removingId === mem.id}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Remove member?</DialogTitle>
                            <DialogDescription>
                              {mem.name} will be removed from{" "}
                              {myClub?.name}. They can re-apply later.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline">Cancel</Button>
                            <Button
                              variant="destructive"
                              disabled={removingId === mem.id}
                              onClick={() =>
                                void handleRemove(mem.id, mem.name)
                              }
                            >
                              {removingId === mem.id
                                ? "Removing…"
                                : "Remove"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─── Super Admin Console ──────────────────────────────────────────────────────

// ─── Request Club Role (student → super admin) ────────────────────────────────

function RequestRolePage() {
  const navigate = useNavigate();
  const { store, doSubmitRoleRequest } = useData();
  const { currentUser, isStudent } = useAuth();

  const [kind, setKind] = useState<
    "lead_existing" | "create_club"
  >("create_club");
  const [requestedRole, setRequestedRole] =
    useState("President");
  const [clubId, setClubId] = useState("");
  const [clubName, setClubName] = useState("");
  const [clubCategory, setClubCategory] = useState("");
  const [clubDescription, setClubDescription] = useState("");
  const [message, setMessage] = useState("");

  const myPending = store.roleRequests.filter(
    (r) =>
      r.user_id === currentUser?.id && r.status === "pending",
  );

  if (!isStudent) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <EmptyState
          icon={BadgeCheck}
          title="You're already an organizer"
          description="Only students can request a new organizer role or club."
        />
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (kind === "lead_existing" && !clubId) {
      toast.error("Select a club", {
        description: "Choose the club you'd like to lead.",
      });
      return;
    }
    if (
      kind === "create_club" &&
      (!clubName || !clubCategory)
    ) {
      toast.error("Missing details", {
        description: "Enter a club name and category.",
      });
      return;
    }
    doSubmitRoleRequest({
      kind,
      requested_role: requestedRole,
      club_id: kind === "lead_existing" ? clubId : undefined,
      club_name: kind === "create_club" ? clubName : undefined,
      club_category:
        kind === "create_club" ? clubCategory : undefined,
      club_description:
        kind === "create_club" ? clubDescription : undefined,
      message: message || undefined,
    });
    navigate("/dashboard");
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
          Organizer Access
        </p>
        <h1
          style={{ fontFamily: "'Outfit', sans-serif" }}
          className="text-3xl font-semibold"
        >
          Become a Club Organizer
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Want to run a club or take on an officer role? Submit
          a request to the Student Affairs office (Super Admin).
          If approved, your account will be upgraded to a Club
          Admin.
        </p>
      </div>

      {myPending.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-accent/10 border border-accent/30 rounded-lg">
          <Hourglass className="size-5 text-accent shrink-0" />
          <p className="text-sm text-foreground">
            You have <strong>{myPending.length}</strong> pending
            request
            {myPending.length !== 1 ? "s" : ""} awaiting review.
          </p>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Request details
            </CardTitle>
            <CardDescription>
              Tell us what you'd like to do.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setKind("create_club")}
                className={`text-left rounded-lg border p-4 transition-colors ${
                  kind === "create_club"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <Plus className="size-5 text-primary mb-2" />
                <p className="text-sm font-medium">
                  Create a new club
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Start a brand-new club and become its founder.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setKind("lead_existing")}
                className={`text-left rounded-lg border p-4 transition-colors ${
                  kind === "lead_existing"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <UserCog className="size-5 text-primary mb-2" />
                <p className="text-sm font-medium">
                  Officer of an existing club
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Become President, Secretary, etc. of a club.
                </p>
              </button>
            </div>

            <div className="space-y-1.5">
              <Label>Requested Role</Label>
              <Select
                value={requestedRole}
                onValueChange={setRequestedRole}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "President",
                    "Vice President",
                    "General Secretary",
                    "Treasurer",
                    "Organizing Secretary",
                  ].map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {kind === "lead_existing" ? (
              <div className="space-y-1.5">
                <Label>Club</Label>
                <Select
                  value={clubId}
                  onValueChange={setClubId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a club" />
                  </SelectTrigger>
                  <SelectContent>
                    {store.clubs.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label>Club Name</Label>
                  <Input
                    placeholder="e.g. IUB Robotics Club"
                    value={clubName}
                    onChange={(e) =>
                      setClubName(e.target.value)
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select
                    value={clubCategory}
                    onValueChange={setClubCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "Technology",
                        "Academic",
                        "Arts & Culture",
                        "Social",
                        "Sports",
                        "Business",
                      ].map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Club Description</Label>
                  <Textarea
                    placeholder="What is this club about? What activities will it run?"
                    value={clubDescription}
                    onChange={(e) =>
                      setClubDescription(e.target.value)
                    }
                    rows={3}
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label>Message to Admins (optional)</Label>
              <Textarea
                placeholder="Anything else the reviewers should know?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90"
            >
              Submit Request
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

function SuperAdminPage() {
  const {
    store,
    doDeleteEvent,
    doDeleteClub,
    doReviewRoleRequest,
    doChangeUserRole,
  } = useData();
  const [tab, setTab] = useState("requests");
  const [search, setSearch] = useState("");

  const pendingRoleRequests = store.roleRequests.filter(
    (r) => r.status === "pending",
  );

  const allEvents = store.events.filter((e) => {
    const q = search.toLowerCase();
    return !q || e.title.toLowerCase().includes(q);
  });
  const allClubs = store.clubs.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q);
  });
  const allUsers = store.users.filter((u) => {
    const q = search.toLowerCase();
    return (
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const totalRegistrations = store.registrations.length;
  const pendingAllRequests = store.memberships.filter(
    (m) => m.status === "pending",
  ).length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
          Super Admin
        </p>
        <h1
          style={{ fontFamily: "'Outfit', sans-serif" }}
          className="text-3xl font-semibold"
        >
          Admin Console
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          System-wide management dashboard
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={store.users.length}
        />
        <StatCard
          icon={Globe}
          label="Active Clubs"
          value={store.clubs.length}
          color="accent"
        />
        <StatCard
          icon={CalendarDays}
          label="Total Events"
          value={store.events.length}
          color="green"
        />
        <StatCard
          icon={Ticket}
          label="Registrations"
          value={totalRegistrations}
          color="purple"
        />
      </div>

      {(pendingRoleRequests.length > 0 ||
        pendingAllRequests > 0) && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 bg-accent/10 border border-accent/30 rounded-lg">
          <AlertCircle className="size-5 text-accent shrink-0" />
          <p className="text-sm text-foreground">
            {pendingRoleRequests.length > 0 && (
              <>
                <strong>{pendingRoleRequests.length}</strong>{" "}
                organizer request
                {pendingRoleRequests.length !== 1
                  ? "s"
                  : ""}{" "}
                awaiting your review.
              </>
            )}
            {pendingRoleRequests.length > 0 &&
              pendingAllRequests > 0 &&
              " · "}
            {pendingAllRequests > 0 && (
              <>
                <strong>{pendingAllRequests}</strong> club
                membership request
                {pendingAllRequests !== 1 ? "s" : ""} across all
                clubs.
              </>
            )}
          </p>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search events, clubs, or users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card border-border"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="requests">
            Requests
            {pendingRoleRequests.length > 0
              ? ` (${pendingRoleRequests.length})`
              : ""}
          </TabsTrigger>
          <TabsTrigger value="events">
            Events ({allEvents.length})
          </TabsTrigger>
          <TabsTrigger value="clubs">
            Clubs ({allClubs.length})
          </TabsTrigger>
          <TabsTrigger value="users">
            Users ({allUsers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="requests"
          className="mt-4 space-y-3"
        >
          {store.roleRequests.length === 0 ? (
            <EmptyState
              icon={BadgeCheck}
              title="No organizer requests"
              description="Student requests to lead or create clubs will appear here."
            />
          ) : (
            [...store.roleRequests]
              .sort((a, b) =>
                b.created_at.localeCompare(a.created_at),
              )
              .map((r) => {
                const applicant = store.users.find(
                  (u) => u.id === r.user_id,
                );
                const club = r.club_id
                  ? store.clubs.find((c) => c.id === r.club_id)
                  : null;
                return (
                  <div
                    key={r.id}
                    className="bg-card border border-border rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="size-9 shrink-0">
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                          {getInitials(applicant?.name ?? "U")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">
                            {applicant?.name}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono"
                          >
                            {r.kind === "create_club"
                              ? "New Club"
                              : "Officer Role"}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-mono ${
                              r.status === "pending"
                                ? "text-foreground border-accent/50"
                                : r.status === "approved"
                                  ? "text-foreground border-quaternary/50"
                                  : "text-destructive border-destructive/30"
                            }`}
                          >
                            {r.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          {applicant?.email} ·{" "}
                          {r.created_at.slice(0, 10)}
                        </p>
                        <p className="text-sm mt-2">
                          Requesting{" "}
                          <strong>{r.requested_role}</strong>
                          {r.kind === "create_club" ? (
                            <>
                              {" "}
                              of new club{" "}
                              <strong>{r.club_name}</strong> (
                              {r.club_category})
                            </>
                          ) : (
                            <>
                              {" "}
                              of <strong>{club?.name}</strong>
                            </>
                          )}
                        </p>
                        {r.club_description && (
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {r.club_description}
                          </p>
                        )}
                        {r.message && (
                          <p className="text-xs text-muted-foreground italic mt-2 border-l-2 border-border pl-2">
                            "{r.message}"
                          </p>
                        )}
                        {r.status === "pending" && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              className="bg-primary hover:bg-primary/90"
                              onClick={() =>
                                doReviewRoleRequest(
                                  r.id,
                                  "approved",
                                )
                              }
                            >
                              <CheckCircle2 className="size-3.5 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive"
                              onClick={() =>
                                doReviewRoleRequest(
                                  r.id,
                                  "rejected",
                                )
                              }
                            >
                              <XCircle className="size-3.5 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </TabsContent>

        <TabsContent value="events" className="mt-4">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-mono">
                    Event
                  </TableHead>
                  <TableHead className="text-xs font-mono">
                    Club
                  </TableHead>
                  <TableHead className="text-xs font-mono">
                    Date
                  </TableHead>
                  <TableHead className="text-xs font-mono">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-mono">
                    Regs
                  </TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {allEvents.map((e) => {
                  const club = store.clubs.find(
                    (c) => c.id === e.club_id,
                  );
                  const regs = store.registrations.filter(
                    (r) => r.event_id === e.id,
                  ).length;
                  return (
                    <TableRow key={e.id}>
                      <TableCell>
                        <p className="text-sm font-medium line-clamp-1">
                          {e.title}
                        </p>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {club?.short_name}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {format(parseISO(e.date), "d MMM yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-mono ${
                            e.status === "published"
                              ? "text-foreground border-quaternary/40"
                              : e.status === "cancelled"
                                ? "text-destructive border-destructive/30"
                                : "text-muted-foreground"
                          }`}
                        >
                          {e.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {regs}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                Delete event?
                              </DialogTitle>
                              <DialogDescription>
                                Permanently delete "{e.title}"
                                and all its registrations.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline">
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() =>
                                  doDeleteEvent(e.id)
                                }
                              >
                                Delete
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="clubs" className="mt-4">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-mono">
                    Club
                  </TableHead>
                  <TableHead className="text-xs font-mono">
                    Category
                  </TableHead>
                  <TableHead className="text-xs font-mono">
                    Admin
                  </TableHead>
                  <TableHead className="text-xs font-mono">
                    Members
                  </TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {allClubs.map((c) => {
                  const admin = store.users.find(
                    (u) => u.id === c.admin_user_id,
                  );
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="size-8 rounded overflow-hidden bg-muted shrink-0">
                            <ImageWithFallback
                              src={c.cover_url}
                              alt={c.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-sm font-medium">
                            {c.name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {c.category}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {admin?.name}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {c.member_count}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                Remove club?
                              </DialogTitle>
                              <DialogDescription>
                                Permanently remove "{c.name}",
                                its events, and all memberships.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline">
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() =>
                                  doDeleteClub(c.id)
                                }
                              >
                                Remove
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-mono">
                    User
                  </TableHead>
                  <TableHead className="text-xs font-mono">
                    Department
                  </TableHead>
                  <TableHead className="text-xs font-mono">
                    Email
                  </TableHead>
                  <TableHead className="text-xs font-mono">
                    Role / Change
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-7">
                          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                            {getInitials(u.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {u.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {u.student_id}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {u.department}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-mono ${roleBadge(u.role)}`}
                        >
                          {u.role.replace("_", " ")}
                        </Badge>
                        <Select
                          value={u.role}
                          onValueChange={(v) =>
                            doChangeUserRole(
                              u.id,
                              v as UserRole,
                            )
                          }
                        >
                          <SelectTrigger className="h-7 w-[130px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">
                              Student
                            </SelectItem>
                            <SelectItem value="club_admin">
                              Club Admin
                            </SelectItem>
                            <SelectItem value="super_admin">
                              Super Admin
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  const routerBase = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

  return (
    <Providers>
      <BrowserRouter basename={routerBase}>
        <Toaster
          richColors
          position="top-right"
          toastOptions={{
            style: {
              fontFamily:
                "'Plus Jakarta Sans', system-ui, sans-serif",
              fontSize: "13px",
            },
          }}
        />
        <AppContent />
      </BrowserRouter>
    </Providers>
  );
}

function LandingPage() {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="size-5 text-primary" />
            <span
              style={{ fontFamily: "'Outfit', sans-serif" }}
              className="font-semibold"
            >
              IUB Campus Hub
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link to={currentUser ? "/dashboard" : "/register"}>
                {currentUser ? "Open Dashboard" : "Get Started"}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <section className="max-w-3xl">
          <Badge className="mb-5">Built for IUB students and clubs</Badge>
          <h1
            style={{ fontFamily: "'Outfit', sans-serif" }}
            className="text-4xl md:text-5xl font-semibold leading-tight"
          >
            Manage campus events and club activities in one place.
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl">
            Discover events, join clubs, track registrations, and coordinate
            organizers through a single campus platform.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link to={currentUser ? "/dashboard" : "/register"}>
                {currentUser ? "Go to Dashboard" : "Create Account"}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </section>

        <section className="mt-14 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: CalendarDays,
              title: "Event Discovery",
              description:
                "Browse upcoming events, venue details, and schedules in one feed.",
            },
            {
              icon: Users,
              title: "Club Management",
              description:
                "Handle memberships, requests, and member rosters with role controls.",
            },
            {
              icon: BadgeCheck,
              title: "Attendance & Tracking",
              description:
                "Check in attendees, monitor capacity, and view activity summaries.",
            },
          ].map((feature) => (
            <Card key={feature.title} className="h-full">
              <CardHeader>
                <feature.icon className="size-5 text-primary mb-1" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/forgot-password"
        element={<ForgotPasswordPage />}
      />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell>
              <Routes>
                <Route
                  path="dashboard"
                  element={<DashboardPage />}
                />
                <Route
                  path="events"
                  element={<EventFeedPage />}
                />
                <Route
                  path="events/:id"
                  element={<EventDetailPage />}
                />
                <Route
                  path="clubs"
                  element={<ClubDirectoryPage />}
                />
                <Route
                  path="clubs/:id"
                  element={<ClubDetailPage />}
                />
                <Route
                  path="notifications"
                  element={<NotificationsPage />}
                />
                <Route
                  path="profile"
                  element={<ProfilePage />}
                />
                <Route
                  path="request-role"
                  element={<RequestRolePage />}
                />

                <Route
                  path="admin/dashboard"
                  element={
                    <ProtectedRoute role="club_admin">
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/events"
                  element={
                    <ProtectedRoute role="club_admin">
                      <EventManagePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/events/new"
                  element={
                    <ProtectedRoute role="club_admin">
                      <EventFormPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/events/edit/:id"
                  element={
                    <ProtectedRoute role="club_admin">
                      <EventFormPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/events/:id/roster"
                  element={
                    <ProtectedRoute role="club_admin">
                      <AttendeeRosterPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/requests"
                  element={
                    <ProtectedRoute role="club_admin">
                      <MembershipRequestsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/members"
                  element={
                    <ProtectedRoute role="club_admin">
                      <MemberRosterPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="superadmin"
                  element={
                    <ProtectedRoute role="super_admin">
                      <SuperAdminPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="*"
                  element={<Navigate to="/dashboard" replace />}
                />
                <Route
                  index
                  element={<Navigate to="/dashboard" replace />}
                />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}