import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
  adminOnly?: boolean;
}

export function ProtectedRoute({
  path,
  component: Component,
  adminOnly = false,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  // Get the component to render
  const routeComponent = (
    <Route path={path}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </div>
      ) : !user ? (
        <Redirect to="/login" />
      ) : adminOnly && !user.isAdmin ? (
        <Redirect to="/" />
      ) : (
        <Component />
      )}
    </Route>
  );

  return routeComponent;
}