import { Link } from "react-router-dom";

export default function StickyActionBar() {
    return (
        <div className="sticky-action-bar">
            <div className="sticky-action-bar__inner">
                <Link className="button-link" to="/contact">
                    Request a Demo
                </Link>
                <Link className="ghost-button" to="/product">
                    Explore the Product
                </Link>
                <Link className="ghost-button" to="/pricing">
                    View Pricing
                </Link>
            </div>
        </div>
    );
}