import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-center py-32 px-16">
        <div className="flex flex-col items-center gap-8 text-center">
          <h1 className="text-4xl font-bold text-black dark:text-zinc-50">
            Learn Vercel AI SDK
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            AI SDKの学習用サンプルアプリケーション
          </p>
          
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-4xl">
            <Link
              href="/generate"
              className="flex flex-col items-center justify-center p-6 rounded-lg border border-solid border-black/[.08] bg-white dark:bg-gray-800 dark:border-white/[.145] transition-colors hover:border-transparent hover:bg-black/[.04] dark:hover:bg-[#1a1a1a]"
            >
              <div className="text-2xl font-semibold mb-2 text-black dark:text-zinc-50">
                Generate
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                非ストリーミングテキスト生成
              </p>
            </Link>
            
            <Link
              href="/stream"
              className="flex flex-col items-center justify-center p-6 rounded-lg border border-solid border-black/[.08] bg-white dark:bg-gray-800 dark:border-white/[.145] transition-colors hover:border-transparent hover:bg-black/[.04] dark:hover:bg-[#1a1a1a]"
            >
              <div className="text-2xl font-semibold mb-2 text-black dark:text-zinc-50">
                Stream
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                ストリーミングテキスト生成
              </p>
            </Link>
            
            <Link
              href="/chat"
              className="flex flex-col items-center justify-center p-6 rounded-lg border border-solid border-black/[.08] bg-white dark:bg-gray-800 dark:border-white/[.145] transition-colors hover:border-transparent hover:bg-black/[.04] dark:hover:bg-[#1a1a1a]"
            >
              <div className="text-2xl font-semibold mb-2 text-black dark:text-zinc-50">
                Chat
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                useChat()を使ったチャット
              </p>
            </Link>
            
            <Link
              href="/message-demo"
              className="flex flex-col items-center justify-center p-6 rounded-lg border border-solid border-black/[.08] bg-white dark:bg-gray-800 dark:border-white/[.145] transition-colors hover:border-transparent hover:bg-black/[.04] dark:hover:bg-[#1a1a1a]"
            >
              <div className="text-2xl font-semibold mb-2 text-black dark:text-zinc-50">
                Message Demo
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                AI Elements Messageコンポーネント
              </p>
            </Link>
            
            <Link
              href="/conversation-demo"
              className="flex flex-col items-center justify-center p-6 rounded-lg border border-solid border-black/[.08] bg-white dark:bg-gray-800 dark:border-white/[.145] transition-colors hover:border-transparent hover:bg-black/[.04] dark:hover:bg-[#1a1a1a]"
            >
              <div className="text-2xl font-semibold mb-2 text-black dark:text-zinc-50">
                Conversation Demo
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                AI Elements Conversationコンポーネント
              </p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
