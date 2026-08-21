import React, {
  useState,
  useCallback,
  useEffect,
} from "react";
import { toast } from "sonner";
import type {
  StoreState,
  User,
  UserRole,
  ClubRole,
  Event,
  RoleRequest,
} from "../lib/store";
import {
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
  assignRoles as assignClubRolesApi,
  updateMemberRole as updateMemberRoleApi,
  deleteMember as deleteMemberApi,
} from "../services/memberService";
import {
  createEmptyStore,
  createDemoStore,
} from "../lib/storeHelpers";
import {
  AuthContext,
  type AuthContextValue,
} from "./AuthContext";
import {
  DataContext,
  type DataContextValue,
} from "./DataContext";
export function Providers({
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
            description: `${user?.name ?? "The member"}'s request was ${action}.`,
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
