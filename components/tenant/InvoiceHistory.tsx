'use client'

import { useState } from 'react'
import PaymentUploadForm from './PaymentUploadForm'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Upload, FileText, CheckCircle2 } from 'lucide-react'

interface Invoice {
  id: string
  amount: number
  due_date: string
  status: 'unpaid' | 'pending_verification' | 'paid'
  proof_url: string | null
  lease: {
    room: {
      name: string
    }
  }
}

interface Props {
  invoices: Invoice[]
}

export default function InvoiceHistory({ invoices }: Props) {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Lunas</Badge>
      case 'pending_verification':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">Menunggu Konfirmasi</Badge>
      case 'unpaid':
      default:
        return <Badge variant="destructive">Belum Bayar</Badge>
    }
  }

  return (
    <>
      <Card className="shadow-sm border-border">
        <CardHeader>
          <CardTitle className="text-xl">Riwayat Tagihan</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {invoices.length === 0 ? (
              <li className="px-6 py-8 text-center text-muted-foreground flex flex-col items-center">
                <CheckCircle2 className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p>Tidak ada tagihan.</p>
              </li>
            ) : (
              invoices.map((invoice) => (
                <li key={invoice.id} className="hover:bg-muted/30 transition-colors">
                  <div className="px-6 py-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-primary truncate">
                        Tagihan Kamar <span className="font-bold">{invoice.lease.room.name}</span>
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
                      
                      <div className="mt-4 sm:mt-0 flex items-center space-x-3">
                        {invoice.status === 'unpaid' && (
                          <Button
                            size="sm"
                            onClick={() => setSelectedInvoiceId(invoice.id)}
                            className="h-8"
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Bukti
                          </Button>
                        )}
                        {invoice.status !== 'unpaid' && invoice.proof_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => window.open(invoice.proof_url!, '_blank')}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Lihat Bukti
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </CardContent>
      </Card>

      {selectedInvoiceId && (
        <PaymentUploadForm 
          invoiceId={selectedInvoiceId} 
          onClose={() => setSelectedInvoiceId(null)} 
        />
      )}
    </>
  )
}
