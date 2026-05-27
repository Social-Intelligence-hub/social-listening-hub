import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function addBrand(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string

  if (!name || name.trim() === '') {
    redirect('/admin/brands?error=El+nombre+de+la+marca+es+requerido')
  }

  const { error } = await supabase.from('brands').insert([{ name }])
  if (error) {
    redirect(`/admin/brands?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/admin/brands')
}

export async function deleteBrand(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string

  if (!id) {
    redirect('/admin/brands?error=ID+inválido')
  }

  const { error } = await supabase.from('brands').delete().eq('id', id)
  if (error) {
    redirect(`/admin/brands?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/admin/brands')
}
