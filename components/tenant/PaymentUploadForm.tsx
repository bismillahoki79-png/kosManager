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
import imageCompression from 'browser-image-compression'

interface Props {
  invoiceId: string
  onClose: () => void
}

export default function PaymentUploadForm({ invoiceId, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null

    if (!selectedFile) return

    // Validasi tipe
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('File harus berupa gambar')
      return
    }

    // Validasi ukuran (max 5MB sebelum compress)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB')
      return
    }

    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setIsLoading(true)

    try {
      // 1. Compress image
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      })

      const fileExt = file.name.split('.').pop()
      const fileName = `${invoiceId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `payments/${invoiceId}/${fileName}`

      // 2. Upload ke Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('payment_proofs')
        .upload(filePath, compressedFile)

      if (uploadError) throw uploadError

      // 3. Ambil public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('payment_proofs').getPublicUrl(filePath)

      // 4. Update database
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          status: 'pending_verification',
          proof_url: publicUrl,
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
          <CardDescription>
            Pilih gambar foto atau screenshot bukti transfer.
          </CardDescription>
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
                onChange={handleFileChange}
                className="cursor-pointer file:text-primary file:font-semibold file:bg-primary/10 hover:file:bg-primary/20 file:border-0 file:rounded-md"
              />
            </div>

            {/* Preview */}
            {preview && (
              <div className="mt-2">
                <img
                  src={preview}
                  alt="Preview"
                  className="rounded-lg border max-h-48 object-contain"
                />
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-border mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Batal
              </Button>

              <Button type="submit" disabled={isLoading || !file}>
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
