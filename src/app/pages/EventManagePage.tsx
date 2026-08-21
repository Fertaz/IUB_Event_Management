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
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { EmptyState } from "../components/EmptyState";

export function EventManagePage() {
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

