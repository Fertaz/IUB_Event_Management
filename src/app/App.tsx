import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router";
import { Toaster } from "sonner";
import { Providers } from "./context/Providers";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EventFeedPage } from "./pages/EventFeedPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { ClubDirectoryPage } from "./pages/ClubDirectoryPage";
import { ClubDetailPage } from "./pages/ClubDetailPage";
import { ProfilePage } from "./pages/ProfilePage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { EventManagePage } from "./pages/EventManagePage";
import { EventFormPage } from "./pages/EventFormPage";
import { AttendeeRosterPage } from "./pages/AttendeeRosterPage";
import { MembershipRequestsPage } from "./pages/MembershipRequestsPage";
import { MemberRosterPage } from "./pages/MemberRosterPage";
import { RequestRolePage } from "./pages/RequestRolePage";
import { SuperAdminPage } from "./pages/SuperAdminPage";
export default function App() {
  const routerBase = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "") || "/";

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
