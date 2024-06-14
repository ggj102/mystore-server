const express = require("express");
const router = express.Router();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { authenticateToken } = require("../middleware/authenticate");
const { getAccessTokenUserId } = require("../utils/getAccessTokenUserId");

router.get("/", authenticateToken, async (req, res) => {
  const id = getAccessTokenUserId(req);

  try {
    const cartData = await prisma.Cart.findMany({
      where: {
        user_id: id,
      },
    });

    const cartPrdData = Array();

    for (const data of cartData) {
      const { item_id, option_id } = data;

      const transaction = await prisma.$transaction([
        prisma.Product.findUnique({
          where: {
            id: item_id,
          },
        }),
        prisma.Product_Detail.findUnique({
          where: {
            id: item_id,
          },
        }),
        prisma.Product_Option.findUnique({
          where: {
            option_id,
          },
        }),
      ]);

      const cartProduct = {
        ...transaction[0],
        product_detail: { ...transaction[1] },
        product_option: { ...transaction[2] },
        cart_info: { ...data },
      };

      cartPrdData.push(cartProduct);
    }

    return res.json(cartPrdData);
  } catch (error) {
    console.log("에러");
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  const user_id = getAccessTokenUserId(req);

  try {
    for (const data of req.body) {
      const { item_id, option_id } = data;

      const existingData = await prisma.cart.findUnique({
        where: {
          user_id_item_id_option_id: {
            user_id,
            item_id,
            option_id,
          },
        },
      });

      if (existingData) {
        // 중복 시 카운트 증가
        await prisma.cart.update({
          where: {
            user_id_item_id_option_id: {
              user_id,
              item_id,
              option_id,
            },
          },
          data: {
            count: {
              increment: data.count,
            },
          },
        });
      } else {
        await prisma.cart.create({ data: { ...data, user_id } });
      }
    }

    return res.json({ message: "success" });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.put("/", authenticateToken, async (req, res) => {
  try {
    const { user_id, item_id, option_id, count } = req.body;

    const existingCart = await prisma.Cart.findUnique({
      where: {
        user_id_item_id_option_id: { user_id, item_id, option_id },
      },
    });

    // 해당 ID의 제품이 없는 경우 404 에러를 반환합니다.
    if (!existingCart) {
      return res.status(404).json({ error: "cart not found" });
    }

    await prisma.cart.update({
      where: {
        user_id_item_id_option_id: { user_id, item_id, option_id },
      },
      data: {
        count,
      },
    });

    return res.json({ message: "success" });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.delete("/", authenticateToken, async (req, res) => {
  try {
    for (const data of req.body.data) {
      const { user_id, item_id, option_id } = data;

      await prisma.cart.delete({
        where: {
          user_id_item_id_option_id: { user_id, item_id, option_id },
        },
      });
    }

    return res.json({ message: "success" });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

module.exports = router;
