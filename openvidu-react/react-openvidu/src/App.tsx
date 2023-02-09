import React from "react";
import Owner from "./components/Owner";
import Visitor from "./components/Visitor";
import Tmp from "./components/Tmp";
import { Routes, Route } from "react-router-dom";
import axios from "axios";

function App() {
  const please = function () {
    axios({
      method: "get",
      url: "/api/user/welcome",
    })
      .then((res) => console.log(res))
      .catch((err) => console.log(err));
  };

  const tmp = function () {
    axios({
      method: "post",
      url: "/api/sessions",
      data: JSON.stringify({ customSessionId: "123" }),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    })
      .then((res) => console.log(res))
      .catch((err) => console.log(err));
  };

  return (
    <div>
      <Owner />
      <hr />
      <Visitor />
      <button onClick={please}>아무 요청</button>
      <button onClick={tmp}>asdf</button>
    </div>
  );
}

export default App;
