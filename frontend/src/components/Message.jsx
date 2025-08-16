export default function Message({ role, text }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] px-4 py-2 rounded-2xl shadow-sm ${isUser ? 'bg-slate-900 text-white rounded-br-sm' : 'bg-white border border-slate-200 rounded-bl-sm'}`}>
        <p className="msg whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  )
}