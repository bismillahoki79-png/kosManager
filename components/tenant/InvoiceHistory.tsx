'use client'

import { useState } from 'react'
import PaymentUploadForm from './PaymentUploadForm'

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
                    Tagihan Kamar {invoice.lease.room.name}
                  </div>
                  <div className="ml-2 flex-shrink-0 flex">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                          invoice.status === 'pending_verification' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}
                    >
                      {invoice.status === 'pending_verification' ? 'Menunggu Konfirmasi' : 
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
                  {invoice.status === 'unpaid' && (
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <button
                        onClick={() => setSelectedInvoiceId(invoice.id)}
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        Upload Bukti Bayar
                      </button>
                    </div>
                  )}
                  {invoice.status !== 'unpaid' && invoice.proof_url && (
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <a 
                        href={invoice.proof_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="font-medium text-gray-500 hover:text-gray-700"
                      >
                        Lihat Bukti
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
      
      {selectedInvoiceId && (
        <PaymentUploadForm 
          invoiceId={selectedInvoiceId} 
          onClose={() => setSelectedInvoiceId(null)} 
        />
      )}
    </div>
  )
}
