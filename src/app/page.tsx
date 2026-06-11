import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import ChatUI from './chat-ui'
import { getFamilyProfiles, createFamilyProfile } from '@/lib/profile'

export default async function IndexPage() {
  const user = await getSessionUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profiles for this user from Postgres DB
  let profiles = await getFamilyProfiles(user.id);
  
  if (profiles.length === 0) {
    // If user has no profiles, create the default "Self" profile
    await createFamilyProfile(user.id, "Myself", "self");
    profiles = await getFamilyProfiles(user.id);
  }

  return <ChatUI user={user} profiles={profiles} />
}
