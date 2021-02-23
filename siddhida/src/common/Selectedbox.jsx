import React, { useState } from "react";
import "./styles/selectedbox.css";

function Selectedbox() {
  const [display, setDisplay] = useState(true);
  const handleDisplay = () => {
    setDisplay(false);
  };
  return (
    <div>
      <div className={display ? "smaller_box" : "smaller_box_do_not_display"}>
        <p className="smaller_box_p">Text</p>
        <span onClick={handleDisplay}>
          <i className="fas fa-times icon"></i>
        </span>
      </div>
    </div>
  );
}

export default Selectedbox;
