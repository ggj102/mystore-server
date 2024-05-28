const express = require("express");
const router = express.Router();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { authenticateToken } = require("../middleware/authenticate");

router.get("/", authenticateToken, async (req, res) => {
  try {
    const id = getAccessTokenUserId(req);

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        user_id: true,
        user_name: true,
        user_email: true,
        user_phone: true,
        user_address: true,
        user_detail_address: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

module.exports = router;
