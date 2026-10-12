"use client";

import { useState } from "react";
import { PackagePlus } from "lucide-react";
import { Modal } from "@/components/dashboard/ui/Modal";
import { Button } from "@/components/dashboard/ui/Button";
import type { InventoryItem } from "@/types/business";

type RestockModalProps = {
  item: InventoryItem | null;
  onClose: () => void;
  onSubmit: (amount: number) => void;
  loading?: boolean;
};

/** Keyed by item id so the form's local state resets naturally when the target item changes. */
function RestockForm({ item, onSubmit, loading }: { item: InventoryItem; onSubmit: (amount: number) => void; loading?: boolean }) {
  const [amount, setAmount] = useState("10");

  return (
    <form
      className="grid gap-4 px-6 py-5"
      onSubmit={(e) => {
        e.preventDefault();
        const value = Number(amount);
        if (!isNaN(value) && value > 0) onSubmit(value);
      }}
    >
      <label className="grid gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Additional stock ({item.unit})
        </span>
        <input
          autoFocus
          required
          type="number"
          inputMode="decimal"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-12 rounded-xl border-slate-200 text-base font-bold focus:border-ocean focus:ring-ocean"
        />
      </label>
      <p className="text-xs font-semibold text-slate-400">
        New stock will be {item.stock + (Number(amount) || 0)} {item.unit}
      </p>
      <Button type="submit" variant="success" icon={<PackagePlus size={17} />} loading={loading}>
        Confirm restock
      </Button>
    </form>
  );
}

export function RestockModal({ item, onClose, onSubmit, loading }: RestockModalProps) {
  return (
    <Modal
      open={!!item}
      onClose={onClose}
      title="Restock item"
      subtitle={item ? `${item.name} · currently ${item.stock} ${item.unit}` : undefined}
    >
      {item && <RestockForm key={item._id} item={item} onSubmit={onSubmit} loading={loading} />}
    </Modal>
  );
}
