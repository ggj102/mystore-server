const express = require("express");
const router = express.Router();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const detailData = await prisma.Product.findUnique({
      where: {
        id,
      },
      include: {
        product_detail: true,
        product_option: true,
      },
    });

    res.json(detailData);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

module.exports = router;
