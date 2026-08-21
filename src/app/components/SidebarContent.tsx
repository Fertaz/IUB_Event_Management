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
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import {
  Avatar,
  AvatarFallback,
} from "./ui/avatar";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { ImageWithFallback } from "./figma/ImageWithFallback";
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
import { getInitials } from "../lib/uiHelpers";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { NavLink } from "./NavLink";

export function SidebarContent({ onClose }: { onClose?: () => void }) {
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

