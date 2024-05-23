import React from "react";
import { data } from "./mockData";
import "./ResizableTable.css";
import tableImage from "./tableImage.png";

const ResizableTable: React.FC = () => {
  const imageWidth = 1100; // Actual width of the image in pixels
  const imageHeight = 800; // Actual height of the image in pixels

  const jsonWidth = data.SignatureSheet.Pages[0].Width; // Width from JSON
  const jsonHeight = data.SignatureSheet.Pages[0].Height; // Height from JSON

  const scaleX = imageWidth / jsonWidth;
  const scaleY = imageHeight / jsonHeight;

  const renderCell = (cell, rowIndex) => (
    <td
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
    ></td>
  );

  const renderRow = (row, rowIndex) => (
    <tr key={row.RowNumber}>
      {row.Cells.map((cell, cellIndex) => renderCell(cell, rowIndex))}
    </tr>
  );

  return (
    <div className='container mt-5'>
      <div className='table-background'>
        <img src={tableImage} alt='background' className='table-image' />
        <table className='table-overlay'>
          <tbody>
            {data.Rows.map((row, rowIndex) => renderRow(row, rowIndex))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResizableTable;
