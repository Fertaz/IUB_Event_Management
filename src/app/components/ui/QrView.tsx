import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { toast } from "sonner";

export default function QrView() {
  const { id } = useParams<{ id: string }>();
  const [token, setToken] = useState("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    if (!id) return;
    fetchToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchToken = async (uid?: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const url = `/events/${id}/qr` + (uid ? `?user_id=${encodeURIComponent(uid)}` : "");
      const res = await fetch(url);
      const text = await res.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (_) {
        // not JSON
      }
      if (!res.ok) {
        const msg = data?.detail || text || "Failed to fetch token";
        throw new Error(msg);
      }
      if (!data) throw new Error("Empty response from server");
      setToken(data.token);
      setExpiresAt(data.expires_at || null);
    } catch (err: any) {
      toast.error(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const copyToken = async () => {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    toast.success("Token copied to clipboard");
  };

  const qrUrl = token ? `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(token)}` : undefined;

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Event QR</h2>
      <p className="text-sm text-muted-foreground mb-4">Generate a short-lived QR token for attendee check-in. Paste token into scanner or scan QR.</p>

      <div className="space-y-3 mb-4">
        <Input placeholder="Optional user id (to embed in token)" value={userId} onChange={(e) => setUserId(e.target.value)} />
        <div className="flex gap-2">
          <Button onClick={() => fetchToken(userId)} disabled={loading}>{loading ? "Generating…" : "Generate QR token"}</Button>
          <Button variant="ghost" onClick={() => fetchToken()} disabled={loading}>Generate (no user)</Button>
        </div>
      </div>

      {token && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <img src={qrUrl} alt="QR code" className="w-48 h-48 bg-white border" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Expires at:</p>
              <p className="font-mono text-sm">{expiresAt}</p>
              <div className="mt-2 flex gap-2">
                <Button onClick={copyToken}>Copy token</Button>
                <Button variant="outline" onClick={() => { navigator.clipboard.writeText(qrUrl || ""); toast.success("QR URL copied");}}>Copy QR URL</Button>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Raw token</p>
            <pre className="bg-muted p-2 rounded text-sm overflow-auto">{token}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
