"use client";

import { useState } from "react";
import { Tag } from "lucide-react";
import { Modal } from "@/components/dashboard/ui/Modal";
import { Button } from "@/components/dashboard/ui/Button";
import type { InventoryItem } from "@/types/business";

type CostPriceModalProps = {
  item: InventoryItem | null;
  currency: string;
  onClose: () => void;
  onSubmit: (costPrice: number) => void;
  loading?: boolean;
};

function CostPriceForm({
  item,
  currency,
  onSubmit,
  loading,
}: {
  item: InventoryItem;
  currency: string;
  onSubmit: (costPrice: number) => void;
  loading?: boolean;
}) {
  const [costPrice, setCostPrice] = useState(String(item.costPrice ?? 0));

  return (
    <form
      className="grid gap-4 px-6 py-5"
      onSubmit={(e) => {
        e.preventDefault();
        const value = Number(costPrice);
        if (!isNaN(value) && value >= 0) onSubmit(value);
      }}
    >
      <label className="grid gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Cost per {item.unit} ({currency})
        </span>
        <input
          autoFocus
          required
          type="number"
          inputMode="decimal"
          min="0"
          value={costPrice}
          onChange={(e) => setCostPrice(e.target.value)}
          className="h-12 rounded-xl border-slate-200 text-base font-bold focus:border-ocean focus:ring-ocean"
        />
      </label>
      <p className="text-xs font-semibold text-slate-400">
        Used to auto-suggest cost of goods sold on the Dashboard from what was sold.
      </p>
      <Button type="submit" variant="success" icon={<Tag size={17} />} loading={loading}>
        Save cost price
      </Button>
    </form>
  );
}

export function CostPriceModal({ item, currency, onClose, onSubmit, loading }: CostPriceModalProps) {
  return (
    <Modal open={!!item} onClose={onClose} title="Cost price" subtitle={item?.name}>
      {item && <CostPriceForm key={item._id} item={item} currency={currency} onSubmit={onSubmit} loading={loading} />}
    </Modal>
  );
}
