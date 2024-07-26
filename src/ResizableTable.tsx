import React, { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { data as initialData } from "./mockDataWithIndex";
import "./ResizableTable.css";
import tableImage from "./tableImage.png";
import { Resizable } from "re-resizable";
import {
  Container,
  Section,
  Bar,
  ColumnResizer,
  Resizer,
} from "@column-resizer/react";

const barWidth = 3;

const ResizableTable: React.FC = () => {
  const [data, setData] = useState(initialData);

  const imageWidth = 1100; // Actual width of the image in pixels
  const imageHeight = 800; // Actual height of the image in pixels

  const jsonWidth = data.SignatureSheet.Pages[0].Width; // Width from JSON
  const jsonHeight = data.SignatureSheet.Pages[0].Height; // Height from JSON

  const scaleX = imageWidth / jsonWidth;
  const scaleY = imageHeight / jsonHeight;

  const [hideRows, setHideRows] = useState(false);
  const [hideColumns, setHideColumns] = useState(false);
  const [showUpdatedData, setShowUpdatedData] = useState(false);

  const [resizableContainerWidth, setResizableContainerWidth] = useState(
    (data.Right - data.Left) * scaleX
  );
  const [resizableContainerHeight, setResizableContainerHeight] = useState(
    (data.Bottom - data.Top) * scaleY
  );
  const [resizableContainerLeft, setResizableContainerLeft] = useState(
    data.Left * scaleX
  );
  const [columnsTotalWidth, setColumnsTotalWidth] = useState(0);

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
  const ResizerRef = useRef<ColumnResizer | null>(null);

  const hiddenColumnWidth =
    (imageWidth - (data.Right - data.Left) * scaleX) / 2;

  const columnsContainerStyles: React.CSSProperties = {
    position: "absolute",
    top: `${data.Top * scaleY}px`,
  };

  const resizableContainerStyles: React.CSSProperties = {
    position: "absolute",
    top: `${data.Top * scaleY}px`,
    left: resizableContainerLeft,
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

  const handleColumnResizeStop = (columnIndex: number) => {
    setHideRows(true);
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

  const updateTotalWidth = (resizer: Resizer) => {
    let totalWidth = 0;
    columnRefs.current.forEach((column, index) => {
      totalWidth += resizer.getSectionSize(index + 1) + barWidth;
    });
    setColumnsTotalWidth(totalWidth);
  };

  const handleLeftEdgeResize = (resizer: Resizer) => {
    if (resizer.isSectionResized(0)) {
      const newLeft = resizer.getSectionSize(0);
      setData((prevData) => {
        const newData = { ...prevData };
        newData.Left = newLeft;
        return newData;
      });
    }
  };

  const handleRightEdgeResize = (resizer: Resizer) => {
    if (resizer.isSectionResized(columnRefs.current.length + 1)) {
      const lastIndex = columnRefs.current.length - 1;
      const lastColumn = columnRefs.current[lastIndex].current;
      if (lastColumn) {
        setData((prevData) => {
          const newData = { ...prevData };
          const newRightContainer =
            lastColumn.offsetLeft + lastColumn.offsetWidth;
          newData.Right = newRightContainer / scaleX;
          return newData;
        });
      }
    }
  };

  const handleLeftEdgeResizeStop = (currentSize: number) => {
    setResizableContainerLeft(currentSize);
    setResizableContainerWidth(columnsTotalWidth);
  };

  const handleRowResizeStop = (elementRef: HTMLElement) => {
    const newBottom = (elementRef.offsetTop + elementRef.offsetHeight) / scaleY;
    let newCells = [];
    const updatedRows = data.Rows.map((row, index) => {
      const rowRef = rowRefs.current[index];
      if (rowRef && rowRef.current) {
        const rowElement = rowRef.current;

        const newCellBottom =
          (rowElement.offsetTop + rowElement.offsetHeight) / scaleY;

        const newTop = rowElement.offsetTop / scaleY;

        const updatedCells = row.Cells.map((cell) => {
          return {
            ...cell,
            Top: newTop,
            Bottom: newCellBottom,
          };
        });
        newCells = [...newCells, updatedCells];
        return {
          ...row,
          Top: newTop,
          Bottom: newCellBottom,
          Cells: updatedCells,
        };
      }

      return row;
    });

    setData((prevData) => {
      return {
        ...prevData,
        Rows: updatedRows,
        Cells: newCells,
        Bottom: newBottom,
      };
    });
    setHideColumns(false);
    if (rowsContainerRef.current && columnsContainerRef.current) {
      columnsContainerRef.current.style.height = `${rowsContainerRef.current.offsetHeight}px`;
    }
  };

  const renderColumns = () => {
    return data.Columns.map((column, index) => (
      <React.Fragment key={column.ColumnIndex}>
        <Section
          ref={columnRefs.current[index]}
          defaultSize={(column.Right - column.Left) * scaleX}
          onSizeChanged={() => handleColumnResizeStop(index)}
        />
        {index !== data.Columns.length - 1 && (
          <Bar
            size={barWidth}
            style={{ background: "red", cursor: "col-resize" }}
          />
        )}
      </React.Fragment>
    ));
  };

  const renderRow = (row: Row, index: number) => (
    <div
      ref={rowRefs.current[index]}
      key={`${index}-${row.RowIndex}`}
      style={{
        borderTop: "3px solid green",
        borderBottom: "3px solid green",
        borderLeft: "3px solid green",
        borderRight: "2px solid green",
        visibility: hideRows ? "hidden" : "visible",
        boxSizing: "border-box",
        height: "100%",
      }}
    ></div>
  );

  const Rows = useMemo(() => {
    return data.Rows.map((column, index) => renderRow(column, index));
  }, [data.Columns, hideColumns, hideRows, setData]);

  const renderTableFromRows = (row: Row, rowIndex: number) => (
    <React.Fragment key={row.RowNumber}>
      {row.Cells.map((cell: Cell, cellIndex: number) => {
        return (
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
        );
      })}
    </React.Fragment>
  );

  return (
    <div className='container mt-5'>
      <div className='table-background'>
        <img src={tableImage} alt='background' className='table-image' />
        <Resizable
          size={{
            width: resizableContainerWidth,
            height: resizableContainerHeight,
          }}
          enable={{ top: true }}
          onResizeStop={(e, direction, elementRef, delta) => {
            handleRowResizeStop(elementRef);
            setResizableContainerHeight((prev) => prev + delta.height);
          }}
          onResizeStart={() => setHideColumns(true)}
          style={resizableContainerStyles}
        >
          <div ref={rowsContainerRef} style={rowsContainerStyles}>
            {Rows}
          </div>
          {showUpdatedData && (
            <div
              style={{
                position: "absolute",
              }}
            >
              {data.Rows.map((row, rowIndex) =>
                renderTableFromRows(row, rowIndex)
              )}
            </div>
          )}
        </Resizable>
        <div style={{ ...columnsContainerStyles, width: imageWidth }}>
          <Container
            ref={columnsContainerRef}
            columnResizerRef={ResizerRef}
            className='resize-container'
            beforeApplyResizer={(resizer) => {
              updateTotalWidth(resizer);
              handleLeftEdgeResize(resizer);
              handleRightEdgeResize(resizer);
            }}
            afterResizing={() => setHideRows(false)}
            style={{
              width: imageWidth,
              height: `${(data.Bottom - data.Top) * scaleY}px`,
              visibility: hideColumns ? "hidden" : "visible",
              position: "absolute",
              top: 0,
            }}
          >
            <Section
              defaultSize={hiddenColumnWidth}
              onSizeChanged={(currentSize) => {
                handleLeftEdgeResizeStop(currentSize);
              }}
            />
            <Bar
              size={barWidth}
              style={{ background: "red", cursor: "col-resize" }}
            />
            {renderColumns()}
            <Bar
              size={barWidth}
              style={{ background: "red", cursor: "col-resize" }}
            />
            <Section defaultSize={hiddenColumnWidth} />
          </Container>
        </div>
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
