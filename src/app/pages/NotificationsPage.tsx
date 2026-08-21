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

export function NotificationsPage() {
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

