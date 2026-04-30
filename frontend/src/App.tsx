import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./components/theme-provider";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import { Login, Register, VerifyEmail, ForgotPassword, ResetPassword } from "./pages/auth";
import { Admin } from "./pages/admin";
import Notes from "./pages/Notes";
import PastPapers from "./pages/PastPapers";
import Profile from "./pages/Profile";
import Blog from "./pages/Blog";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import FAQ from "./pages/FAQ";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import ScrollToTopOnNavigate from "./components/ScrollToTopOnNavigate";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="bbm-ui-theme">
      <AuthProvider>
        <TooltipProvider>
          <ToastContainer
            position="top-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
          <BrowserRouter>
            <ScrollToTopOnNavigate />
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* Public Routes */}
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="verify" element={<VerifyEmail />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="terms" element={<Terms />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="faq" element={<FAQ />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              
              {/* Protected Routes */}
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="notes/*" element={<Notes />} />
              <Route path="past-papers/*" element={<PastPapers />} />
              <Route path="profile" element={<Profile />} />
              <Route path="blog/*" element={<Blog />} />
              <Route path="admin/*" element={<Admin />} />
              
              {/* Catch all */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </ThemeProvider>
  </QueryClientProvider>
);

export default App;
