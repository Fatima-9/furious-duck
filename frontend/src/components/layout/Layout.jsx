import { Outlet } from 'react-router-dom';
import Nav from './Nav';
import Footer from './Footer';
import Toast from './Toast';
import ScrollToTop from './ScrollToTop';

export default function Layout() {
  return (
    <div
      id="ttt-top"
      style={{
        fontFamily: "'Mulish',system-ui,sans-serif",
        color: 'var(--ink)',
        background: 'var(--paper)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <ScrollToTop />
      <Nav />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
      <Toast />
    </div>
  );
}
