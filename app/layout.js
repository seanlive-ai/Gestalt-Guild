import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';
import Header from './Header';

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
});

const body = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
});

export const metadata = {
  title: 'Gestalt Guild',
  description: 'Connect, organize, and protect your tabletop gaming community.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
