import React from 'react';
// TODO: Fix imports
function LoginPage() {
  const { switchRole } = useAuth();
  const { store } = useData();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.endsWith("@iub.edu.bd")) {
      toast.error("Invalid email", {
        description: "Use your @iub.edu.bd email address.",
      });
      return;
    }
    const account = store.users.find(
      (u) => u.email.toLowerCase() === normalizedEmail,
    );
    if (!account) {
      toast.error("Account not found", {
        description:
          "No account exists for this email. Please sign up first.",
      });
      return;
    }
    if (!verifyPassword(account, password)) {
      toast.error("Incorrect password", {
        description: "Please check your password and try again.",
      });
      return;
    }
    switchRole(account.id);
    navigate("/dashboard");
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
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
            >
              Login
            </Button>
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

export default LoginPage;
