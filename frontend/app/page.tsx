import { auth } from "@/auth";
import LandingPage from "@/components/LandingPage";
import Dashboard from "@/components/Dashboard";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    return <LandingPage/>;
  }

  return <Dashboard/>;
}