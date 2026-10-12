"use client";

import { Boxes, Plus, RefreshCcw, Tag, Trash2 } from "lucide-react";
import type { FormEvent } from "react";
import { Card } from "@/components/dashboard/ui/Card";
import { Reveal } from "@/components/dashboard/ui/Reveal";
import { Button } from "@/components/dashboard/ui/Button";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { formatMoney } from "@/lib/calculations";
import { UNIT_OPTIONS } from "@/lib/units";
import type { InventoryItem } from "@/types/business";

type InventoryViewProps = {
  inventoryList: InventoryItem[];
  showAddInventory: boolean;
  setShowAddInventory: (v: boolean | ((prev: boolean) => boolean)) => void;
  newItemName: string;
  setNewItemName: (v: string) => void;
  newItemStock: string;
  setNewItemStock: (v: string) => void;
  newItemThreshold: string;
  setNewItemThreshold: (v: string) => void;
  newItemUnit: string;
  setNewItemUnit: (v: string) => void;
  newItemCostPrice: string;
  setNewItemCostPrice: (v: string) => void;
  handleAddInventoryItem: (e: FormEvent) => void;
  loading: boolean;
  currency: string;
  onRestock: (item: InventoryItem) => void;
  onEditCostPrice: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
};

function StatusBadge({ isLow }: { isLow: boolean }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-black leading-none ${
        isLow ? "border border-red-100 bg-red-50 text-red-600" : "border border-emerald-100 bg-emerald-50 text-growth"
      }`}
    >
      {isLow ? "Low Stock" : "Healthy"}
    </span>
  );
}

export function InventoryView({
  inventoryList,
  showAddInventory,
  setShowAddInventory,
  newItemName,
  setNewItemName,
  newItemStock,
  setNewItemStock,
  newItemThreshold,
  setNewItemThreshold,
  newItemUnit,
  setNewItemUnit,
  newItemCostPrice,
  setNewItemCostPrice,
  handleAddInventoryItem,
  loading,
  currency,
  onRestock,
  onEditCostPrice,
  onDelete,
}: InventoryViewProps) {
  return (
    <div className="grid gap-6 py-5">
      <div className="flex flex-col gap-6 md:flex-row">
        <Reveal className="flex-1">
          <Card>
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black tracking-tight">Active Stock Register</h2>
              <Button
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => setShowAddInventory((v) => !v)}
              >
                {showAddInventory ? "Close Panel" : "Register Item"}
              </Button>
            </div>

            {inventoryList.length === 0 ? (
              <EmptyState
                icon={Boxes}
                title="No inventory items registered."
                subtitle="Register items to receive stock warnings and optimize calculations."
              />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-150 text-xs font-black uppercase tracking-wider text-slate-500">
                        <th className="px-2 py-3">Item Name</th>
                        <th className="px-2 py-3">Current Stock</th>
                        <th className="px-2 py-3">Threshold Limit</th>
                        <th className="px-2 py-3">Unit</th>
                        <th className="px-2 py-3">Cost/Unit</th>
                        <th className="px-2 py-3">Status</th>
                        <th className="px-2 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryList.map((item) => {
                        const isLow = item.stock < item.threshold;
                        return (
                          <tr key={item._id} className="border-b border-slate-100 font-semibold hover:bg-slate-50">
                            <td className="px-2 py-3.5 text-ink">{item.name}</td>
                            <td className="px-2 py-3.5 tabular-nums">{item.stock}</td>
                            <td className="px-2 py-3.5 tabular-nums text-slate-500">{item.threshold}</td>
                            <td className="px-2 py-3.5 text-slate-400">{item.unit}</td>
                            <td className="px-2 py-3.5 tabular-nums text-slate-500">
                              {item.costPrice ? formatMoney(item.costPrice, currency) : "—"}
                            </td>
                            <td className="px-2 py-3.5">
                              <StatusBadge isLow={isLow} />
                            </td>
                            <td className="px-2 py-3.5 text-right">
                              <div className="inline-flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => onRestock(item)}
                                  className="rounded-lg border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-black text-ocean hover:bg-blue-100"
                                >
                                  Restock
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onEditCostPrice(item)}
                                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-ink"
                                  title="Set cost price"
                                >
                                  <Tag size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDelete(item)}
                                  className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700"
                                  title="Delete Item"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card list */}
                <div className="grid gap-3 md:hidden">
                  {inventoryList.map((item) => {
                    const isLow = item.stock < item.threshold;
                    return (
                      <div key={item._id} className="rounded-xl border border-slate-200 p-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-bold text-ink">{item.name}</p>
                            <p className="mt-0.5 text-xs font-semibold text-slate-500">
                              {item.stock} / {item.threshold} {item.unit}
                              {item.costPrice ? ` · ${formatMoney(item.costPrice, currency)}/${item.unit}` : ""}
                            </p>
                          </div>
                          <StatusBadge isLow={isLow} />
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="secondary" fullWidth icon={<RefreshCcw size={13} />} onClick={() => onRestock(item)}>
                            Restock
                          </Button>
                          <Button size="sm" variant="ghost" icon={<Tag size={14} />} onClick={() => onEditCostPrice(item)} aria-label="Set cost price" />
                          <Button size="sm" variant="ghost" icon={<Trash2 size={14} />} onClick={() => onDelete(item)} aria-label="Delete item" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </Card>
        </Reveal>

        {showAddInventory && (
          <div className="w-full shrink-0 animate-fade-in-up md:w-[320px]">
            <Card>
              <h3 className="mb-4 text-base font-black tracking-tight text-ink">Register Stock Item</h3>
              <form onSubmit={handleAddInventoryItem} className="grid gap-4">
                <label className="grid gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Item Name</span>
                  <input
                    required
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g. Basmati Rice"
                    className="h-11 rounded-xl border-slate-200 text-sm focus:border-ocean focus:ring-ocean"
                  />
                </label>

                <div className="grid gap-3">
                  <label className="grid gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Stock</span>
                    <input
                      required
                      type="number"
                      inputMode="decimal"
                      min="0"
                      value={newItemStock}
                      onChange={(e) => setNewItemStock(e.target.value)}
                      placeholder="100"
                      className="h-11 rounded-xl border-slate-200 text-sm focus:border-ocean focus:ring-ocean"
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Warning Limit</span>
                    <input
                      required
                      type="number"
                      inputMode="decimal"
                      min="0"
                      value={newItemThreshold}
                      onChange={(e) => setNewItemThreshold(e.target.value)}
                      placeholder="20"
                      className="h-11 rounded-xl border-slate-200 text-sm focus:border-ocean focus:ring-ocean"
                    />
                  </label>
                </div>

                <label className="grid gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Unit Type</span>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 text-sm focus:border-ocean focus:ring-ocean"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cost per unit (optional)</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={newItemCostPrice}
                    onChange={(e) => setNewItemCostPrice(e.target.value)}
                    placeholder="0"
                    className="h-11 rounded-xl border-slate-200 text-sm focus:border-ocean focus:ring-ocean"
                  />
                  <span className="text-[10px] font-medium text-slate-400">
                    Drives the cost-of-goods suggestion when this item is sold.
                  </span>
                </label>

                <Button type="submit" variant="success" disabled={loading}>
                  Register Item
                </Button>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
