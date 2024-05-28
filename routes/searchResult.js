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
    const keyword = req.query.keyword;
    const sort = req.query.sort || "";
    const pageNumber = parseInt(req.query.page) || 1;

    const skip = (pageNumber - 1) * PAGE_SIZE;
    const take = PAGE_SIZE;

    const results = await prisma.$queryRaw`
        SELECT * 
        FROM "Product" 
        WHERE LOWER(REPLACE(name, ' ', '')) LIKE ${"%" + keyword + "%"} 
        or LOWER(REPLACE(description, ' ', '')) LIKE ${"%" + keyword + "%"}
      `;

    const idMap = results.map((val) => val.id);

    const products = await prisma.Product.findMany({
      where: { id: { in: idMap } },
      orderBy: getSort(sort),
      skip,
      take,
    });

    const totalCount = results.length;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    res.json({ data: products, totalPages, totalCount });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

module.exports = router;
