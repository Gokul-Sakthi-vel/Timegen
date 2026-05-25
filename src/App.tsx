import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Subjects from './pages/Subjects';
import Faculty from './pages/Faculty';
import Classes from './pages/Classes';
import Rooms from './pages/Rooms';
import Generate from './pages/Generate';
import ViewTimetable from './pages/ViewTimetable';
import ScheduleView from './pages/ScheduleView';
import Settings from './pages/Settings';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />


        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="faculty" element={<Faculty />} />
          <Route path="classes" element={<Classes />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="generate" element={<Generate />} />
          <Route path="view-timetable" element={<ViewTimetable />} />
          <Route path="view-timetable/:id" element={<ScheduleView />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
