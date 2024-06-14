const express = require("express");
const router = express.Router();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const PAGE_SIZE = 20;

const getSort = (sort) => {
  switch (sort) {
    case "popularity_desc":
      return { popularity: "desc" };
    case "new_desc":
      return { release_date: "desc" };
    case "name_asc":
      return { name: "asc" };
    case "price_asc":
      return { price: "asc" };
    case "price_desc":
      return { price: "desc" };
    default:
      return { popularity: "desc" };
  }
};

router.get("/", async (req, res) => {
  try {
    const pageNumber = parseInt(req.query.page) || 1;
    const category = req.query.category || "";
    const sort = req.query.sort || "";

    const skip = (pageNumber - 1) * PAGE_SIZE; // 페이지 번호에 따른 skip 값 계산
    const take = PAGE_SIZE; // 페이지당 항목 수

    const data = await prisma.product.findMany({
      where: category ? { category: category } : {},
      skip,
      take,
      orderBy: getSort(sort),
    });

    const totalCount = await prisma.product.count({
      // 전체 항목 수를 가져오는 쿼리 추가
      where: category ? { category: category } : {},
    });

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    res.json({ data, totalPages, totalCount });
  } catch (error) {
    console.error("Error fetching page:", error);
    throw error;
  }
});

module.exports = router;
