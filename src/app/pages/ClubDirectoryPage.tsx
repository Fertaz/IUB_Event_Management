import {
  useState
} from "react";

import {
  Users, Search
} from "lucide-react";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useData } from "../context/DataContext";
import { ClubCard } from "../components/ClubCard";
import { EmptyState } from "../components/EmptyState";

export function ClubDirectoryPage() {
  const { store } = useData();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  const categories = Array.from(
    new Set(store.clubs.map((c) => c.category)),
  );
  const clubs = store.clubs
    .filter((c) => {
      const q = search.toLowerCase();
      return (
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    })
    .filter(
      (c) => catFilter === "all" || c.category === catFilter,
    );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
          Explore
        </p>
        <h1
          style={{ fontFamily: "'Outfit', sans-serif" }}
          className="text-3xl font-semibold"
        >
          Club Directory
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {clubs.length} clubs
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search clubs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {clubs.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clubs found"
          description="Try a different search."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {clubs.map((c) => (
            <ClubCard key={c.id} club={c} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Club Detail ──────────────────────────────────────────────────────────────

