import React, { useState } from "react";
import Selectedbox from "./Selectedbox";
import "./styles/inputCompo.css";

function Inputcompo() {
  const [isClicked, setIsClicked] = useState(false);
  const handleExteriorBox = () => {
    setIsClicked(!isClicked);
  };
  return (
    <div
      // className={`exteriorBox ${isClicked && "exteriorBox_focus"} `}
      className="exteriorBox"
      onClick={handleExteriorBox}
      role="presentation"
    >
      <p> Type </p>
      <div className="outerBox">
        <Selectedbox />
        <Selectedbox />
        <Selectedbox />
        <Selectedbox />
      </div>
    </div>
  );
}

export default Inputcompo;
