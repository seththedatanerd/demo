import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --safe-area-inset-top: env(safe-area-inset-top);
              --safe-area-inset-bottom: env(safe-area-inset-bottom);
            }
            
            .h-safe-top {
              height: var(--safe-area-inset-top);
              min-height: 20px;
            }
            
            .h-safe-bottom {
              height: var(--safe-area-inset-bottom);
              min-height: 20px;
            }
            
            .pb-safe {
              padding-bottom: calc(var(--safe-area-inset-bottom) + 20px);
            }
            
            .pt-safe {
              padding-top: var(--safe-area-inset-top);
            }
            
            /* Disable text selection on mobile for better UX */
            @media (max-width: 768px) {
              * {
                -webkit-touch-callout: none;
                -webkit-user-select: none;
                -khtml-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
              }
              
              /* Allow text selection in input fields */
              input, textarea {
                -webkit-user-select: text;
                -moz-user-select: text;
                -ms-user-select: text;
                user-select: text;
              }
            }
            
            /* Smooth scrolling */
            html {
              scroll-behavior: smooth;
            }
            
            /* Hide scrollbars on mobile */
            @media (max-width: 768px) {
              ::-webkit-scrollbar {
                width: 0px;
                background: transparent;
              }
            }
          `
        }} />
      </head>
      <body className={`${inter.className} bg-slate-50 overflow-x-hidden`}>
        {children}
      </body>
    </html>
  )
}
