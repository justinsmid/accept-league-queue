import LandingPage from "./pages/landing/LandingPage";
import Dashboard from "./pages/dashboard/Dashboard";

export default [
    {
        path: '/landing',
        title: 'Landing page',
        component: LandingPage
    },
    {
        path: '/dashboard',
        title: 'Dashboard',
        component: Dashboard
    }
];