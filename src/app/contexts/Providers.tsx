import React from 'react';
// TODO: Fix imports
function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const [store, setStore] = useState<StoreState>(loadStore);
  const [currentUserId, setCurrentUserId] = useState<
    string | null
  >(loadAuth);

  const currentUser =
    store.users.find((u) => u.id === currentUserId) ?? null;

  // Persist store + session to localStorage on every change.
  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch (error) {
      console.warn("Failed to persist store to localStorage.", error);
    }
  }, [store]);

  useEffect(() => {
    try {
      if (currentUserId)
        localStorage.setItem(AUTH_KEY, currentUserId);
      else localStorage.removeItem(AUTH_KEY);
    } catch (error) {
      console.warn("Failed to persist auth session.", error);
    }
  }, [currentUserId]);

  const switchRole = useCallback((userId: string) => {
    setCurrentUserId(userId);
    setStore((s) => ({ ...s, currentUserId: userId }));
  }, []);

  const logout = useCallback(() => {
    setCurrentUserId(null);
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
    setStore((s) => {
      const mem = s.memberships.find(
        (m) => m.id === membershipId,
      );
      const user = s.users.find((u) => u.id === mem?.user_id);
      const next = removeMember(s, membershipId);
      toast.info("Member removed", {
        description: `${user?.name} removed from club.`,
      });
      return next;
    });
  }, []);

  const doAssignRoles = useCallback((clubId: string) => {
    setStore((s) => {
      const next = assignClubRoles(s, clubId);
      toast.success("Roles assigned", {
        description: "Executive and sub-committee roles have been randomly assigned.",
      });
      return next;
    });
  }, []);

  const doUpdateMemberRole = useCallback(
    (membershipId: string, newRole: ClubRole) => {
      setStore((s) => {
        try {
          const next = updateMemberRole(s, membershipId, newRole);
          toast.success("Role updated");
          return next;
        } catch (err) {
          toast.error("Role update failed", {
            description: err instanceof Error ? err.message : undefined,
          });
          return s;
        }
      });
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
    switchRole,
    logout,
    isStudent: currentUser?.role === "student",
    isClubAdmin: currentUser?.role === "club_admin",
    isSuperAdmin: currentUser?.role === "super_admin",
  };

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

export default Providers;
