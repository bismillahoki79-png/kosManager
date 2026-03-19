'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Check, X, Loader2 } from 'lucide-react'

interface Invoice {
  id: string
  amount: number
  due_date: string
  status: 'unpaid' | 'pending_verification' | 'paid'
  proof_url: string | null
  lease: {
    tenant: {
      full_name: string
    }
    room: {
      name: string
    }
  }
}

interface Props {
  invoices: Invoice[]
}

export default function InvoiceList({ invoices }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleVerify = async (id: string, newStatus: 'paid' | 'unpaid') => {
    setLoadingId(id)
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error
      
      toast.success(`Tagihan berhasil diubah menjadi ${newStatus === 'paid' ? 'Lunas' : 'Belum Bayar'}`)
      router.refresh()
    } catch (error: any) {
      toast.error('Gagal update status: ' + error.message)
    } finally {
      setLoadingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Lunas</Badge>
      case 'pending_verification':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">Perlu Verifikasi</Badge>
      case 'unpaid':
      default:
        return <Badge variant="destructive">Belum Bayar</Badge>
    }
  }

  return (
    <Card className="shadow-sm border-border">
      <CardHeader>
        <CardTitle className="text-xl">Daftar Tagihan & Verifikasi</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {invoices.length === 0 ? (
            <li className="px-6 py-8 text-center text-muted-foreground">
              Tidak ada tagihan.
            </li>
          ) : (
            invoices.map((invoice) => (
              <li key={invoice.id} className="hover:bg-muted/50 transition-colors">
                <div className="px-6 py-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-primary truncate max-w-[60%]">
                      {invoice.lease.tenant.full_name} <span className="text-muted-foreground font-normal mx-1">•</span> Kamar {invoice.lease.room.name}
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      {getStatusBadge(invoice.status)}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-col sm:flex-row sm:justify-between sm:items-end">
                    <div className="space-y-1">
                      <p className="flex items-center text-sm font-medium">
                        Rp {invoice.amount.toLocaleString('id-ID')}
                      </p>
                      <p className="flex items-center text-xs text-muted-foreground">
                        Jatuh Tempo: <span className="font-medium text-foreground ml-1">{new Date(invoice.due_date).toLocaleDateString('id-ID')}</span>
                      </p>
                    </div>
                    
                    {invoice.status === 'pending_verification' && (
                      <div className="mt-4 sm:mt-0 flex items-center space-x-2">
                        {invoice.proof_url && (
                          <a 
                            href={invoice.proof_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-xs text-primary hover:underline hover:text-primary/80 mr-2"
                          >
                            Lihat Bukti
                          </a>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                          onClick={() => handleVerify(invoice.id, 'paid')}
                          disabled={loadingId === invoice.id}
                        >
                          {loadingId === invoice.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                          Terima
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                          onClick={() => handleVerify(invoice.id, 'unpaid')}
                          disabled={loadingId === invoice.id}
                        >
                          {loadingId === invoice.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
                          Tolak
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  )
}
