export default function InputBase({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm text-gray-600">{label}</label>}
      <input
        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00B37E] text-sm"
        {...props}
      />
    </div>
  );
}
