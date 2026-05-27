import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function addSource(formData: FormData) {
  const supabase = await createClient()
  const brandId = formData.get('brand_id') as string
  const type = formData.get('type') as string
  const urlTarget = formData.get('url_target') as string

  if (!brandId || !type || !urlTarget || urlTarget.trim() === '') {
    redirect('/admin/sources?error=Todos+los+campos+son+requeridos')
  }

  const { error } = await supabase.from('sources_config').insert([
    {
      brand_id: brandId,
      type,
      url_target: urlTarget,
      is_active: true,
    },
  ])

  if (error) {
    redirect(`/admin/sources?error=${encodeURIComponent(error.message)}&brand_id=${brandId}`)
  }

  redirect(`/admin/sources?brand_id=${brandId}`)
}

export async function toggleSource(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const brandId = formData.get('brand_id') as string
  const isActive = formData.get('is_active') === 'true'

  if (!id) {
    redirect('/admin/sources?error=ID+inválido')
  }

  const { error } = await supabase
    .from('sources_config')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) {
    redirect(`/admin/sources?error=${encodeURIComponent(error.message)}&brand_id=${brandId}`)
  }

  redirect(`/admin/sources?brand_id=${brandId}`)
}

export async function deleteSource(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const brandId = formData.get('brand_id') as string

  if (!id) {
    redirect('/admin/sources?error=ID+inválido')
  }

  const { error } = await supabase.from('sources_config').delete().eq('id', id)
  if (error) {
    redirect(`/admin/sources?error=${encodeURIComponent(error.message)}&brand_id=${brandId}`)
  }

  redirect(`/admin/sources?brand_id=${brandId}`)
}
