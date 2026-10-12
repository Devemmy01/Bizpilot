"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/dashboard/ui/Button";
import { SearchableSelect } from "@/components/dashboard/ui/SearchableSelect";
import { formatMoney } from "@/lib/calculations";
import { UNIT_OPTIONS } from "@/lib/units";
import type { InventoryItem, StaffMember } from "@/types/business";

export type SaleLineDraft = {
  itemId: string;
  quantity: string;
  unit: string;
  amount: string;
  staffId: string; // "" = unattributed
};

const emptySaleLine: SaleLineDraft = { itemId: "", quantity: "1", unit: "", amount: "", staffId: "" };

type SaleLineEditorProps = {
  inventoryList: InventoryItem[];
  staffList: StaffMember[];
  rows: SaleLineDraft[];
  onChange: (rows: SaleLineDraft[]) => void;
  currency: string;
};

export function SaleLineEditor({ inventoryList, staffList, rows, onChange, currency }: SaleLineEditorProps) {
  if (inventoryList.length === 0) {
    return (
      <p className="text-xs font-medium text-slate-400">
        Register inventory items first — sales are recorded against items in your stock register.
      </p>
    );
  }

  function updateRow(index: number, patch: Partial<SaleLineDraft>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  function addRow() {
    onChange([...rows, { ...emptySaleLine, itemId: inventoryList[0]._id!, unit: inventoryList[0].unit }]);
  }

  const total = rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

  return (
    <div className="grid gap-3">
      {rows.map((row, index) => {
        return (
          <div key={index} className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <SearchableSelect
                  value={row.itemId}
                  onChange={(itemId) => {
                    const newItem = inventoryList.find((i) => i._id === itemId);
                    updateRow(index, { itemId, unit: newItem?.unit ?? row.unit });
                  }}
                  placeholder="Choose item sold…"
                  options={inventoryList.map((i) => ({
                    value: i._id!,
                    label: i.name,
                    sublabel: `${i.stock} ${i.unit} in stock`,
                  }))}
                />
              </div>
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="shrink-0 rounded-lg p-2 text-red-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Remove sale line"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="mt-2.5 flex gap-2">
              <label className="grid min-w-0 flex-1 gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quantity</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={row.quantity}
                  onChange={(e) => updateRow(index, { quantity: e.target.value })}
                  className="h-9 w-full min-w-0 rounded-lg border-slate-200 text-xs font-bold focus:border-ocean focus:ring-ocean"
                />
              </label>
              <label className="grid min-w-0 flex-1 gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Unit</span>
                <select
                  value={row.unit}
                  onChange={(e) => updateRow(index, { unit: e.target.value })}
                  className="h-9 w-full min-w-0 rounded-lg border-slate-200 text-xs font-semibold focus:border-ocean focus:ring-ocean"
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="grid min-w-0 gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Amount ({currency})</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={row.amount}
                  onChange={(e) => updateRow(index, { amount: e.target.value })}
                  placeholder="0"
                  className="h-9 w-full min-w-0 rounded-lg border-slate-200 text-xs font-bold focus:border-ocean focus:ring-ocean"
                />
              </label>
              <label className="grid min-w-0 gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sold by</span>
                <select
                  value={row.staffId}
                  onChange={(e) => updateRow(index, { staffId: e.target.value })}
                  className="h-9 w-full min-w-0 rounded-lg border-slate-200 text-xs font-semibold focus:border-ocean focus:ring-ocean"
                >
                  <option value="">—</option>
                  {staffList.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        );
      })}

      <Button type="button" variant="ghost" size="sm" icon={<Plus size={13} />} onClick={addRow}>
        Add item sold
      </Button>

      {rows.length > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs font-black text-ink">
          <span>Total sales</span>
          <span>{formatMoney(total, currency)}</span>
        </div>
      )}
    </div>
  );
}
