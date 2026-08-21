import React from "react";
import { Search } from "lucide-react";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Text shown on the corner tab badge (e.g. "SEARCH", "EVENTS"). */
  label?: string;
  className?: string;
  ariaLabel?: string;
};

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  label = "SEARCH",
  className,
  ariaLabel,
}: SearchInputProps) {
  const containerClass = ["input__container", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={containerClass}
      style={{ ["--label-text" as any]: `'${label}'` } as React.CSSProperties}
    >
      <span className="shadow__input" />
      <button
        type="button"
        className="input__button__shadow"
        aria-label={ariaLabel ?? placeholder}
        tabIndex={-1}
      >
        <Search className="size-4" />
      </button>
      <input
        className="input__search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel ?? placeholder}
      />
    </div>
  );
}
