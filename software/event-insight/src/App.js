import React from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import UserHome from './pages/user/UserHome';
import UserLiveMap from './pages/user/UserLiveMap';
import UserResults from './pages/user/UserResults';
import AdminHome from './pages/admin/AdminHome';
import AdminLiveMap from './pages/admin/AdminLiveMap';
import AdminResults from './pages/admin/AdminResults';
import AdminLogin from './pages/admin/AdminLogin';
import {AuthProvider} from './components/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AdminSponsors from './pages/admin/AdminSponsors';
import AddEvent from './pages/AddEvent';
import EditText from "./pages/admin/EditText";
import AdminEdit from "./pages/admin/AdminEdit";

import 'leaflet/dist/leaflet.css';

const App = () => {
    const LOGIN_PATH = '/adminLogin';

    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<LandingPage/>}/>
                    <Route path="/addevent" element={<PrivateRoute element={<AddEvent/>}/>}/>

                    <Route path="/event/:id" element={<UserHome/>}/>
                    <Route path="/event/:id/userLiveMap" element={<UserLiveMap/>}/>
                    <Route path="/event/:id/userResults" element={<UserResults/>}/>

                    <Route path="/event/:id/adminHome" element={<PrivateRoute element={<AdminHome/>}/>}/>
                    <Route path="/event/:id/adminLiveMap" element={<PrivateRoute element={<AdminLiveMap/>}/>}/>
                    <Route path="/event/:id/adminResults" element={<PrivateRoute element={<AdminResults/>}/>}/>
                    <Route path="/event/:id/adminSponsors" element={<PrivateRoute element={<AdminSponsors/>}/>}/>
                    <Route path="/event/:id/editText" element={<PrivateRoute element={<EditText/>}/>}/>
                    <Route path="/event/:id/adminEdit" element={<PrivateRoute element={<AdminEdit/>}/>}/>


                    <Route path={LOGIN_PATH} element={<AdminLogin/>}/>

                    <Route path="*" element={<Navigate to="/"/>}/>
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;
