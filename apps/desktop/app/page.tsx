import { redirect } from "next/navigation";

// proxy.ts already redirects "/" based on auth state before this ever
// renders; this is just the fallback App Router requires for the route.
export default function RootPage() {
  redirect("/home");
}
