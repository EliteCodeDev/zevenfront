import '../styles/globals.css';
import { SessionProvider } from 'next-auth/react';
import Head from 'next/head';
import { Toaster } from 'sonner';
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';
import { ThemeProvider } from "../components/ui/theme-provider"; // Asegúrate de que la ruta sea correcta
import ChatwootWidget from '@/components/ChatWidget';
//import ModalRoullete from '@/components/roullete/ModalRoullete';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <>
      <Head>
        <title>{String(process.env.NEXT_PUBLIC_NAME_APP || "")}</title>
      </Head>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <SessionProvider session={session}>
          <ProgressBar
            height="4px"
            color="#ffb800"
            options={{ showSpinner: false }}
            shallowRouting
          />
          <Toaster closeButton richColors position="top-right" />
          <Component {...pageProps} />
          {/* <div style={{ position: 'fixed', bottom: '10px', right: '10px', zIndex: 1000 }} className='flex flex-col gap-4'>
            <ModalRoullete />
            {/* <ChatwootWidget /> 
          </div> */}

        </SessionProvider>

      </ThemeProvider>
    </>
  );
}

export default MyApp;
