import React from "react";
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
  const imageWidth = 1100; // Actual width of the image in pixels
  const imageHeight = 800; // Actual height of the image in pixels

  const jsonWidth = data.SignatureSheet.Pages[0].Width; // Width from JSON
  const jsonHeight = data.SignatureSheet.Pages[0].Height; // Height from JSON

  const scaleX = imageWidth / jsonWidth;
  const scaleY = imageHeight / jsonHeight;

  const renderCell = (cell: Cell, rowIndex: number) => (
    <div
      key={`${rowIndex}-${cell.ColumnIndex}`}
      style={{
        position: "absolute",
        left: `${cell.Left * scaleX}px`,
        top: `${cell.Top * scaleY}px`,
        width: `${(cell.Right - cell.Left) * scaleX}px`,
        height: `${(cell.Bottom - cell.Top) * scaleY}px`,
        border: "3px solid red",
        boxSizing: "border-box",
      }}
    ></div>
  );

  const renderRow = (row: Row, rowIndex: number) => (
    <React.Fragment key={row.RowNumber}>
      {row.Cells.map((cell, cellIndex) => renderCell(cell, rowIndex))}
    </React.Fragment>
  );

  return (
    <div className="container mt-5">
      <div className="table-background">
        <img src={tableImage} alt="background" className="table-image" />
        <div className="table-overlay">
          {data.Rows.map((row, rowIndex) => renderRow(row, rowIndex))}
        </div>
      </div>
    </div>
  );
};

export default ResizableTable;
