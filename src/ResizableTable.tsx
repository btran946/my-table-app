import React, { useState } from "react";
import { data as initialData } from "./mockDataWithIndex";
import "./ResizableTable.css";
import tableImage from "./tableImage.png";
import { Resizable } from "re-resizable";

const ResizableTable: React.FC = () => {
  const [data, setData] = useState(initialData);
  const [showUpdatedData, setShowUpdatedData] = useState(false);

  const imageWidth = 1100; // Actual width of the image in pixels
  const imageHeight = 800; // Actual height of the image in pixels

  const jsonWidth = data.SignatureSheet.Pages[0].Width; // Width from JSON
  const jsonHeight = data.SignatureSheet.Pages[0].Height; // Height from JSON

  const scaleX = imageWidth / jsonWidth;
  const scaleY = imageHeight / jsonHeight;

  const containerStyle: React.CSSProperties = {
    position: "absolute",
    left: `${data.Left * scaleX}px`,
    top: `${data.Top * scaleY}px`,
    width: `${(data.Right - data.Left) * scaleX}px`,
    height: `${(data.Bottom - data.Top) * scaleY}px`,
    border: "2px solid green", // For visual debugging
    boxSizing: "border-box",
  };

  const handleResizeStop = (e, direction, ref, d, columnIndex) => {
    console.log(columnIndex, "column index");
    setData((prevData) => {
      const newColumns = [...prevData.Columns];
      const resizedColumn = newColumns[columnIndex];
      const deltaWidth = d.width / scaleX;
      resizedColumn.Right += deltaWidth;

      for (let i = columnIndex + 1; i < newColumns.length; i++) {
        newColumns[i].Left += deltaWidth;
        newColumns[i].Right += deltaWidth;
      }

      const newRows = prevData.Rows.map((row) => {
        const newCells = row.Cells.map((cell) => {
          if (cell.ColumnIndex >= columnIndex) {
            return {
              ...cell,
              Left: newColumns[cell.ColumnIndex].Left,
              Right: newColumns[cell.ColumnIndex].Right,
            };
          }
          return cell;
        });
        return { ...row, Cells: newCells };
      });

      return { ...prevData, Columns: newColumns, Rows: newRows };
    });
  };

  const renderColumn = (column, index) => (
    <Resizable
      defaultSize={{
        width: (column.Right - column.Left) * scaleX,
        height: "100%", // Full height of the container
      }}
      key={column.ColumnIndex}
      enable={{ right: true }}
      onResizeStop={(e, direction, ref, d) =>
        handleResizeStop(e, direction, ref, d, index)
      }
      style={{
        border: "3px solid blue",
        boxSizing: "border-box",
      }}
    ></Resizable>
  );

  const renderRow = (row, rowIndex) => (
    <React.Fragment key={row.RowNumber}>
      {row.Cells.map((cell, cellIndex) => (
        <div
          key={`${rowIndex}-${cellIndex}`}
          style={{
            position: "absolute",
            left: `${cell.Left * scaleX}px`,
            top: `${cell.Top * scaleY}px`,
            width: `${(cell.Right - cell.Left) * scaleX}px`,
            height: `${(cell.Bottom - cell.Top) * scaleY}px`,
            border: "1px solid red",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {cell.Content}
        </div>
      ))}
    </React.Fragment>
  );

  return (
    <div className='container mt-5'>
      <div className='table-background'>
        <img src={tableImage} alt='background' className='table-image' />
        <div style={containerStyle}>
          <div style={{ display: "flex", height: "100%" }}>
            {data.Columns.map((column, index) => renderColumn(column, index))}
          </div>
        </div>
      </div>
      <button
        className='btn btn-primary mt-3'
        onClick={() => setShowUpdatedData(!showUpdatedData)}
      >
        Show Updated OCR Data
      </button>
      {showUpdatedData && (
        <div>{data.Rows.map((row, rowIndex) => renderRow(row, rowIndex))}</div>
      )}
    </div>
  );
};

export default ResizableTable;
