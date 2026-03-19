'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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

      alert('Tagihan berhasil dibuat!')
      setAmount('')
      setDueDate('')
      setSelectedLeaseId('')
      router.refresh()
    } catch (error: any) {
      alert('Gagal membuat tagihan: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900">Buat Tagihan Manual</h3>
      
      <div>
        <label htmlFor="tenant" className="block text-sm font-medium text-gray-700">
          Penyewa / Kamar
        </label>
        <select
          id="tenant"
          required
          value={selectedLeaseId}
          onChange={(e) => setSelectedLeaseId(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm border"
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

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          Jumlah Tagihan (Rp)
        </label>
        <div className="relative mt-1 rounded-md shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-gray-500 sm:text-sm">Rp</span>
          </div>
          <input
            type="number"
            name="amount"
            id="amount"
            required
            min="0"
            className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 border"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
          Jatuh Tempo
        </label>
        <input
          type="date"
          name="dueDate"
          id="dueDate"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {isLoading ? 'Menyimpan...' : 'Buat Tagihan'}
      </button>
    </form>
  )
}
