import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { ROUTES } from './routes';
import Home from './pages/Home';
import About from './pages/About';
import Auth from './pages/Auth';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Play from './pages/Play';
import Result from './pages/Result';
import Profile from './pages/Profile';
import Stats from './pages/Stats';
import Faq from './pages/Faq';
import Contact from './pages/Contact';
import Legal from './pages/Legal';
import SiteMap from './pages/SiteMap';
import ServerError from './pages/ServerError';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path={ROUTES.home} element={<Home />} />
        <Route path={ROUTES.about} element={<About />} />
        <Route path={ROUTES.auth} element={<Auth />} />
        <Route path={ROUTES.forgotPassword} element={<ForgotPassword />} />
        <Route path={ROUTES.resetPassword} element={<ResetPassword />} />
        <Route element={<ProtectedRoute />}>
          <Route path={ROUTES.play} element={<Play />} />
          <Route path={ROUTES.result} element={<Result />} />
          <Route path={ROUTES.profile} element={<Profile />} />
          <Route path={ROUTES.stats} element={<Stats />} />
        </Route>
        <Route path={ROUTES.faq} element={<Faq />} />
        <Route path={ROUTES.contact} element={<Contact />} />
        <Route path={ROUTES.legal} element={<Legal />} />
        <Route path={ROUTES.siteMap} element={<SiteMap />} />
        <Route path={ROUTES.serverError} element={<ServerError />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
