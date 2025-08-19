export default function Message({ role, text }) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} my-2`}>
      <div
        className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm whitespace-pre-wrap break-words ${
          isUser
            ? "bg-slate-900 text-white rounded-br-sm"
            : "bg-white text-gray-900 border border-slate-200 rounded-bl-sm"
        }`}
      >
        <p className="msg">{text}</p>
      </div>
    </div>
  );
}
