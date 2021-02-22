import React from "react";

const ToolTip = (props) => {
  const {
    Text: text,
    Geometry: {
      BoundingBox: { Left, Top, Width, Height },
    },
    canvasWidth,
    canvasHeight,
    handleClick,
  } = props;

  const style = {
    position: "absolute",
    left: Left * canvasWidth - 3,
    top: Top * canvasHeight - 3,
    width: Width * canvasWidth + 3,
    height: Height * canvasHeight + 3,
    border: "1px dashed red",
    background: "#2f2e2e40",
    zIndex: 999,
  };

  console.log({ Width, Height, canvasHeight });

  return (
    <div style={{ ...style }} onClick={(_) => handleClick(text)}></div>
  );
};

export default ToolTip;
