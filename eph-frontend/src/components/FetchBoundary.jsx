const FetchBoundary = ({ isLoading, error, onRetry, children }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-secondary-text">
        Loading…
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="text-red-500 font-medium">Failed to load, retry</div>
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg border border-border bg-surface hover:bg-border transition"
        >
          Retry
        </button>
      </div>
    );
  }
  return children;
};

export default FetchBoundary;
