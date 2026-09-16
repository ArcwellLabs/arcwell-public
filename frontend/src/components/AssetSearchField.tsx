import { Search, X } from "lucide-react";
export default function AssetSearchField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="q-search-field">
      <span>{label}</span>
      <span className="q-search-input">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Name or symbol…"}
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label={`Clear ${label.toLowerCase()}`}
          >
            <X size={15} />
          </button>
        ) : null}
      </span>
    </label>
  );
}
