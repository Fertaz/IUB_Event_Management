
import {
  BookOpen
} from "lucide-react";
import { CampusBuildingArt } from "./CampusBuildingArt";

export function AuthBrandPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between w-[46%] max-w-[560px] bg-primary text-primary-foreground p-12 shrink-0">
      <div className="flex items-center gap-2.5">
        <BookOpen className="size-5" />
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-primary-foreground/70">
          IUB Campus Hub
        </span>
      </div>

      <div className="flex flex-col items-center text-center">
        <h1
          style={{ fontFamily: "'Outfit', sans-serif" }}
          className="text-3xl font-semibold leading-tight mb-10 max-w-xs"
        >
          Campus Event &amp; Club Management
        </h1>
        <CampusBuildingArt />
      </div>

      <div className="border-t border-white/15 pt-6">
        <p
          style={{ fontFamily: "'Outfit', sans-serif" }}
          className="text-lg font-semibold tracking-[0.35em]"
        >
          IUB
        </p>
        <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-primary-foreground/60 mt-1">
          Independent University, Bangladesh
        </p>
      </div>
    </div>
  );
}

