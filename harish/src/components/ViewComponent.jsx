import React, { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import { Document, Page } from "react-pdf";
import PDFViewer from "pdf-viewer-reactjs";
import PDF from "react-pdf-js";
import inside from "point-in-polygon";
import * as apiResponse from "../apiResponse.json";
// https://res.cloudinary.com/da8rrc2mj/image/upload/v1613735330/Fanel_Decor_Plus_Pty_Ltd_IN-000002817_1_x9lgcr.pdf

const MainContainer = styled.div`
  display: flex;
  justify-content: center;
`;

const Section = styled.div`
  display: flex;
  width: 100%;
  justify-content: left;
  max-width: 1300px;
  flex-wrap: wrap;
  border: 1px solid red;
`;

const PdfContainer = styled.div`
  width: 700px;
  height: 500px;
  border: 1px solid green;
  margin: 20px;
`;
const DataContainer = styled.div`
  width: 500px;
  height: 500px;
  border: 1px solid green;
  margin: 20px;
`;

const ViewComponent = () => {
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    const canvas = document.querySelector("canvas");
    const ctx = canvas.getContext("2d");

    const canvasWidth = canvas?.width;
    const canvasHeight = canvas?.height;
    apiResponse.Blocks.map((res) => {
      if (res.BlockType === "LINE") {
        const left = res.Geometry.BoundingBox.Left * canvasWidth - 2;
        const top = res.Geometry.BoundingBox.Top * canvasHeight - 2;
        const width = res.Geometry.BoundingBox.Width * canvasWidth + 4;
        const height = res.Geometry.BoundingBox.Height * canvasHeight + 4;
        ctx.strokeStyle = "red";
        ctx.strokeRect(left, top, width, height);
      }
    });
    canvas.addEventListener("click", handleClick);

    return (_) => {
      canvas.removeEventListener("click", handleClick);
    };
  }, [zoomLevel]);

  const handleZoom = (e) => {
    setZoomLevel(e);
  };

  const handleClick = (e) => {
    const canvas = document.querySelector("canvas");

    const ctx = canvas.getContext("2d");
    const canvasWidth = canvas?.width;
    const canvasHeight = canvas?.height;
    const x = e.layerX / canvasWidth;
    const y = e.layerY / canvasHeight;
    apiResponse.Blocks.forEach((res) => {
      if (res.BlockType === "LINE") {
        const left = res.Geometry.BoundingBox.Left;
        const top = res.Geometry.BoundingBox.Top;
        const width = res.Geometry.BoundingBox.Width;
        const height = res.Geometry.BoundingBox.Height;
        const polygon = [
          [left, top],
          [left + width, top],
          [left + width, top + height],
          [left, top + height],
        ];
        const isMatched = inside([x, y], polygon);
        if (isMatched) console.log(res.Text);
      }
    });
  };

  return (
    <MainContainer>
      <PDFViewer
        document={{
          url:
            "https://res.cloudinary.com/da8rrc2mj/image/upload/v1613735330/Fanel_Decor_Plus_Pty_Ltd_IN-000002817_1_x9lgcr.pdf",
        }}
        navbarOnTop={true}
        onZoom={handleZoom}
      />
      {/* <DataContainer></DataContainer> */}
    </MainContainer>
  );
};

export default ViewComponent;
