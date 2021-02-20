import React from "react";

const ToolTip = (props) => {
  const { left, top, width, height, canvasWidth, canvasHeight } = props;

  const style = {
    position: "absolute",
    left: left * canvasWidth - 3,
    top: top * canvasHeight - 3,
    width: width * canvasWidth + 3,
    height: height * canvasHeight + 3,
    border: "1px dashed red",
    background: "#2f2e2e40",
    zIndex: 999,
    transitionDuration: '400ms'
  };

  return <div style={{ ...style }}></div>;
};

export default ToolTip;
