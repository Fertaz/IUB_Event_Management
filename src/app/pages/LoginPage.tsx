import React, {
  useState
} from "react";
import {
  Link,
  useNavigate
} from "react-router";

import { toast } from "sonner";
import {
  BookOpen
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../context/AuthContext";
import { AuthBrandPanel } from "../components/AuthBrandPanel";
import { GoogleIcon } from "../components/GoogleIcon";
import { ComicButton } from "../components/ComicButton";

export function LoginPage() {

  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.endsWith("@iub.edu.bd")) {
      toast.error("Invalid email", {
        description: "Use your @iub.edu.bd email address.",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await login(normalizedEmail, password);
      navigate("/dashboard");
    } catch (error) {
      console.error("Login failed.", error);
      toast.error("Login failed", {
        description:
          "Could not sign you in. Please verify your credentials.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-stretch">
      <AuthBrandPanel />

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <BookOpen className="size-5 text-primary" />
              <span
                style={{ fontFamily: "'Outfit', sans-serif" }}
                className="font-semibold text-primary"
              >
                Campus Event &amp; Club Management
              </span>
            </div>
            <h1
              style={{ fontFamily: "'Outfit', sans-serif" }}
              className="text-3xl font-semibold text-foreground mb-1.5"
            >
              Welcome Back!
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to continue to your campus hub.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="yourname@iub.edu.bd"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-center">
              <ComicButton
                type="submit"
                disabled={isSubmitting}
                ariaLabel="Login"
              >
                {isSubmitting ? "Signing in..." : "Login"}
              </ComicButton>
            </div>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
              or
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            className="w-full gap-2.5 font-normal"
            disabled
          >
            <GoogleIcon className="size-4" />
            Continue with Google (Coming soon)
          </Button>

          <p className="text-sm text-center text-muted-foreground mt-6">
            {"Don't have an account? "}
            <Link
              to="/register"
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}

// ─── Register ─────────────────────────────────────────────────────────────────

