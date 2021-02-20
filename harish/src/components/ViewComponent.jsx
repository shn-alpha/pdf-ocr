import React, { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import { Document, Page } from "react-pdf";
import PDF from "react-pdf-js";
// https://res.cloudinary.com/da8rrc2mj/image/upload/v1613735330/Fanel_Decor_Plus_Pty_Ltd_IN-000002817_1_x9lgcr.pdf

const MainContainer = styled.div`
  display: flex;
  justify-content: center;
`;

const Section = styled.div`
  display: flex;
  width: 100%;
  justify-content: center;
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
  const [state, setState] = useState({});

  const onDocumentComplete = (pages) => {
    setState({ page: 1, pages });
  };

  useEffect((_) => {
    const canvas = document.querySelector('canvas')
    canvas.style.height = '500px'
    canvas.style.width = '700px'
    const ctx = canvas.getContext('2d')
    ctx.fillRect(50,50,50,50)
  }, []);

  return (
    <MainContainer>
      <Section>
        <DataContainer></DataContainer>
        <PdfContainer>
          <PDF
            file="https://res.cloudinary.com/da8rrc2mj/image/upload/v1613735330/Fanel_Decor_Plus_Pty_Ltd_IN-000002817_1_x9lgcr.pdf"
            page={state.page}
            onDocumentComplete={onDocumentComplete}
          />
        </PdfContainer>
      </Section>
    </MainContainer>
  );
};

export default ViewComponent;
