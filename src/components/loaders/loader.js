/* src/components/loaders/loader.js */
const LoaderSkeleton = () => {
  return (
    <div className="flex-col gap-4 w-full flex items-center justify-center">
      <div className="w-28 h-28 border-8 text-[var(--app-primary)] text-4xl animate-spin border-gray-300 flex items-center justify-center border-t-[var(--app-primary)] rounded-full">
        <img
          src="/images/icon-dark.png"
          alt="Cargando"
          className="w-14 h-14 bg-transparent" />
      </div>
    </div>
  );
};

export default LoaderSkeleton;