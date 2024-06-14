const express = require("express");
const router = express.Router();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const PAGE_SIZE = 20;

router.get("/", async (req, res) => {
  try {
    const now = new Date();

    const pageNumber = parseInt(req.query.page) || 1;
    const skip = (pageNumber - 1) * PAGE_SIZE; // 페이지 번호에 따른 skip 값 계산
    const take = PAGE_SIZE; // 페이지당 항목 수

    const products = await prisma.Product.findMany({
      where: {
        time_sale: {
          gte: now,
        },
      },
      orderBy: { time_sale: "asc" },
      skip,
      take,
    });

    const totalCount = await prisma.product.count({
      where: { time_sale: { gte: now } },
    });

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    // 데이터를 JSON 형식으로 응답합니다.
    res.json({ data: products, totalPages, totalCount });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

module.exports = router;
