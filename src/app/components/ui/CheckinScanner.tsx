import React, { useState } from "react";
import { useParams } from "react-router";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { toast } from "sonner";
import CameraCheckin from "@/app/components/ui/CameraCheckin";

export default function CheckinScanner() {
  const { id } = useParams<{ id: string }>();
  const [token, setToken] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [useCamera, setUseCamera] = useState(false);

  const doCheckin = async () => {
    if (!id) return;
    if (!token && !userId) {
      toast.error("Enter token or user id");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/events/${id}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token || undefined, user_id: userId || undefined }),
      });
      const text = await res.text();
      let data: any = null;
      try { data = text ? JSON.parse(text) : null; } catch (_) {}
      if (!res.ok) throw new Error(data?.detail || text || "Check-in failed");
      toast.success("Checked in: " + (data?.user_id || ""));
    } catch (err: any) {
      toast.error(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Event Check‑in Scanner</h2>
      <p className="text-sm text-muted-foreground mb-4">Paste QR token, use camera, or enter user ID to mark attendance.</p>

      <div className="mb-4 flex gap-2">
        <Button variant={useCamera ? "outline" : "secondary"} onClick={() => setUseCamera((s) => !s)}>
          {useCamera ? "Use Paste/Input" : "Use Camera"}
        </Button>
      </div>

      {useCamera ? (
        <CameraCheckin />
      ) : (
        <div className="space-y-3">
          <Input placeholder="QR token (paste here)" value={token} onChange={(e) => setToken(e.target.value)} />
          <Input placeholder="Or user id (e.g., roll number)" value={userId} onChange={(e) => setUserId(e.target.value)} />
          <div className="flex gap-2">
            <Button onClick={doCheckin} disabled={loading}>
              {loading ? "Checking…" : "Check in"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
