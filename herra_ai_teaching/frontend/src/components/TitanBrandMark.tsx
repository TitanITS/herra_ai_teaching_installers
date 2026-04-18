import titanLogo from "../assets/branding/titan-logo.png";

type TitanBrandMarkProps = {
    className?: string;
    ghosted?: boolean;
};

export default function TitanBrandMark({ className = "", ghosted = false }: TitanBrandMarkProps) {
    return (
        <img
            src={titanLogo}
            alt="Titan Logo"
            className={`block h-auto w-auto object-contain ${className}`}
            style={{
                opacity: ghosted ? 0.05 : 1,
                filter: ghosted ? "grayscale(100%) brightness(180%)" : "none",
                pointerEvents: "none",
                userSelect: "none",
            }}
            draggable={false}
        />
    );
}