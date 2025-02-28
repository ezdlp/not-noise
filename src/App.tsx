import { BrowserRouter, Routes, Route } from "react-router-dom";
import Help from "./pages/Help";

// Import other pages as needed
// import Home from "./pages/Home";
// import Dashboard from "./pages/Dashboard";
// etc.

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Home Page</div>} />
        <Route path="/help" element={<Help />} />
        <Route path="/help/:slug" element={<Help />} />
        {/* Add other routes as needed */}
      </Routes>
    </BrowserRouter>
  );
}
