import { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';

export default function Document() {
  return (
    <Html>
      <Head>
        <Script strategy="beforeInteractive" src="/js/config.js" type="text/javascript" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
