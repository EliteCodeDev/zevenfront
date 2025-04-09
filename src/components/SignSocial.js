import { signIn } from "next-auth/react";


export default function Example() {
  return (
    <>
      <div className="mt-6 grid grid-cols-1 gap-4">

        <button
          onClick={() => signIn('google')}
          className="flex items-center justify-center gap-2 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white px-4 py-2.5 rounded-md shadow-sm hover:shadow-md transition-shadow duration-300"
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
            alt="Google"
            className="h-5 w-5"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">Google</span>
        </button>
      </div>
    </>
  )
}
