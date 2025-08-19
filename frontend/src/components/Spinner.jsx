export default function Spinner() {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500 animate-pulse">
      <svg
        className="w-5 h-5 text-slate-500 animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        ></path>
      </svg>
      <span>Thinking...</span>
    </div>
  );
}
