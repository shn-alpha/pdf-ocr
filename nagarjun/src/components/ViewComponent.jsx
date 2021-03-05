import React, { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
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
  max-width: 100px;
  flex-wrap: wrap;
  border: 1px solid black;
  border-radius:5px;
  height: 500px
`;
const SectionForm = styled.div`
  display: flex;
  width: 100%;
  justify-content: right;
  width: 300px;
  flex-wrap: wrap;
  border: 1px solid black ;
  border-radius:5px;
  height:500px;
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
  const [rotateLevel, setRotateLevel] = useState(0);
  let selection = {};

  const setHighlighting = (canvas) => {
    const ctx = canvas.getContext("2d");
    let canvasWidth = canvas?.width;
    let canvasHeight = canvas?.height;
    apiResponse.Blocks.map((res) => {
      let left, top, width, height;
      if (res.BlockType === "LINE") {
        if (rotateLevel === 0) {
          left = res.Geometry.BoundingBox.Left * canvasWidth - 2;
          top = res.Geometry.BoundingBox.Top * canvasHeight - 2;
          width = res.Geometry.BoundingBox.Width * canvasWidth + 4;
          height = res.Geometry.BoundingBox.Height * canvasHeight + 4;
        } else if (rotateLevel === -90) {
          left = res.Geometry.BoundingBox.Top * canvasWidth - 2;
          top =
            canvasHeight -
            (res.Geometry.BoundingBox.Left + res.Geometry.BoundingBox.Width) *
              canvasHeight -
            2;
          width = res.Geometry.BoundingBox.Height * canvasWidth + 4;
          height = res.Geometry.BoundingBox.Width * canvasHeight + 4;
        } else if (rotateLevel === 90) {
          left =
            canvasWidth -
            (res.Geometry.BoundingBox.Top + res.Geometry.BoundingBox.Height) *
              canvasWidth -
            2;
          top = res.Geometry.BoundingBox.Left * canvasHeight - 2;
          width = res.Geometry.BoundingBox.Height * canvasWidth + 4;
          height = res.Geometry.BoundingBox.Width * canvasHeight + 4;
        } else if (rotateLevel === -180 || rotateLevel === 180) {
          left =
            canvasWidth -
            (res.Geometry.BoundingBox.Left + res.Geometry.BoundingBox.Width) *
              canvasWidth -
            2;
          top =
            canvasHeight -
            (res.Geometry.BoundingBox.Top + res.Geometry.BoundingBox.Height) *
              canvasHeight -
            2;
          width = res.Geometry.BoundingBox.Height * canvasWidth + 4;
          height = res.Geometry.BoundingBox.Width * canvasHeight + 4;
        }
        ctx.strokeStyle = "green";
        ctx.strokeRect(left, top, width, height);
      }
    });
  };

  useEffect(() => {
    const canvas = document.querySelector("canvas");
    setTimeout(() => {
      setHighlighting(canvas);
      canvas.addEventListener("click", handleClick);
      canvas.addEventListener("mousedown", handleMouseDown);
      canvas.addEventListener("mouseup", handleMouseUp);
    }, 1000);
    return (_) => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("click", handleClick);
    };
  }, [zoomLevel, rotateLevel]);

  const handleMouseDown = (e) => {
    const canvas = document.querySelector("canvas");
    let canvasWidth = canvas?.width;
    let canvasHeight = canvas?.height;
    const x1 = e.layerX / canvasWidth;
    const y1 = e.layerY / canvasHeight;
    selection = { ...selection, x1, y1, x3: x1, y2: y1 };
  };
  const handleMouseUp = (e) => {
    const canvas = document.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    let canvasWidth = canvas?.width;
    let canvasHeight = canvas?.height;
    const x4 = e.layerX / canvasWidth;
    const y4 = e.layerY / canvasHeight;
    selection = { ...selection, x4, y4, x2: x4, y3: y4 };
    apiResponse.Blocks.forEach((res) => {
      if (res.BlockType === "LINE") {
        let polygon;
        if (rotateLevel === 0) {
          polygon = [
            [selection.x1, selection.y1],
            [selection.x2, selection.y2],
            [selection.x3, selection.y3],
            [selection.x4, selection.y4],
          ];
        } else if (rotateLevel === -90) {
          polygon = [
            [1 - selection.y1, selection.x1],
            [1 - selection.y2, selection.x2],
            [1 - selection.y3, selection.x3],
            [1 - selection.y4, selection.x4],
          ];
        } else if (rotateLevel === 90) {
          polygon = [
            [selection.y1, 1 - selection.x1],
            [selection.y2, 1 - selection.x2],
            [selection.y3, 1 - selection.x3],
            [selection.y4, 1 - selection.x4],
          ];
        }

        res.Geometry.Polygon.forEach((point) => {
          const coOrdinates = [point.X, point.Y];
          const isMatched = inside(coOrdinates, polygon);
          if (isMatched) console.log(res.Text);
        });
      }
    });
  };

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
    let coOrdinates;
    if (rotateLevel === 0) {
      coOrdinates = [x, y];
    } else if (rotateLevel === -90) {
      coOrdinates = [1 - y, x];
    } else if (rotateLevel === 90) {
      coOrdinates = [y, 1 - x];
    }
    apiResponse.Blocks.forEach((res) => {
      if (res.BlockType === "LINE") {
        const polygon = [
          [res.Geometry.Polygon[0].X, res.Geometry.Polygon[0].Y],
          [res.Geometry.Polygon[1].X, res.Geometry.Polygon[1].Y],
          [res.Geometry.Polygon[2].X, res.Geometry.Polygon[2].Y],
          [res.Geometry.Polygon[3].X, res.Geometry.Polygon[3].Y],
        ];
        const isMatched = inside(coOrdinates, polygon);
        if (isMatched) console.log(res.Text);
      }
    });
  };

  const handleRotate = (e) => {
    setRotateLevel(e);
  };
  return (
    <MainContainer>
      <Section></Section>
      <PDFViewer
        document={{
          url:
            "https://res.cloudinary.com/da8rrc2mj/image/upload/v1613735330/Fanel_Decor_Plus_Pty_Ltd_IN-000002817_1_x9lgcr.pdf",
        }}
        navbarOnTop={true}
        onZoom={handleZoom}
        onRotation={handleRotate}
        minScale={1}
        maxScale={5}
        scaleStep={0.25}
      />
      <SectionForm></SectionForm>

    
    </MainContainer>
  );
};

export default ViewComponent;
