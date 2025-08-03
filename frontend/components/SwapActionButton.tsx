import React from "react";

interface SwapActionButtonProps {
  isConnected: boolean;
  isReviewComplete: boolean;
  isPending: boolean;
  isReviewing: boolean;
  loadingMessage: string | null;
  onApprove: () => void;
  onSwap: () => void;
  onReview: () => void;
}

const SwapActionButton: React.FC<SwapActionButtonProps> = ({
  isConnected,
  isReviewComplete,
  isPending,
  isReviewing,
  loadingMessage,
  onApprove,
  onSwap,
  onReview,
}) => {
  return (
    <>
      {isConnected ? (
        <>
          {isReviewComplete && !isPending ? (
            <button
              onClick={onApprove}
              className="w-full bg-blue-700 text-white py-3 px-4 rounded hover:bg-blue-600 transition duration-300 mt-3"
              disabled={isReviewing}
            >
              {isReviewing ? (
                <div className="animate-spin h-5 w-5 mx-auto">⏳</div>
              ) : (
                "Approve Token"
              )}
            </button>
          ) : isReviewComplete ? (
            <button
              onClick={onSwap}
              className="w-full bg-green-700 text-white py-3 px-4 rounded hover:bg-green-600 transition duration-300 mt-3"
              disabled={isPending}
            >
              {isPending ? (
                <div className="animate-spin h-5 w-5 mx-auto">⏳</div>
              ) : (
                "Execute Swap"
              )}
            </button>
          ) : (
            <button
              onClick={onReview}
              className="w-full bg-violet-700 text-white py-3 px-4 rounded hover:bg-violet-600 transition duration-300 mt-3"
              disabled={isReviewing}
            >
              {isReviewing ? (
                <div className="animate-spin h-5 w-5 mx-auto">⏳</div>
              ) : (
                "Review Swap"
              )}
              {loadingMessage && (
                <p className="mt-4 text-center text-sm text-gray-500">
                  {loadingMessage}
                </p>
              )}
            </button>
          )}
        </>
      ) : (
        <button
          disabled
          className="w-full bg-gray-500 text-white py-3 px-4 rounded"
        >
          Please connect wallet first
        </button>
      )}
    </>
  );
};

export default SwapActionButton;
