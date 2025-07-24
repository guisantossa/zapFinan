export default function SelectBase({ label, options = [], value, onChange, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm text-gray-600">{label}</label>}
      <select
        value={value}
        onChange={onChange}
        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00B37E] text-sm"
        {...props}
      >
        {options.map((opt, idx) =>
          typeof opt === "string" ? (
            <option key={idx} value={opt}>{opt}</option>
          ) : (
            <option key={idx} value={opt.value}>{opt.label}</option>
          )
        )}
      </select>
    </div>
  );
}
