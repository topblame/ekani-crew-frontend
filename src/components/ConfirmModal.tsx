'use client';

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6 whitespace-pre-line">{message}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer flex-1 rounded-full bg-gray-100 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-200 transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="cursor-pointer flex-1 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 px-4 py-3 text-sm font-semibold text-white hover:shadow-lg transition"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}