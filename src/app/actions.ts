'use server'

import { revalidatePath } from 'next/cache'
import { getSessionUser } from '@/lib/auth'
import { createFamilyProfile, deleteFamilyProfile, getUserProfile, updateUserProfile } from '@/lib/profile'

export async function addProfile(formData: FormData) {
  const user = await getSessionUser()
  if (!user) return

  const name = formData.get('name') as string
  const relation = formData.get('relation') as string
  
  if (name && relation) {
    await createFamilyProfile(user.id, name, relation)
    revalidatePath('/')
  }
}

export async function deleteProfile(formData: FormData) {
  const user = await getSessionUser()
  if (!user) return

  const profileId = formData.get('profileId') as string
  
  if (profileId) {
    await deleteFamilyProfile(profileId, user.id)
    revalidatePath('/')
  }
}

export async function fetchProfileData(profileId: string) {
  const user = await getSessionUser()
  if (!user) return null
  return await getUserProfile(profileId)
}

export async function editProfileData(profileId: string, formData: FormData) {
  const user = await getSessionUser()
  if (!user) return

  const emergency_fund_months = formData.get('emergency_fund_months')
  const term_cover = formData.get('term_cover')
  const has_health_insurance = formData.get('has_health_insurance')
  const risk_appetite = formData.get('risk_appetite')

  await updateUserProfile(profileId, {
    emergency_fund_months: emergency_fund_months ? parseInt(emergency_fund_months as string) : undefined,
    term_cover: term_cover ? parseFloat(term_cover as string) : undefined,
    has_term_insurance: term_cover ? parseFloat(term_cover as string) > 0 : undefined,
    has_health_insurance: has_health_insurance === 'true' ? true : (has_health_insurance === 'false' ? false : undefined),
    risk_appetite: risk_appetite ? (risk_appetite as "low" | "medium" | "high") : undefined,
  })
}
