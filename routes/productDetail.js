const express = require("express");
const router = express.Router();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const transaction = await prisma.$transaction([
      prisma.Product.findUnique({
        where: {
          id,
        },
      }),
      prisma.Product_Detail.findUnique({
        where: {
          id,
        },
      }),
      prisma.Product_Option.findMany({
        where: {
          item_id: id,
        },
      }),
    ]);

    const detailData = {
      ...transaction[0],
      product_detail: { ...transaction[1] },
      product_option: [...transaction[2]],
    };

    // 데이터를 JSON 형식으로 응답합니다.
    res.json(detailData);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

module.exports = router;
