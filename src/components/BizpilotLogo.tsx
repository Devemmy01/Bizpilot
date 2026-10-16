import Image from "next/image";

type BizpilotLogoProps = {
  compact?: boolean;
};

export function BizpilotLogo({ compact = false }: BizpilotLogoProps) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/icons/icon-192.png"
        alt="Bizpilot"
        width={compact ? 36 : 48}
        height={compact ? 36 : 48}
        className={compact ? "h-9 w-9 rounded-lg" : "h-12 w-12 rounded-xl"}
      />
      {!compact && (
        <div>
          <p className="text-xl font-black tracking-normal text-ink">
            Biz<span className="text-growth">pilot</span>
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Pilot your business
          </p>
        </div>
      )}
    </div>
  );
}
