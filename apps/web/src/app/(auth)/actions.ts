'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect('/login?error=true&message=' + encodeURIComponent(error.message))
  }

  // Actualiza el cache y redirige al dashboard
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    redirect('/register?error=true&message=' + encodeURIComponent(error.message))
  }

  // Dependiendo de tu config en Supabase, signUp puede requerir confirmación por correo.
  // Mandamos un mensaje a la vista de login indicando los próximos pasos.
  revalidatePath('/', 'layout')
  redirect('/login?message=' + encodeURIComponent('Revisa tu correo para verificar la cuenta.'))
}
