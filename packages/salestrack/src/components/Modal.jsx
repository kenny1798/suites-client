// components/Modal.jsx (atau inline dalam ContactsPage)
export default function Modal({ onClose, title = '', children }) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          {/* ❗️tiada width pelik: biar ikut max-w + w-full */}
          <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="font-semibold">{title}</div>
              <button className="text-gray-500 hover:text-black" onClick={onClose}>✕</button>
            </div>
            {/* Body scroll Y sahaja */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4">
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }
  