import React, { useState } from "react";
import { useForm } from "react-hook-form";
// import {app} from "./base";
import "./styles/scannedPdf.css";

function ScannedPdf() {
  const { register, handleSubmit } = useForm();
  // const [upload, setUpload] = useState();
  const onSubmit = (data) => {
    // console.log(data);
    // const storageref = app.storage().ref();
    // const fileRef = storageref.child(data.image[0].name);
    // fileRef.put(data.image[0]).then(() => {
      console.log("Upload a file");
    };
  
  return (
    <div className="scannedPdf">
      <h1>I contain scanned PDF </h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input ref={register} type="file" name="pdf" />
        <button>Submit</button>
      </form>
      {/* <div>{upload}</div> */}
    </div>
  );
}

export default ScannedPdf;
