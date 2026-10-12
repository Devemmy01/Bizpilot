"use client";

import { Plus, Trash2, UserCog, Users } from "lucide-react";
import type { FormEvent } from "react";
import { formatMoney } from "@/lib/calculations";
import { Card } from "@/components/dashboard/ui/Card";
import { Reveal } from "@/components/dashboard/ui/Reveal";
import { Button } from "@/components/dashboard/ui/Button";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import type { StaffMember } from "@/types/business";

type StaffViewProps = {
  staffList: StaffMember[];
  showAddStaff: boolean;
  setShowAddStaff: (v: boolean | ((prev: boolean) => boolean)) => void;
  newStaffName: string;
  setNewStaffName: (v: string) => void;
  newStaffRole: string;
  setNewStaffRole: (v: string) => void;
  newStaffSales: string;
  setNewStaffSales: (v: string) => void;
  newStaffTasks: string;
  setNewStaffTasks: (v: string) => void;
  handleAddStaffMember: (e: FormEvent) => void;
  loading: boolean;
  currency: string;
  onUpdateStats: (member: StaffMember) => void;
  onDelete: (member: StaffMember) => void;
};

export function StaffView({
  staffList,
  showAddStaff,
  setShowAddStaff,
  newStaffName,
  setNewStaffName,
  newStaffRole,
  setNewStaffRole,
  newStaffSales,
  setNewStaffSales,
  newStaffTasks,
  setNewStaffTasks,
  handleAddStaffMember,
  loading,
  currency,
  onUpdateStats,
  onDelete,
}: StaffViewProps) {
  return (
    <div className="grid gap-6 py-5">
      <div className="flex flex-col gap-6 md:flex-row">
        <Reveal className="flex-1">
          <Card>
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black tracking-tight">Staff Registry</h2>
              <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowAddStaff((v) => !v)}>
                {showAddStaff ? "Close Panel" : "Add Staff"}
              </Button>
            </div>

            {staffList.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No staff members registered."
                subtitle="Register team members to monitor sales generated and tasks performed daily."
              />
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-150 text-xs font-black uppercase tracking-wider text-slate-500">
                        <th className="px-2 py-3">Staff Name</th>
                        <th className="px-2 py-3">Role</th>
                        <th className="px-2 py-3">Sales Logged</th>
                        <th className="px-2 py-3">Tasks Handled</th>
                        <th className="px-2 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffList.map((member) => (
                        <tr key={member._id} className="border-b border-slate-100 font-semibold hover:bg-slate-50">
                          <td className="px-2 py-3.5 text-ink">{member.name}</td>
                          <td className="px-2 py-3.5 text-slate-500">{member.role}</td>
                          <td className="px-2 py-3.5 tabular-nums text-ocean">{formatMoney(member.sales, currency)}</td>
                          <td className="px-2 py-3.5 tabular-nums">{member.tasks} tasks</td>
                          <td className="px-2 py-3.5 text-right">
                            <div className="inline-flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => onUpdateStats(member)}
                                className="rounded-lg border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-black text-ocean hover:bg-blue-100"
                              >
                                Update stats
                              </button>
                              <button
                                type="button"
                                onClick={() => onDelete(member)}
                                className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700"
                                title="Remove Staff"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-3 md:hidden">
                  {staffList.map((member) => (
                    <div key={member._id} className="rounded-xl border border-slate-200 p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-bold text-ink">{member.name}</p>
                          <p className="mt-0.5 text-xs font-semibold text-slate-500">{member.role}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-black text-ocean tabular-nums">{formatMoney(member.sales, currency)}</p>
                          <p className="text-[10px] font-semibold text-slate-400">{member.tasks} tasks</p>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="secondary" fullWidth icon={<UserCog size={13} />} onClick={() => onUpdateStats(member)}>
                          Update stats
                        </Button>
                        <Button size="sm" variant="ghost" icon={<Trash2 size={14} />} onClick={() => onDelete(member)} aria-label="Remove staff" />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </Reveal>

        {showAddStaff && (
          <div className="w-full shrink-0 animate-fade-in-up md:w-[320px]">
            <Card>
              <h3 className="mb-4 text-base font-black tracking-tight text-ink">Register Staff Member</h3>
              <form onSubmit={handleAddStaffMember} className="grid gap-4">
                <label className="grid gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Name</span>
                  <input
                    required
                    type="text"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="e.g. Amaka Obi"
                    className="h-11 rounded-xl border-slate-200 text-sm focus:border-ocean focus:ring-ocean"
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Role</span>
                  <input
                    required
                    type="text"
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value)}
                    placeholder="e.g. Cashier / Cook"
                    className="h-11 rounded-xl border-slate-200 text-sm focus:border-ocean focus:ring-ocean"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="grid min-w-0 gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Initial Sales (₦)</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      value={newStaffSales}
                      onChange={(e) => setNewStaffSales(e.target.value)}
                      placeholder="0"
                      className="h-11 w-full min-w-0 rounded-xl border-slate-200 text-sm focus:border-ocean focus:ring-ocean"
                    />
                  </label>
                  <label className="grid min-w-0 gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Initial Tasks</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={newStaffTasks}
                      onChange={(e) => setNewStaffTasks(e.target.value)}
                      placeholder="0"
                      className="h-11 w-full min-w-0 rounded-xl border-slate-200 text-sm focus:border-ocean focus:ring-ocean"
                    />
                  </label>
                </div>

                <Button type="submit" variant="success" disabled={loading}>
                  Register Staff
                </Button>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
