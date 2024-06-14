const express = require("express");
const router = express.Router();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const bcrypt = require("bcrypt");
const { userDeliveryAddressSchema } = require("./user/validationSchema");

router.post("/", async (req, res) => {
  const existingUser = await prisma.user.findUnique({
    where: { user_id: req.body.user_id },
  });

  if (existingUser) {
    return res.status(409).json({ message: "중복된 아이디 입니다." });
  }

  const { name, deliveryData } = req.body;

  const validationData = await userDeliveryAddressSchema
    .validate({ ...deliveryData, recipient: name })
    .then(() => true)
    .catch(() => false);

  if (!validationData) {
    return res.status(400).json({ message: "입력이 잘못된 부분이 있습니다." });
  }

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

    const { user_id, name, email } = req.body;

    const userData = await prisma.User.create({
      data: {
        ...req.body.deliveryData,
        user_id,
        name,
        email,
        password: hashedPassword,
      },
    });

    await prisma.User_Delivery_Address.create({
      data: {
        ...deliveryData,
        user_id: userData.id,
        name: "",
        recipient: name,
        is_default: true,
        direct_message: "",
      },
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.post("/idDuplicationCheck", async (req, res) => {
  const user_id = req.body.user_id;

  const existingUser = await prisma.user.findUnique({ where: { user_id } });

  if (existingUser) {
    res.status(409).json({ message: "중복된 아이디 입니다." });
  } else {
    res.status(200).json({ message: "User ID is available" });
  }
});

module.exports = router;
