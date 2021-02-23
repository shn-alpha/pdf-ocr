import React from "react";
import Inputcompo from "./Inputcompo";
import Headercompo from "./headerCompo";
import "./styles/rightCompo.css";

function rightCompo() {
  return (
    <div className="right_side">
      <Headercompo />
      <h1>Invoice </h1>
      <Inputcompo />
      <Inputcompo />
      <Inputcompo />
      <Inputcompo />
      <Inputcompo />
      <Inputcompo />
    </div>
  );
}

export default rightCompo;
