import React, { useEffect } from "react";
import { data } from "./mockData";
import "./ResizableTable.css";
import tableImage from "./tableImage.png";

interface Cell {
  Left: number;
  Top: number;
  Right: number;
  Bottom: number;
  Value: string;
  Content: string;
  IsReviewed: boolean;
  ColumnIndex?: number;
  RowIndex?: number;
  ColumnSpan?: number;
  RowSpan?: number;
}

interface Row {
  Left: number;
  Top: number;
  Right: number;
  Bottom: number;
  IsReviewed: boolean;
  RowNumber: number;
  RowIndex?: number;
  Cells: Cell[];
}

interface Data {
  SignatureSheetId: number;
  PageNumber: number;
  SignatureSheet: {
    Id: number;
    SheetNumber: number;
    Pages: { PageNumber: number; Height: number; Width: number }[];
  };
  Rows: Row[];
  Columns: {
    ColumnIndex: number;
    Left: number;
    Top: number;
    Right: number;
    Bottom: number;
  }[];
  Cells: Cell[];
  Left: number;
  Top: number;
  Right: number;
  Bottom: number;
}

const ResizableTable: React.FC = () => {
  useEffect(() => {
    const addResizeListeners = () => {
      const handles = document.querySelectorAll(".resize-handle");

      handles.forEach((handle) => {
        handle.addEventListener("mousedown", (e: MouseEvent) => {
          const cell = (e.target as HTMLElement).parentElement as HTMLElement;
          const startX = e.pageX;
          const startY = e.pageY;
          const startWidth = parseInt(window.getComputedStyle(cell).width, 10);
          const startHeight = parseInt(window.getComputedStyle(cell).height, 10);

          const doDrag = (e: MouseEvent) => {
            const newWidth = startWidth + e.pageX - startX;
            const newHeight = startHeight + e.pageY - startY;
            if (newWidth > 0) {
              cell.style.width = `${newWidth}px`;
            }
            if (newHeight > 0) {
              cell.style.height = `${newHeight}px`;
            }
          };

          const stopDrag = () => {
            document.documentElement.removeEventListener("mousemove", doDrag);
            document.documentElement.removeEventListener("mouseup", stopDrag);
          };

          document.documentElement.addEventListener("mousemove", doDrag);
          document.documentElement.addEventListener("mouseup", stopDrag);
        });
      });
    };

    addResizeListeners();
  }, []);

  const renderCell = (cell: Cell, rowIndex: number) => (
    <td
      key={`${rowIndex}-${cell.ColumnIndex}`}
      style={{
        width: `${(cell.Right - cell.Left) * 40}px`, // Assuming 1 unit in JSON equals 10px
        height: `${(cell.Bottom - cell.Top) * 40}px`, // Assuming 1 unit in JSON equals 10px
      }}
    >
      <div className="resize-handle right"></div>
      <div className="resize-handle bottom"></div>
    </td>
  );

  const renderRow = (row: Row) => (
    <tr key={row.RowNumber}>
      {row.Cells.map((cell, cellIndex) => renderCell(cell, row.RowNumber))}
    </tr>
  );

  return (
    <div className="container mt-5">
      <div className="table-background">
        <img src={tableImage} alt="background" className="table-image" />
        <div className="table-overlay">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>#</th>
                {data.Columns.map((_, index) => (
                  <th key={index}></th>
                ))}
              </tr>
            </thead>
            <tbody>{data.Rows.map((row) => renderRow(row))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResizableTable;
