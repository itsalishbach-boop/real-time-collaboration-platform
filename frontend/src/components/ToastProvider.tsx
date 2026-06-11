'use client';
import { Toaster, ToastBar, toast } from 'react-hot-toast';
import { X, CheckCircle2, XCircle, Loader2, Info } from 'lucide-react';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      gutter={10}
      containerStyle={{ top: 68 }}
    >
      {(t) => (
        <ToastBar
          toast={t}
          style={{
            padding: 0,
            background: 'transparent',
            boxShadow: 'none',
            maxWidth: '380px',
          }}
        >
          {({ message }) => {
            const isSuccess = t.type === 'success';
            const isError = t.type === 'error';
            const isLoading = t.type === 'loading';

            return (
              <div
                className={`
                  flex items-start gap-3 bg-white rounded-2xl px-4 py-3.5
                  shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]
                  border border-gray-100 w-[340px]
                  transition-all duration-200
                  ${t.visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
                  ${isSuccess ? 'border-l-[3px] border-l-green-500' : ''}
                  ${isError ? 'border-l-[3px] border-l-red-500' : ''}
                  ${isLoading ? 'border-l-[3px] border-l-blue-500' : ''}
                  ${!isSuccess && !isError && !isLoading ? 'border-l-[3px] border-l-gray-400' : ''}
                `}
              >
                {/* Icon */}
                <div className={`
                  w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5
                  ${isSuccess ? 'bg-green-50' : ''}
                  ${isError ? 'bg-red-50' : ''}
                  ${isLoading ? 'bg-blue-50' : ''}
                  ${!isSuccess && !isError && !isLoading ? 'bg-gray-50' : ''}
                `}>
                  {isSuccess && <CheckCircle2 className="w-4.5 h-4.5 text-green-600" />}
                  {isError && <XCircle className="w-4.5 h-4.5 text-red-500" />}
                  {isLoading && <Loader2 className="w-4.5 h-4.5 text-blue-500 animate-spin" />}
                  {!isSuccess && !isError && !isLoading && <Info className="w-4.5 h-4.5 text-gray-500" />}
                </div>

                {/* Message */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-800 leading-snug">
                    {message}
                  </p>
                </div>

                {/* Dismiss */}
                {!isLoading && (
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors shrink-0 mt-0.5"
                    aria-label="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          }}
        </ToastBar>
      )}
    </Toaster>
  );
}
