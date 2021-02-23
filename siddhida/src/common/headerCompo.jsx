import React from "react";
import "./styles/header.css";

function headerCompo() {
  return (
    <div className="header">
      <div className="header_left">
        <p> Review the Information</p>
      </div>
      <div className="header_right">
        <i class="fas fa-search"></i>
        <i class="fas fa-eye"></i>
        <i class="fas fa-cloud-download-alt"></i>
        <i class="fas fa-trash"></i>
      </div>
    </div>
  );
}

export default headerCompo;
