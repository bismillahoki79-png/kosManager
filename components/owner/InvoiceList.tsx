'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

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
      router.refresh()
    } catch (error: any) {
      alert('Gagal update status: ' + error.message)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {invoices.length === 0 ? (
          <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
            Tidak ada tagihan.
          </li>
        ) : (
          invoices.map((invoice) => (
            <li key={invoice.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-indigo-600 truncate">
                    {invoice.lease.tenant.full_name} - Kamar {invoice.lease.room.name}
                  </div>
                  <div className="ml-2 flex-shrink-0 flex">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                          invoice.status === 'pending_verification' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}
                    >
                      {invoice.status === 'pending_verification' ? 'Perlu Verifikasi' : 
                       invoice.status === 'paid' ? 'Lunas' : 'Belum Bayar'}
                    </span>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      Rp {invoice.amount.toLocaleString('id-ID')}
                    </p>
                    <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                      Jatuh Tempo: {new Date(invoice.due_date).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  
                  {invoice.status === 'pending_verification' && (
                    <div className="mt-2 flex items-center space-x-2 sm:mt-0">
                      {invoice.proof_url && (
                        <a 
                          href={invoice.proof_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs text-indigo-600 hover:text-indigo-500 underline mr-2"
                        >
                          Lihat Bukti
                        </a>
                      )}
                      <button
                        onClick={() => handleVerify(invoice.id, 'paid')}
                        disabled={loadingId === invoice.id}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        {loadingId === invoice.id ? '...' : 'Terima'}
                      </button>
                      <button
                        onClick={() => handleVerify(invoice.id, 'unpaid')}
                        disabled={loadingId === invoice.id}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        {loadingId === invoice.id ? '...' : 'Tolak'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
