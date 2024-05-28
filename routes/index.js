const express = require("express");
const router = express.Router();

const userRouter = require("./user");
const signupRouter = require("./signup");
const signinRouter = require("./signin");
const homeRouter = require("./home");
const allProductRouter = require("./allProduct");
const timeSaleRouter = require("./timeSaleProduct");
const searchResultRouter = require("./searchResult");
const productDetailRouter = require("./productDetail");
const cartRouter = require("./cart");
const orderRouter = require("./order");

router.use("/user", userRouter);
router.use("/signup", signupRouter);
router.use("/signin", signinRouter);
router.use("/home", homeRouter);
router.use("/allProduct", allProductRouter);
router.use("/timeSaleProduct", timeSaleRouter);
router.use("/searchResult", searchResultRouter);
router.use("/productDetail", productDetailRouter);
router.use("/cart", cartRouter);
router.use("/order", orderRouter);

module.exports = router;
