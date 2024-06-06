import React, { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { data as initialData } from "./mockDataWithIndex";
import "./ResizableTable.css";
import tableImage from "./tableImage.png";
import { Resizable } from "re-resizable";
import { Container, Section, Bar } from "@column-resizer/react";

const ResizableTable: React.FC = () => {
  const [data, setData] = useState(initialData);
  const [hideRows, setHideRows] = useState(false);
  const [hideColumns, setHideColumns] = useState(false);
  const [showUpdatedData, setShowUpdatedData] = useState(false);

  const rowRefs = useRef<Array<RefObject<HTMLDivElement>>>([]);
  const columnRefs = useRef<Array<RefObject<HTMLDivElement>>>([]);

  useEffect(() => {
    rowRefs.current = data.Rows.map(
      (_, index) => rowRefs.current[index] || React.createRef<HTMLDivElement>()
    );
    columnRefs.current = data.Columns.map(
      (_, index) =>
        columnRefs.current[index] || React.createRef<HTMLDivElement>()
    );
  }, [data.Columns, data.Rows, data.Rows.length]);

  const rowsContainerRef = useRef<HTMLDivElement | null>(null);
  const columnsContainerRef = useRef<HTMLDivElement | null>(null);

  const imageWidth = 1100; // Actual width of the image in pixels
  const imageHeight = 800; // Actual height of the image in pixels

  const jsonWidth = data.SignatureSheet.Pages[0].Width; // Width from JSON
  const jsonHeight = data.SignatureSheet.Pages[0].Height; // Height from JSON

  const scaleX = imageWidth / jsonWidth;
  const scaleY = imageHeight / jsonHeight;

  const resizableContainerStyles: React.CSSProperties = {
    position: "absolute",
    left: `${data.Left * scaleX}px`,
    top: `${data.Top * scaleY}px`,
    width: `${(data.Right - data.Left) * scaleX}px`,
    height: `${(data.Bottom - data.Top) * scaleY}px`,
    boxSizing: "border-box",
  };

  const rowsContainerStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    visibility: hideRows ? "hidden" : "visible",
    height: "100%",
    width: "100%",
    position: "absolute",
    top: 0,
    left: 0,
  };

  const handleColumnResizeStop = (columnIndex) => {
    const columnElement = columnRefs.current[columnIndex].current;
    const newSize = columnElement
      ? columnElement.getBoundingClientRect().width
      : 0;

    setData((prevData) => {
      const newData = { ...prevData };
      const column = newData.Columns[columnIndex];

      const newRight = column.Left + newSize / scaleX;

      const widthChange = newRight - column.Right;

      column.Right = newRight;

      // Adjust the positions of subsequent columns
      for (let i = columnIndex + 1; i < newData.Columns.length; i++) {
        newData.Columns[i].Left += widthChange;
        newData.Columns[i].Right += widthChange;
      }

      // Update the positions of the cells in the affected columns
      newData.Rows.forEach((row) => {
        row.Cells.forEach((cell) => {
          if (cell.ColumnIndex >= columnIndex) {
            if (cell.ColumnIndex === columnIndex) {
              cell.Right += widthChange;
            } else {
              cell.Left += widthChange;
              cell.Right += widthChange;
            }
          }
        });
      });

      return newData;
    });
  };

  const handleRowResizeStop = () => {
    let newCells = [];
    const updatedRows = data.Rows.map((row, index) => {
      const rowRef = rowRefs.current[index];
      if (rowRef && rowRef.current) {
        const rect = rowRef.current.getBoundingClientRect();

        const newTop = rect.top / scaleY;
        const newBottom = rect.bottom / scaleY;

        const updatedCells = row.Cells.map((cell) => {
          return {
            ...cell,
            Top: newTop,
            Bottom: newBottom,
          };
        });
        // Return the updated row with updated cells
        newCells = [...newCells, updatedCells];
        return {
          ...row,
          Top: newTop,
          Bottom: newBottom,
          Cells: updatedCells,
        };
      }

      return row;
    });

    setData((prevData) => {
      return { ...prevData, Rows: updatedRows, Cells: newCells };
    });
    setHideColumns(false);
    if (rowsContainerRef.current && columnsContainerRef.current) {
      columnsContainerRef.current.style.height = `${rowsContainerRef.current.offsetHeight}px`;
    }
  };

  const renderColumns = () => {
    const lastIndex = data.Columns.length - 1;
    return data.Columns.map((column, index) => (
      <React.Fragment key={column.ColumnIndex}>
        <Section
          ref={columnRefs.current[index]}
          defaultSize={(column.Right - column.Left) * scaleX}
          onSizeChanged={() => handleColumnResizeStop(index)}
        />

        {index !== lastIndex && (
          <Bar size={4} style={{ background: "red", cursor: "col-resize" }} />
        )}
      </React.Fragment>
    ));
  };

  const renderRow = (row, index: number) => (
    <div
      ref={rowRefs.current[index]}
      key={`${index}-${row.rowIndex}`}
      style={{
        borderTop: "3px solid green",
        borderBottom: "3px solid green",
        borderLeft: "3px solid green",
        borderRight: hideColumns ? "3px solid green" : "3px solid red",
        visibility: hideRows ? "hidden" : "visible",
        boxSizing: "border-box",
        height: "100%",
      }}
    ></div>
  );

  const Rows = useMemo(() => {
    return data.Rows.map((column, index) => renderRow(column, index));
  }, [data.Columns, hideColumns, hideRows, setData]);

  const renderTableFromRows = (row, rowIndex: number) => (
    <React.Fragment key={row.RowNumber}>
      {row.Cells.map((cell, cellIndex: number) => (
        <div
          key={`${rowIndex}-${cellIndex}`}
          style={{
            position: "absolute",
            left: `${cell.Left * scaleX}px`,
            top: `${cell.Top * scaleY}px`,
            width: `${(cell.Right - cell.Left) * scaleX}px`,
            height: `${(cell.Bottom - cell.Top) * scaleY}px`,
            border: "3px solid red",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        ></div>
      ))}
    </React.Fragment>
  );

  return (
    <div className='container mt-5'>
      <div className='table-background'>
        <img src={tableImage} alt='background' className='table-image' />
        <Resizable
          defaultSize={{
            width: `${(data.Right - data.Left) * scaleX}px`,
            height: `${(data.Bottom - data.Top) * scaleY}px`,
          }}
          enable={{ bottom: true, right: true }}
          onResizeStop={() => handleRowResizeStop()}
          onResizeStart={(e, direction) => {
            if (direction === "bottom") {
              setHideColumns(true);
            }
          }}
          style={resizableContainerStyles}
        >
          <div ref={rowsContainerRef} style={rowsContainerStyles}>
            {Rows}
          </div>
          <Container
            ref={columnsContainerRef}
            className='resize-container'
            style={{
              width: `${(data.Right - data.Left) * scaleX}px`,
              height: `${(data.Bottom - data.Top) * scaleY}px`,
              visibility: hideColumns ? "hidden" : "visible",
              position: "absolute",
              left: 0,
              top: 0,
            }}
          >
            {renderColumns()}
          </Container>

          {showUpdatedData && (
            <div
              style={{
                position: "absolute",
                top: -240,
                left: -55,
              }}
            >
              {data.Rows.map((row, rowIndex) =>
                renderTableFromRows(row, rowIndex)
              )}
            </div>
          )}
        </Resizable>
      </div>

      <button
        className='btn btn-primary mt-3'
        onClick={() => {
          setShowUpdatedData(!showUpdatedData);
          setHideColumns(!hideColumns);
          setHideRows(!hideRows);
        }}
      >
        Show Updated OCR Data
      </button>
    </div>
  );
};

export default ResizableTable;
