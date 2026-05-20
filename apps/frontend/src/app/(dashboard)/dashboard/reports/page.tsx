'use client';

import { useState } from 'react';
import { useReports, useOrgId } from '@/lib/hooks';
import { reportApi } from '@/lib/api';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { mutate } from 'swr';
import { useForm } from 'react-hook-form';
import dayjs from 'dayjs';
import clsx from 'clsx';
import {
  FileText, Plus, Download, Loader2,
  CheckCircle, Clock, AlertCircle, Sparkles,
  RefreshCw, Calendar, Mail,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  PENDING:    { label: 'Pending',    icon: <Clock size={12} />,        color: 'text-text-muted',  bg: 'bg-surface-hover' },
  GENERATING: { label: 'Generating', icon: <Loader2 size={12} className="animate-spin" />, color: 'text-warning', bg: 'bg-warning/10' },
  READY:      { label: 'Ready',      icon: <CheckCircle size={12} />,  color: 'text-success',     bg: 'bg-success/10' },
  FAILED:     { label: 'Failed',     icon: <AlertCircle size={12} />,  color: 'text-error',       bg: 'bg-error/10' },
};

export default function ReportsPage() {
  const orgId = useOrgId();
  const toast = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const { data: reports = [], isLoading } = useReports();

  const handleRetry = async (reportId: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      await fetch(`/api/reports/${reportId}/retry`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'x-org-id': orgId,
          'ngrok-skip-browser-warning': 'true',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      mutate(['reports', orgId]);
      toast.success('Regenerating report...');
    } catch (e: any) {
      toast.error('Failed to regenerate', e.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Reports</h1>
          <p className="text-sm text-text-muted mt-0.5">Generate PDF analytics reports with AI-powered insights</p>
        </div>
        <Button icon={<Plus size={15} />} onClick={() => setShowCreate(true)}>
          New Report
        </Button>
      </div>

      {/* Info banner */}
      <div className="bg-brand-500/5 border border-brand-500/20 rounded-2xl p-4 flex items-start gap-3">
        <Sparkles size={16} className="text-brand-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-brand-400">AI-powered reports</p>
          <p className="text-xs text-text-muted mt-0.5">
            Each report includes AI-generated insights from Ollama. Make sure Ollama is running locally for best results.
            Reports are generated as PDF and can be downloaded or emailed.
          </p>
        </div>
      </div>

      {/* Reports list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-surface-card border border-surface-border rounded-2xl p-5 skeleton h-20" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={<FileText size={24} />}
          title="No reports yet"
          description="Generate your first analytics report with AI-powered insights and download it as PDF."
          action={{ label: 'Create Report', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="space-y-3">
          {reports.map((report: any) => {
            const status = STATUS_CONFIG[report.status] || STATUS_CONFIG.PENDING;
            return (
              <div key={report.id}
                className="bg-surface-card border border-surface-border rounded-2xl p-5 flex items-center gap-4 hover:border-brand-500/20 transition-colors">
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 flex-shrink-0">
                  <FileText size={18} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{report.title}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {report.platform && (
                      <Badge variant={report.platform.toLowerCase() as any} size="sm">{report.platform}</Badge>
                    )}
                    <span className="text-xs text-text-muted">
                      {dayjs(report.periodStart).format('MMM D')} – {dayjs(report.periodEnd).format('MMM D, YYYY')}
                    </span>
                    <span className="text-xs text-text-muted">
                      Created {dayjs(report.createdAt).format('MMM D, h:mm A')}
                    </span>
                    {report.emailTo && (
                      <div className="flex items-center gap-1 text-xs text-text-muted">
                        <Mail size={10} />
                        {report.emailTo}
                      </div>
                    )}
                  </div>
                </div>

                {/* AI insights indicator */}
                {report.aiInsights && (
                  <div className="flex items-center gap-1 text-xs text-brand-400 flex-shrink-0">
                    <Sparkles size={11} />
                    <span className="hidden sm:inline">AI insights</span>
                  </div>
                )}

                {/* Status badge */}
                <div className={clsx(
                  'flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0',
                  status.color, status.bg,
                )}>
                  {status.icon}
                  {status.label}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {report.status === 'FAILED' && (
                    <button
                      onClick={() => handleRetry(report.id)}
                      className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors"
                    >
                      <RefreshCw size={12} />
                      Retry
                    </button>
                  )}
                  {report.pdfUrl && (
                    <a
                      href={report.pdfUrl}
                      download
                      className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-semibold transition-colors"
                    >
                      <Download size={13} />
                      Download PDF
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      <CreateReportModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        orgId={orgId}
        onSuccess={() => {
          mutate(['reports', orgId]);
          setShowCreate(false);
          toast.success('Report queued', 'Your report is being generated with AI insights.');
        }}
      />
    </div>
  );
}

function CreateReportModal({ open, onClose, orgId, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<{
    title: string;
    platform: string;
    periodStart: string;
    periodEnd: string;
    emailTo: string;
  }>();

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await reportApi.create(orgId, {
        title: data.title,
        platform: data.platform || undefined,
        periodStart: new Date(data.periodStart).toISOString(),
        periodEnd: new Date(data.periodEnd).toISOString(),
        emailTo: data.emailTo || undefined,
      });
      onSuccess();
    } catch (e: any) {
      toast.error('Failed to create report', e.message);
    } finally {
      setLoading(false);
    }
  };

  const defaultStart = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
  const defaultEnd = dayjs().format('YYYY-MM-DD');

  return (
    <Modal open={open} onClose={onClose} title="Generate Report" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Report title"
          placeholder="Monthly Instagram Report — May 2026"
          {...register('title', { required: 'Title is required' })}
          error={errors.title?.message}
        />

        <Select
          label="Platform (optional)"
          options={[
            { value: '', label: 'All platforms' },
            { value: 'INSTAGRAM', label: 'Instagram' },
            { value: 'FACEBOOK', label: 'Facebook' },
            { value: 'YOUTUBE', label: 'YouTube' },
          ]}
          {...register('platform')}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Period start"
            type="date"
            defaultValue={defaultStart}
            {...register('periodStart', { required: true })}
          />
          <Input
            label="Period end"
            type="date"
            defaultValue={defaultEnd}
            {...register('periodEnd', { required: true })}
          />
        </div>

        <Input
          label="Email report to (optional)"
          type="email"
          placeholder="team@company.com"
          hint="Leave blank to only download"
          {...register('emailTo')}
        />

        {/* What's included */}
        <div className="bg-surface-hover rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-text-secondary">Report includes:</p>
          {[
            '📊 Growth charts (followers, reach, engagement)',
            '🏆 Top 10 performing posts',
            '⏰ Best posting time analysis',
            '🤖 AI-generated insights & recommendations',
            '📄 Downloadable PDF',
          ].map(item => (
            <p key={item} className="text-xs text-text-muted">{item}</p>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" loading={loading} icon={<FileText size={15} />} className="flex-1">
            Generate Report
          </Button>
        </div>
      </form>
    </Modal>
  );
}
