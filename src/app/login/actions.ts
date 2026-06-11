'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sql } from '@/lib/db'
import { hashPassword, verifyPassword, createSession, clearSession } from '@/lib/auth'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/login?error=Please provide both email and password.')
  }

  const results = await sql`SELECT id, password_hash FROM users WHERE email = ${email}`
  
  if (results.length === 0) {
    redirect('/login?error=Invalid email or password.')
  }

  const user = results[0]
  
  if (!verifyPassword(password, user.password_hash)) {
    redirect('/login?error=Invalid email or password.')
  }

  await createSession(user.id)
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password || password.length < 6) {
    redirect('/login?error=Password must be at least 6 characters.')
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    redirect('/login?error=Please enter a valid email address.')
  }

  // Check if email exists
  const existing = await sql`SELECT id FROM users WHERE email = ${email}`
  if (existing.length > 0) {
    redirect('/login?error=User with this email already exists.')
  }

  const hash = hashPassword(password)
  const newUserId = 'user_' + Math.random().toString(36).substring(2, 11)

  const results = await sql`
    INSERT INTO users (id, email, password_hash)
    VALUES (${newUserId}, ${email}, ${hash})
    RETURNING id
  `

  const user = results[0]
  await createSession(user.id)

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logout() {
  await clearSession()
  revalidatePath('/', 'layout')
  redirect('/login')
}
