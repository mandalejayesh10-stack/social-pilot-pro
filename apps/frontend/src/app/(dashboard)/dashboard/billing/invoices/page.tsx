'use client';

import useSWR from 'swr';
import { billingApi } from '@/lib/api';
import { useOrgId } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Loader2 } from 'lucide-react';
import dayjs from 'dayjs';
import { useState } from 'react';

export default function InvoicesPage() {
  const orgId = useOrgId();
  const [generating, setGenerating] = useState<string | null>(null);

  const { data: invoices = [], isLoading } = useSWR(
    orgId ? ['billing/invoices', orgId] : null,
    () => billingApi.getInvoices(orgId),
  );

  const handleDownload = async (invoiceId: string, pdfUrl: string | null) => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
      return;
    }
    setGenerating(invoiceId);
    try {
      const res = await fetch(`/api/billing/invoices/${invoiceId}/pdf`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'x-org-id': orgId },
      });
      const data = await res.json();
      window.open(data.url, '_blank');
    } finally {
      setGenerating(null);
    }
  };

  const fmt = (amount: number, currency: string) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency?.toUpperCase() || 'USD',
    }).format(amount / 100);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Invoices</h1>
        <p className="text-sm text-text-muted mt-0.5">Download your billing history</p>
      </div>

      <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 size={20} className="animate-spin text-text-muted" />
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={<FileText size={24} />}
            title="No invoices yet"
            description="Invoices will appear here after your first payment."
            className="py-12"
          />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Invoice</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Tax</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Total</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50">
              {invoices.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-surface-hover/50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-text-primary">{inv.invoiceNumber}</p>
                    {inv.taxType && (
                      <p className="text-xs text-text-muted">{inv.taxType} {inv.taxCountry}</p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm text-text-secondary">
                    {dayjs(inv.issuedAt).format('MMM D, YYYY')}
                  </td>
                  <td className="px-5 py-4 text-sm text-text-secondary">
                    {fmt(inv.amount, inv.currency)}
                  </td>
                  <td className="px-5 py-4 text-sm text-text-secondary">
                    {inv.taxAmount > 0 ? fmt(inv.taxAmount, inv.currency) : '—'}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-text-primary">
                    {fmt(inv.totalAmount, inv.currency)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={generating === inv.id
                        ? <Loader2 size={13} className="animate-spin" />
                        : <Download size={13} />
                      }
                      onClick={() => handleDownload(inv.id, inv.pdfUrl)}
                      disabled={generating === inv.id}
                    >
                      PDF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
