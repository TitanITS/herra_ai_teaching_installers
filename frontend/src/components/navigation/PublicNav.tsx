import { NavLink } from "react-router-dom";

export default function PublicNav() {
    return (
        <nav className="pill-nav">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/product">Product</NavLink>
            <NavLink to="/pricing">Pricing</NavLink>
            <NavLink to="/about">About</NavLink>
            <NavLink to="/contact">Request a Demo</NavLink>
        </nav>
    );
}