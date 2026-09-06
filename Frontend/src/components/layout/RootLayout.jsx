import { Outlet, ScrollRestoration } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

export default function RootLayout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </>
  );
}
