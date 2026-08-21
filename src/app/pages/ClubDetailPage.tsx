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
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Avatar,
  AvatarFallback,
} from "../components/ui/avatar";
import { Separator } from "../components/ui/separator";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  downloadICS,
  googleCalendarUrl,
  shareEvent,
  checkInCode,
  parseCheckInCode,
  getOccurrences,
  recurrenceLabel,
  formatEventTime,
} from "../lib/eventUtils";
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
} from "../lib/store";
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
} from "../lib/store";
import { authService } from "../services/authService";
import {
  fetchAppState,
  persistAppState,
} from "../services/stateService";
import {
  fetchClubMembers,
  assignRoles as assignClubRolesApi,
  updateMemberRole as updateMemberRoleApi,
  deleteMember as deleteMemberApi,
  addMember as addMemberApi,
  updateMemberDetails as updateMemberDetailsApi,
  type GetClubMembersResponse,
  type MemberSummary,
} from "../services/memberService";
import { getInitials, categoryColor } from "../lib/uiHelpers";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { EventCard } from "../components/EventCard";
import { EmptyState } from "../components/EmptyState";

export function ClubDetailPage() {
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

