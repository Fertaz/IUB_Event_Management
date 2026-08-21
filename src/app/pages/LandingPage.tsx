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

export function LandingPage() {
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
