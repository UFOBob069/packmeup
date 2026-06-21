"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Luggage, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/actions/trips";
import { APP_NAME } from "@/lib/constants";
import { isDemoMode } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const demoMode = isDemoMode();

  const handleGoogle = () => {
    startTransition(async () => {
      const result = await signInWithGoogle();
      if (result.url) router.push(result.url);
    });
  };

  const handleSignIn = (formData: FormData) => {
    startTransition(async () => {
      try {
        const result = await signInWithEmail(
          formData.get("email") as string,
          formData.get("password") as string
        );
        router.push(result.url);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Sign in failed");
      }
    });
  };

  const handleSignUp = (formData: FormData) => {
    startTransition(async () => {
      try {
        const result = await signUpWithEmail(
          formData.get("email") as string,
          formData.get("password") as string,
          formData.get("name") as string
        );
        toast.success("Check your email to confirm your account");
        router.push(result.url);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Sign up failed");
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4">
      <Link href="/" className="mb-8 flex items-center gap-2 font-semibold">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Luggage className="h-5 w-5" />
        </div>
        {APP_NAME}
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>
            {demoMode
              ? "Demo mode — click Continue to explore the app"
              : "Sign in to manage your trips"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {demoMode ? (
            <Button
              className="w-full"
              size="lg"
              onClick={() => router.push("/dashboard")}
            >
              Continue to Demo
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogle}
                disabled={isPending}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <Tabs defaultValue="signin">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                <TabsContent value="signin">
                  <form action={handleSignIn} className="space-y-3 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input id="signin-email" name="email" type="email" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input id="signin-password" name="password" type="password" required />
                    </div>
                    <Button type="submit" className="w-full" disabled={isPending}>
                      <Mail className="mr-2 h-4 w-4" />
                      Sign In
                    </Button>
                  </form>
                </TabsContent>
                <TabsContent value="signup">
                  <form action={handleSignUp} className="space-y-3 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Name</Label>
                      <Input id="signup-name" name="name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input id="signup-email" name="email" type="email" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input id="signup-password" name="password" type="password" required minLength={6} />
                    </div>
                    <Button type="submit" className="w-full" disabled={isPending}>
                      Create Account
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
