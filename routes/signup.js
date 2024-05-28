const express = require("express");
const router = express.Router();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const bcrypt = require("bcrypt");

router.post("/", async (req, res) => {
  const existingUser = await prisma.user.findUnique({
    where: { user_id: req.body.user_id },
  });

  if (existingUser) {
    return res.status(409).json({ message: "Duplicate user ID" });
  }

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(
      req.body.user_password,
      saltRounds
    );

    await prisma.User.create({
      data: {
        ...req.body,
        user_password: hashedPassword,
      },
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.post("/idDuplicationCheck", async (req, res) => {
  console.log(req.body.user_id, "중복체크");

  const user_id = req.body.user_id;

  const existingUser = await prisma.user.findUnique({ where: { user_id } });

  // 중복된 아이디가 존재할 경우

  if (existingUser) {
    res.status(409).json({ message: "Duplicate user ID" });
  } else {
    res.status(200).json({ message: "User ID is available" });
  }
});

module.exports = router;
