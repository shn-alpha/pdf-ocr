import React, { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import { Document, Page } from "react-pdf";
import PDFViewer from 'pdf-viewer-reactjs'
import PDF from "react-pdf-js";
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
  const [state, setState] = useState({});



  return (
    <MainContainer>
        <PDFViewer 
            document={{
                url: 'https://res.cloudinary.com/da8rrc2mj/image/upload/v1613735330/Fanel_Decor_Plus_Pty_Ltd_IN-000002817_1_x9lgcr.pdf',
            }}
            navbarOnTop={true}
        />
        <dataContainer></dataContainer>
    </MainContainer>
  );
};

export default ViewComponent;
