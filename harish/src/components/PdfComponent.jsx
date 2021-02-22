import React, { useEffect, useRef, useState } from "react";
import { Document, Page } from "react-pdf";
import { pdfjs } from "react-pdf";
import styled from "styled-components";
import inside from "point-in-polygon";
import * as apiResponse from "../apiResponse.json";
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
  };

  const handleClick = (text) => {
    console.log({ text });
  };

  const getAllToolTips = (_) => {
    return apiResponse.Blocks.reduce((acc, block) => {
      if (block.BlockType === "LINE") {
        acc.push(
          <ToolTip
            handleClick={handleClick}
            {...block}
            canvasHeight={canvasHeight}
            canvasWidth={canvasWidth}
          />
        );
      }
      return acc;
    }, []);
  };

  return (
    <MainContainer>
      <Section>
        <DataContainer></DataContainer>
        <PdfContainer>
          {getAllToolTips()}
          <Document
            file="https://res.cloudinary.com/da8rrc2mj/image/upload/v1613735330/Fanel_Decor_Plus_Pty_Ltd_IN-000002817_1_x9lgcr.pdf"
            onLoadSuccess={onDocumentLoadSuccess}
          >
            <Page
              onRenderSuccess={handleRenderSuccess}
              width={800}
              pageNumber={pageNumber}
            />
          </Document>
        </PdfContainer>
      </Section>
      {/* <button onClick={handleClick}>click</button> */}
    </MainContainer>
  );
};

export default PdfComponent;
