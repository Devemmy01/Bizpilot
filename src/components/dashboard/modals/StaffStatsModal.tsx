"use client";

import { useState } from "react";
import { UserCog } from "lucide-react";
import { Modal } from "@/components/dashboard/ui/Modal";
import { Button } from "@/components/dashboard/ui/Button";
import type { StaffMember } from "@/types/business";

type StaffStatsModalProps = {
  member: StaffMember | null;
  onClose: () => void;
  onSubmit: (sales: number, tasks: number) => void;
  loading?: boolean;
};

/** Keyed by member id so the form's local state resets naturally when the target member changes. */
function StaffStatsForm({
  member,
  onSubmit,
  loading,
}: {
  member: StaffMember;
  onSubmit: (sales: number, tasks: number) => void;
  loading?: boolean;
}) {
  const [sales, setSales] = useState(String(member.sales));
  const [tasks, setTasks] = useState(String(member.tasks));

  return (
    <form
      className="grid gap-4 px-6 py-5"
      onSubmit={(e) => {
        e.preventDefault();
        const salesNum = Number(sales);
        const tasksNum = Number(tasks);
        if (!isNaN(salesNum) && !isNaN(tasksNum)) onSubmit(salesNum, tasksNum);
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <label className="grid min-w-0 gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Sales (₦)</span>
          <input
            autoFocus
            type="number"
            inputMode="decimal"
            min="0"
            value={sales}
            onChange={(e) => setSales(e.target.value)}
            className="h-12 w-full min-w-0 rounded-xl border-slate-200 text-base font-bold focus:border-ocean focus:ring-ocean"
          />
        </label>
        <label className="grid min-w-0 gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tasks</span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={tasks}
            onChange={(e) => setTasks(e.target.value)}
            className="h-12 w-full min-w-0 rounded-xl border-slate-200 text-base font-bold focus:border-ocean focus:ring-ocean"
          />
        </label>
      </div>
      <Button type="submit" variant="success" icon={<UserCog size={17} />} loading={loading}>
        Save stats
      </Button>
    </form>
  );
}

export function StaffStatsModal({ member, onClose, onSubmit, loading }: StaffStatsModalProps) {
  return (
    <Modal open={!!member} onClose={onClose} title="Update stats" subtitle={member?.name}>
      {member && <StaffStatsForm key={member._id} member={member} onSubmit={onSubmit} loading={loading} />}
    </Modal>
  );
}
