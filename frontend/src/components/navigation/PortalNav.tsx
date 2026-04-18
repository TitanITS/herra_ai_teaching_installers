import { NavLink } from "react-router-dom";

export default function PortalNav() {
    return (
        <nav className="pill-nav">
            <NavLink to="/portal/dashboard">Dashboard</NavLink>
            <NavLink to="/portal/support">Support</NavLink>
            <NavLink to="/portal/deployments">Deployments</NavLink>
            <NavLink to="/portal/connectors">Secure Network Connectors</NavLink>
            <NavLink to="/portal/billing">Billing</NavLink>
            <NavLink to="/portal/users">Users</NavLink>
            <NavLink to="/portal/settings">Settings</NavLink>
        </nav>
    );
}