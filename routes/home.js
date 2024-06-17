const express = require("express");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const router = express.Router();

const getBestSeller = (data) => {
  const copy = [...data];
  const sort = copy.sort((a, b) => b.popularity - a.popularity);
  const slice = sort.slice(0, 4);

  return slice;
};

const getNewProduct = (data) => {
  const copy = [...data];
  const sort = copy.sort(
    (a, b) =>
      new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
  );
  const slice = sort.slice(0, 8);

  return slice;
};

const getIntroVideo = (data) => {
  const copy = [...data];
  const filter = copy.filter((val) => val.is_event);

  const slice = filter.slice(0, 8);

  return slice;
};

router.get("/", async (req, res) => {
  try {
    const now = new Date();
    const products = await prisma.Product.findMany();
    const timeSaleProduct = await prisma.Product.findMany({
      where: {
        time_sale: {
          gte: now,
        },
      },
      orderBy: {
        time_sale: "asc",
      },
      take: 8,
    });

    const bestSeller = getBestSeller(products);
    const newProduct = getNewProduct(products);
    const introVideo = getIntroVideo(products);

    res.json({ bestSeller, newProduct, introVideo, timeSaleProduct });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

module.exports = router;
