import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { EthersAppContext } from "eth-hooks/context";

import "./index.css";

import App from "./App";

ReactDOM.render(
  <BrowserRouter>
    <EthersAppContext>
      <App />
    </EthersAppContext>
  </BrowserRouter>,
  document.getElementById("root"),
);
