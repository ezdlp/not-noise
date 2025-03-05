import React from 'react';
import { Routes, Route } from 'react-router-dom';
import NewUsersPage from './NewUsers';

const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/users" element={<NewUsersPage />} />
      {/* Add other admin routes here */}
    </Routes>
  );
};

export default AdminRoutes;