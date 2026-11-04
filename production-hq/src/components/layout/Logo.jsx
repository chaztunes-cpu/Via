import { AudioWaveform } from 'lucide-react';

export default function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900">
        <AudioWaveform className="size-4" strokeWidth={2.25} />
      </div>
      <span className="text-sm font-semibold tracking-tight text-zinc-100">Production HQ</span>
    </div>
  );
}
