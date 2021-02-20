import React, { useEffect, useRef, useState } from "react";
import { Document, Page } from "react-pdf";
import { pdfjs } from "react-pdf";
import styled from "styled-components";
import ToolTip from "./ToolTip";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// https://res.cloudinary.com/da8rrc2mj/image/upload/v1613735330/Fanel_Decor_Plus_Pty_Ltd_IN-000002817_1_x9lgcr.pdf

const MainContainer = styled.div`
  display: flex;
  justify-content: center;
`;

const Section = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-around;
  align-items: center;
  max-width: 1300px;
  flex-wrap: wrap;
  border: 1px solid red;
`;

const PdfContainer = styled.div`
  border: 1px solid green;
  position: relative;
`;
const DataContainer = styled.div`
  width: 400px;
  height: 100%;
  border: 1px solid green;
`;

const PdfComponent = () => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [canvasHeight, setCanvasHeight] = useState(null);
  const [canvasWidth, setCanvasWidth] = useState(null);
  const [canvasCtx, setCanvasCtx] = useState(null);
  const canvasRef = useRef(null);
  const [toolTipProps, setToolTipProps] = useState({});

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleRenderSuccess = (_) => {
    const canvas = document.querySelector("canvas");
    const ctx = canvas?.getContext("2d");
    const height = canvas?.height;
    const width = canvas?.width;
    setCanvasHeight(height);
    setCanvasWidth(width);
    setCanvasCtx(ctx);

    setToolTipProps({
      canvasHeight:canvas?.height,
      canvasWidth:canvas?.width,
      left: 0.8692331314086914,
      top: 0.20284776389598846,
      width: 0.09422732144594193,
      height: 0.014572471380233765,
    });
  };
  const handleClick = (_) => {
    // canvasCtx.pop();
    // canvasCtx.strokeStyle = "red";
    // canvasCtx.setLineDash([5, 2]);
    // canvasCtx.strokeRect(
    //   0.8692331314086914 * canvasWidth - 2,
    //   0.20284776389598846 * canvasHeight - 2,
    //   0.09422732144594193 * canvasWidth + 4,
    //   0.014572471380233765 * canvasHeight + 4
    // );
    // canvasCtx.fillStyle = "#2f2e2e40";
    // canvasCtx.fillRect(
    //   0.8692331314086914 * canvasWidth - 2,
    //   0.20284776389598846 * canvasHeight - 2,
    //   0.09422732144594193 * canvasWidth + 4,
    //   0.014572471380233765 * canvasHeight + 4
    // );
    setToolTipProps({
      canvasHeight,
      canvasWidth,
      width: 0.06981643289327621,
      height: 0.0209606122225523,
      left: 0.833181619644165,
      top: 0.046331487596035004,
    });
  };

  return (
    <MainContainer>
      <Section>
        <DataContainer></DataContainer>
        <PdfContainer>
          <ToolTip {...toolTipProps} />
          <Document
            file="https://res.cloudinary.com/da8rrc2mj/image/upload/v1613735330/Fanel_Decor_Plus_Pty_Ltd_IN-000002817_1_x9lgcr.pdf"
            onLoadSuccess={onDocumentLoadSuccess}
          >
            <Page
              onRenderSuccess={handleRenderSuccess}
              inputRef={canvasRef}
              width={800}
              pageNumber={pageNumber}
            />
          </Document>
        </PdfContainer>
      </Section>
      <button onClick={handleClick}>click</button>
    </MainContainer>
  );
};

export default PdfComponent;
