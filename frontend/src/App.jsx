import { Routes, Route } from 'react-router-dom';
import PublicLayout from './components/PublicLayout';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';

import Home from './pages/Home';
import Login from './pages/Login';
import Socials from './pages/Socials';
import Posts from './pages/Posts';
import PostView from './pages/PostView';
import NotFound from './pages/NotFound';

import Overview from './pages/dash/Overview';
import Leaderboard from './pages/dash/Leaderboard';
import Servers from './pages/dash/Servers';
import ServerDetail from './pages/dash/ServerDetail';
import Giveaways from './pages/dash/Giveaways';
import Profile from './pages/dash/Profile';
import Admin from './pages/admin/Admin';
import Premium from './pages/Premium';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/socials" element={<Socials />} />
          <Route path="/blogs" element={<Posts type="blog" />} />
          <Route path="/news" element={<Posts type="news" />} />
          <Route path="/post/:slug" element={<PostView />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Overview />} />
          <Route path="top-users" element={<Leaderboard scope="users" />} />
          <Route path="top-servers" element={<Leaderboard scope="servers" />} />
          <Route path="servers" element={<Servers />} />
          <Route path="servers/:guildId" element={<ServerDetail />} />
          <Route path="giveaways" element={<Giveaways />} />
          <Route path="premium" element={<Premium />} />
          <Route path="profile" element={<Profile />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </>
  );
}
