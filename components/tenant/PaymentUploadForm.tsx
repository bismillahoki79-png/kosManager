'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface Props {
  invoiceId: string
  onClose: () => void
}

export default function PaymentUploadForm({ invoiceId, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setIsLoading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${invoiceId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `${fileName}`

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('payment_proofs')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment_proofs')
        .getPublicUrl(filePath)

      // 3. Update Invoice
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          status: 'pending_verification',
          proof_url: publicUrl
        })
        .eq('id', invoiceId)

      if (updateError) throw updateError

      toast.success('Bukti pembayaran berhasil diunggah!')
      onClose()
      router.refresh()
    } catch (error: any) {
      toast.error('Gagal upload: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in-0">
      <Card className="w-full max-w-md shadow-lg border-primary/10">
        <CardHeader>
          <CardTitle>Upload Bukti Pembayaran</CardTitle>
          <CardDescription>Pilih gambar foto atau screenshot bukti transfer.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-file">Pilih Gambar</Label>
              <Input
                id="payment-file"
                type="file"
                accept="image/*"
                required
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="cursor-pointer file:text-primary file:font-semibold file:bg-primary/10 hover:file:bg-primary/20 file:border-0 file:rounded-md"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-border mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !file}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengunggah...
                  </>
                ) : (
                  'Upload'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
