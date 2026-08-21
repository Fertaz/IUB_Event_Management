import React, {
  useState
} from "react";
import {
  useNavigate
} from "react-router";

import { toast } from "sonner";
import {
  Plus, UserCog,
  BadgeCheck,
  Hourglass
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { EmptyState } from "../components/EmptyState";

export function RequestRolePage() {
  const navigate = useNavigate();
  const { store, doSubmitRoleRequest } = useData();
  const { currentUser, isStudent } = useAuth();

  const [kind, setKind] = useState<
    "lead_existing" | "create_club"
  >("create_club");
  const [requestedRole, setRequestedRole] =
    useState("President");
  const [clubId, setClubId] = useState("");
  const [clubName, setClubName] = useState("");
  const [clubCategory, setClubCategory] = useState("");
  const [clubDescription, setClubDescription] = useState("");
  const [message, setMessage] = useState("");

  const myPending = store.roleRequests.filter(
    (r) =>
      r.user_id === currentUser?.id && r.status === "pending",
  );

  if (!isStudent) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <EmptyState
          icon={BadgeCheck}
          title="You're already an organizer"
          description="Only students can request a new organizer role or club."
        />
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (kind === "lead_existing" && !clubId) {
      toast.error("Select a club", {
        description: "Choose the club you'd like to lead.",
      });
      return;
    }
    if (
      kind === "create_club" &&
      (!clubName || !clubCategory)
    ) {
      toast.error("Missing details", {
        description: "Enter a club name and category.",
      });
      return;
    }
    doSubmitRoleRequest({
      kind,
      requested_role: requestedRole,
      club_id: kind === "lead_existing" ? clubId : undefined,
      club_name: kind === "create_club" ? clubName : undefined,
      club_category:
        kind === "create_club" ? clubCategory : undefined,
      club_description:
        kind === "create_club" ? clubDescription : undefined,
      message: message || undefined,
    });
    navigate("/dashboard");
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
          Organizer Access
        </p>
        <h1
          style={{ fontFamily: "'Outfit', sans-serif" }}
          className="text-3xl font-semibold"
        >
          Become a Club Organizer
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Want to run a club or take on an officer role? Submit
          a request to the Student Affairs office (Super Admin).
          If approved, your account will be upgraded to a Club
          Admin.
        </p>
      </div>

      {myPending.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-accent/10 border border-accent/30 rounded-lg">
          <Hourglass className="size-5 text-accent shrink-0" />
          <p className="text-sm text-foreground">
            You have <strong>{myPending.length}</strong> pending
            request
            {myPending.length !== 1 ? "s" : ""} awaiting review.
          </p>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Request details
            </CardTitle>
            <CardDescription>
              Tell us what you'd like to do.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setKind("create_club")}
                className={`text-left rounded-lg border p-4 transition-colors ${
                  kind === "create_club"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <Plus className="size-5 text-primary mb-2" />
                <p className="text-sm font-medium">
                  Create a new club
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Start a brand-new club and become its founder.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setKind("lead_existing")}
                className={`text-left rounded-lg border p-4 transition-colors ${
                  kind === "lead_existing"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <UserCog className="size-5 text-primary mb-2" />
                <p className="text-sm font-medium">
                  Officer of an existing club
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Become President, Secretary, etc. of a club.
                </p>
              </button>
            </div>

            <div className="space-y-1.5">
              <Label>Requested Role</Label>
              <Select
                value={requestedRole}
                onValueChange={setRequestedRole}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "President",
                    "Vice President",
                    "General Secretary",
                    "Treasurer",
                    "Organizing Secretary",
                  ].map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {kind === "lead_existing" ? (
              <div className="space-y-1.5">
                <Label>Club</Label>
                <Select
                  value={clubId}
                  onValueChange={setClubId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a club" />
                  </SelectTrigger>
                  <SelectContent>
                    {store.clubs.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label>Club Name</Label>
                  <Input
                    placeholder="e.g. IUB Robotics Club"
                    value={clubName}
                    onChange={(e) =>
                      setClubName(e.target.value)
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select
                    value={clubCategory}
                    onValueChange={setClubCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "Technology",
                        "Academic",
                        "Arts & Culture",
                        "Social",
                        "Sports",
                        "Business",
                      ].map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Club Description</Label>
                  <Textarea
                    placeholder="What is this club about? What activities will it run?"
                    value={clubDescription}
                    onChange={(e) =>
                      setClubDescription(e.target.value)
                    }
                    rows={3}
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label>Message to Admins (optional)</Label>
              <Textarea
                placeholder="Anything else the reviewers should know?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90"
            >
              Submit Request
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

