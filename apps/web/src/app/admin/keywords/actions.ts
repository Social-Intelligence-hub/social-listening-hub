import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function addKeyword(formData: FormData) {
  const supabase = await createClient()
  const brandId = formData.get('brand_id') as string
  const term = formData.get('term') as string
  const exclusionsRaw = formData.get('exclusion_terms') as string

  if (!brandId || !term || term.trim() === '') {
    redirect('/admin/keywords?error=Marca+y+término+principal+son+requeridos')
  }

  // Parsear términos de exclusión separados por coma
  const exclusion_terms = exclusionsRaw
    ? exclusionsRaw.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
    : []

  const { error } = await supabase.from('keywords').insert([
    {
      brand_id: brandId,
      term,
      exclusion_terms,
    },
  ])

  if (error) {
    redirect(`/admin/keywords?error=${encodeURIComponent(error.message)}&brand_id=${brandId}`)
  }

  redirect(`/admin/keywords?brand_id=${brandId}`)
}

export async function deleteKeyword(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const brandId = formData.get('brand_id') as string

  if (!id) {
    redirect('/admin/keywords?error=ID+inválido')
  }

  const { error } = await supabase.from('keywords').delete().eq('id', id)
  if (error) {
    redirect(`/admin/keywords?error=${encodeURIComponent(error.message)}&brand_id=${brandId}`)
  }

  redirect(`/admin/keywords?brand_id=${brandId}`)
}
