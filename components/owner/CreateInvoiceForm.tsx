'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface Tenant {
  id: string
  full_name: string | null
  leases: {
    id: string
    room: {
      name: string
    }
  }[]
}

interface Props {
  tenants: Tenant[]
}

export default function CreateInvoiceForm({ tenants }: Props) {
  const [selectedLeaseId, setSelectedLeaseId] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.from('invoices').insert({
        lease_id: selectedLeaseId,
        amount: parseFloat(amount),
        due_date: dueDate,
        status: 'unpaid'
      })

      if (error) throw error

      toast.success('Tagihan berhasil dibuat!')
      setAmount('')
      setDueDate('')
      setSelectedLeaseId('')
      router.refresh()
    } catch (error: any) {
      toast.error('Gagal membuat tagihan: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="shadow-sm border-border bg-card">
      <CardHeader>
        <CardTitle className="text-xl">Buat Tagihan Manual</CardTitle>
        <CardDescription>Atur biaya sewa dan tanggal jatuh tempo untuk penyewa</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenant">Penyewa / Kamar</Label>
            <select
              id="tenant"
              required
              value={selectedLeaseId}
              onChange={(e) => setSelectedLeaseId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Pilih Penyewa</option>
              {tenants.map((tenant) => (
                tenant.leases.map((lease) => (
                  <option key={lease.id} value={lease.id}>
                    {tenant.full_name} - Kamar {lease.room.name}
                  </option>
                ))
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Jumlah Tagihan (Rp)</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-muted-foreground sm:text-sm">Rp</span>
              </div>
              <Input
                type="number"
                id="amount"
                required
                min="0"
                className="pl-9"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Jatuh Tempo</Label>
            <Input
              type="date"
              id="dueDate"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full mt-4" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Buat Tagihan'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
