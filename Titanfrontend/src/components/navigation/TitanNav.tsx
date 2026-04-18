import { NavLink } from "react-router-dom";

export default function TitanNav() {
    return (
        <nav className="pill-nav">
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/sales">Sales</NavLink>
            <NavLink to="/customers">Customers</NavLink>
            <NavLink to="/deployments">Deployments</NavLink>
            <NavLink to="/connectors">Connectors</NavLink>
            <NavLink to="/my-page">My Page</NavLink>
        </nav>
    );
}