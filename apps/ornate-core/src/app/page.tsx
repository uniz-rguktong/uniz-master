import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function Home() {
  try {
    const session = await getServerSession(authOptions)

    if (session?.user) {
      const role = session.user.role

      switch (role) {
        case 'SUPER_ADMIN':
          redirect('/super-admin')
          break;
        case 'BRANCH_ADMIN':
          redirect('/branch-admin')
          break;
        case 'SPORTS_ADMIN':
          redirect('/sports/all-sports')
          break;
        case 'BRANCH_SPORTS_ADMIN':
          redirect('/sports/all-sports')
          break;
        case 'HHO':
          redirect('/hho')
          break;
        case 'CLUB_COORDINATOR':
          redirect('/clubs-portal')
          break;
        case 'EVENT_COORDINATOR':
          redirect('/coordinator')
          break;
        default:
          redirect('/login')
          break;
      }
    }
  } catch (error) {
    console.error("Auth session check failed:", error)
    // Fallback to login instead of crashing the whole page
    redirect('/login')
  }

  // If not logged in, redirect to login
  redirect('/login')
}
