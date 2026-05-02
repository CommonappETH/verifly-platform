import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { ApiError } from "@verifly/api-client";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@verifly/ui";

import { useAuth } from "@/auth/AuthProvider";
import { EXPECTED_ROLE, PORTAL_NAME } from "@/auth/role";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: `Sign in — ${PORTAL_NAME}` }] }),
  component: LoginPage,
});

function LoginPage() {
  const { user, isLoading: authLoading, login, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in with the right role? Go home. (Different role? Stay
  // here so the user can sign out / sign in as a different account.)
  useEffect(() => {
    if (!authLoading && user && user.role === EXPECTED_ROLE) {
      void navigate({ to: "/" });
    }
  }, [authLoading, user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const u = await login(email, password);
      if (u.role !== EXPECTED_ROLE) {
        // Wrong portal — sign them back out and explain.
        await logout();
        setError(
          `This account is a ${u.role}, not a ${EXPECTED_ROLE}. Sign in with a ${PORTAL_NAME.toLowerCase()} account.`,
        );
        return;
      }
      void navigate({ to: "/" });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) setError("Invalid email or password.");
        else if (err.status === 429) setError("Too many attempts. Please wait a minute and try again.");
        else setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-lg">
              V
            </div>
            <div>
              <div className="font-display text-lg leading-tight font-bold">Verifly</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{PORTAL_NAME}</div>
            </div>
          </div>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Use the credentials provided by your institution. Seeded dev users
            have password{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">correct-horse-battery</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@verifly.test"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <div
                role="alert"
                className="text-sm text-destructive border border-destructive/30 bg-destructive/10 rounded-md px-3 py-2"
              >
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
            {user && user.role !== EXPECTED_ROLE && (
              <div className="text-xs text-muted-foreground text-center">
                Signed in as <strong>{user.email}</strong> ({user.role}). This
                account doesn't have access to the {PORTAL_NAME}.{" "}
                <button type="button" onClick={() => void logout()} className="underline">
                  Sign out
                </button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
