const express = require("express");
const app = express();

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");

app.use(express.static("public"));
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

require("dotenv").config();

const port = 3005;
const routes = require("./routes");

app.use("/", routes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
