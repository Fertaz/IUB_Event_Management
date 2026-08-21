import React from 'react';
// TODO: Fix imports
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
                      {event.start_time}
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

export default DashboardPage;
