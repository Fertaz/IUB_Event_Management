import React from 'react';
// TODO: Fix imports
function EventFeedPage() {
  const { store } = useData();
  const [search, setSearch] = useState("");
  const [clubFilter, setClubFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const events = store.events
    .filter((e) => e.status === "published")
    .filter((e) => {
      const q = search.toLowerCase();
      return (
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
      );
    })
    .filter(
      (e) => clubFilter === "all" || e.club_id === clubFilter,
    )
    .filter((e) => {
      if (statusFilter === "available")
        return e.registered_count < e.capacity;
      if (statusFilter === "full")
        return e.registered_count >= e.capacity;
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
          Discover
        </p>
        <h1
          style={{ fontFamily: "'Outfit', sans-serif" }}
          className="text-3xl font-semibold"
        >
          Campus Events
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {events.length} upcoming event
          {events.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <Select
          value={clubFilter}
          onValueChange={setClubFilter}
        >
          <SelectTrigger className="w-[180px] bg-card border-border">
            <SelectValue placeholder="All clubs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All clubs</SelectItem>
            {store.clubs.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.short_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-[140px] bg-card border-border">
            <SelectValue placeholder="Availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="full">
              Full (Waitlist)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}

export default EventFeedPage;
