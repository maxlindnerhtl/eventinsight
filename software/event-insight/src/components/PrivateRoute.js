import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ element }) => {
    const token = localStorage.getItem('token');
    const LOGIN_PATH = '/adminLogin';

    return token ? element : <Navigate to={LOGIN_PATH} />;
};

export default PrivateRoute;
