import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { Button } from "@/app/components/ui/button";
import { toast } from "sonner";

// Uses html5-qrcode (install: npm i html5-qrcode)
export default function CameraCheckin() {
  const { id } = useParams<{ id: string }>();
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<HTMLDivElement | null>(null);
  const html5QrcodeRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startScanner = async () => {
    if (!id) return;
    setScanning(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const elementId = "html5qr";
      if (!scannerRef.current) return;
      const html5QrCode = new Html5Qrcode(elementId, { verbose: false });
      html5QrcodeRef.current = html5QrCode;
      const config = { fps: 10, qrbox: 250 };
      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        async (decodedText: string) => {
          // decodedText is the token; submit to backend
          try {
            const res = await fetch(`/events/${id}/checkin`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: decodedText }),
            });
              const text = await res.text();
              let data: any = null;
              try { data = text ? JSON.parse(text) : null; } catch (_) {}
              if (!res.ok) {
                const msg = data?.detail || text || "Check-in failed";
                throw new Error(msg);
              }
              toast.success("Checked in: " + (data?.user_id || ""));
            } catch (err: any) {
              toast.error(err.message || String(err));
            }
          },
          (errorMessage: any) => {
            // ignore decode errors
          }
        );
    } catch (err: any) {
        const msg = err && err.name === 'NotAllowedError' ? 'Camera permission denied' : (err.message || 'Camera not available');
        toast.error(msg);
        setScanning(false);
    }
  };

  const stopScanner = async () => {
    const inst = html5QrcodeRef.current;
    if (inst) {
      try {
        await inst.stop();
        await inst.clear();
      } catch (e) {
        // ignore
      }
      html5QrcodeRef.current = null;
    }
    setScanning(false);
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-3">Camera Check‑in</h3>
      <div ref={scannerRef} id="html5qr" className="mb-3" />
      <div className="flex gap-2">
        {!scanning ? (
          <Button onClick={startScanner}>Start Camera</Button>
        ) : (
          <Button variant="destructive" onClick={stopScanner}>Stop</Button>
        )}
        <Button variant="ghost" onClick={() => { stopScanner(); toast.message?.call(null, "Use token paste if camera unsupported"); }}>Help</Button>
      </div>
      <p className="text-sm text-muted-foreground mt-3">If camera fails, paste token into scanner instead.</p>
    </div>
  );
}
