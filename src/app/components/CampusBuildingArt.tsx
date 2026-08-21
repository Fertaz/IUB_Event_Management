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


export function CampusBuildingArt() {
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

