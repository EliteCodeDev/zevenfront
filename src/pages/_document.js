import { Html, Head, Main, NextScript } from "next/document";


export default function Document() {
  return (
    <Html lang="es" className="h-full">
      <Head>
      <link href="https://rsms.me/inter/inter.css" rel="stylesheet"/>
      </Head>
      <body className="h-full bg-gray-100 dark:bg-zinc-900">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
