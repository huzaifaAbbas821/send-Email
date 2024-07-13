import React from 'react';
import { Route, Navigate } from 'react-router-dom';

// This component wraps other components and checks for authentication
const ProtectedRoute = ({ element, isAuthenticated, ...rest }) => {
  return (
    <Route
      {...rest}
      element={isAuthenticated ? element : <Navigate to="/" />}
    />
  );
};

export default ProtectedRoute;
