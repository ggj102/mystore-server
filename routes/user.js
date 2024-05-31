const express = require("express");
const router = express.Router();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { authenticateToken } = require("../middleware/authenticate");
const { getAccessTokenUserId } = require("../utils/getAccessTokenUserId");

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

router.get("/order", authenticateToken, async (req, res) => {
  try {
    const user_id = getAccessTokenUserId(req);
    const orders = await prisma.Order.findMany({
      where: {
        user_id,
      },
    });

    const orderData = [];

    for (const order of orders) {
      const orderItems = await prisma.Order_Item.findMany({
        where: {
          order_id: order.id,
        },
      });

      const remain = orderItems.length - 1;
      const item = orderItems[0];

      const data = {
        ...order,
        order_name: item.item_name,
        image_path: item.image_path,
        remain,
      };

      orderData.push(data);
    }

    res.json(orderData);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.delete("/order", authenticateToken, async (req, res) => {
  const order_id = parseInt(req.body.order_id);

  try {
    const user_id = getAccessTokenUserId(req);

    await prisma.Order.delete({
      where: {
        user_id: user_id,
        id: order_id,
      },
    });

    res.json({ message: "success" });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

module.exports = router;
