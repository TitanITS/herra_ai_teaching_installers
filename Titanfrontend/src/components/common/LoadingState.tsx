export default function LoadingState({ message = "Loading..." }: { message?: string }) {
    return <div className="center-message">{message}</div>;
}
