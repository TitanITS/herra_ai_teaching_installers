import type { ReactNode } from "react";

type Column<T> = {
    header: string;
    render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
    columns: Column<T>[];
    rows: T[];
    keyExtractor: (row: T, index: number) => string;
};

function buildGridTemplate(columnCount: number) {
    return `repeat(${columnCount}, minmax(140px, 1fr))`;
}

export default function DataTable<T>({ columns, rows, keyExtractor }: DataTableProps<T>) {
    const gridTemplateColumns = buildGridTemplate(columns.length);

    return (
        <div className="table-like">
            <div className="table-like__row table-like__row--header" style={{ gridTemplateColumns }}>
                {columns.map((column) => (
                    <div key={column.header}>{column.header}</div>
                ))}
            </div>

            {rows.map((row, index) => (
                <div className="table-like__row" key={keyExtractor(row, index)} style={{ gridTemplateColumns }}>
                    {columns.map((column) => (
                        <div key={column.header}>{column.render(row)}</div>
                    ))}
                </div>
            ))}
        </div>
    );
}