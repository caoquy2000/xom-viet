import type { AppProps } from "next/app";
import Head from "next/head";
import "@/styles/globals.css";
import { ClientProvider } from "@/providers/client-provider";
export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Xóm — Chuyện vui trong xóm</title>
        <meta
          name="description"
          content="Meme Việt, chuyện đời thường và những người hàng xóm vui tính."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <ClientProvider>
        <Component {...pageProps} />
      </ClientProvider>
    </>
  );
}
