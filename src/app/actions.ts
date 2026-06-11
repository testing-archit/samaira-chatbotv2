'use server'

import { revalidatePath } from 'next/cache'
import { getSessionUser } from '@/lib/auth'
import { createFamilyProfile, deleteFamilyProfile } from '@/lib/profile'

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
