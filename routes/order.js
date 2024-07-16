const express = require("express");
const router = express.Router();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { authenticateToken } = require("../middleware/authenticate");
const { getAccessTokenUserId } = require("../utils/getAccessTokenUserId");

const getOrderItem = async (order_id) => {
  const items = await prisma.Order_Item.findMany({
    where: {
      order_id,
    },
  });

  const order_items = Array();

  for (const item of items) {
    const { item_id, option_id, count } = item;

    const product = await prisma.Product.findUnique({
      where: {
        id: item_id,
      },
      include: {
        product_detail: true,
        product_option: {
          where: {
            option_id,
          },
        },
      },
    });

    const itemData = {
      ...product,
      order_id,
      cart_info: { count },
      product_option: product.product_option[0],
    };

    order_items.push(itemData);
  }

  return order_items;
};

router.get("/", authenticateToken, async (req, res) => {
  try {
    const user_id = getAccessTokenUserId(req);
    const order_id = parseInt(req.query.order_id);

    const order = await prisma.Order.findUnique({
      where: {
        id: order_id,
        user_id,
      },
      include: {
        order_item: true,
      },
    });

    return res.json({ order, order_item: order.order_item });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  try {
    const user_id = getAccessTokenUserId(req);

    const { order_item } = req.body;

    const result = await prisma.Order.create({
      data: {
        user_id,
        order_item: {
          create: order_item.map((item) => {
            const { id, product_option, cart_info } = item;

            return {
              item_id: id,
              option_id: product_option.option_id,
              count: cart_info.count,
            };
          }),
        },
      },
      include: { order_item: true },
    });

    return res.json({ order_id: result.id });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.put("/", authenticateToken, async (req, res) => {
  try {
    const user_id = getAccessTokenUserId(req);
    const order_id = parseInt(req.query.order_id);

    const existingOrder = await prisma.Order.findUnique({
      where: {
        id: order_id,
        user_id,
      },
    });

    if (!existingOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    await prisma.Order.update({
      where: {
        id: order_id,
      },
      data: {
        ...req.body,
      },
    });

    return res.json({ message: "success" });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.get("/orderItem", async (req, res) => {
  try {
    const order_id = parseInt(req.query.order_id);

    const order_items = await getOrderItem(order_id);

    return res.json(order_items);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.delete("/orderItem", authenticateToken, async (req, res) => {
  try {
    const { order_id, item_id, option_id } = req.body.data;

    await prisma.Order_Item.delete({
      where: {
        order_id_item_id_option_id: { order_id, item_id, option_id },
      },
    });

    return res.json({ message: "success" });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.get("/success", async (req, res) => {
  try {
    const order_id = parseInt(req.query.order_id);
    const amount = parseInt(req.query.amount);

    const order = await prisma.Order.findUnique({
      where: {
        id: order_id,
      },
    });

    // 해당 ID의 제품이 없는 경우 404 에러를 반환합니다.
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order_items = await getOrderItem(order_id);

    const priceReduce = order_items.reduce((acc, val) => {
      const delivery = val.product_detail.delivery_price;
      const optionPrice = val.product_option.option_price;

      const dPrice = delivery === "무료" ? 0 : delivery;
      const price = (val.price + optionPrice) * val.cart_info.count;

      return acc + dPrice + price;
    }, 0);

    if (priceReduce !== amount) {
      return res.status(400).json({ error: "Payment Failed: Price Mismatch" });
    }

    await prisma.Order.update({
      where: {
        id: order_id,
      },
      data: {
        payment_key: req.query.paymentKey,
        total_payment_price: amount,
      },
    });

    for (const item of order_items) {
      const { id, name, price, image_path, product_option } = item;

      const count = item.cart_info.count;
      const payment_price = (price + product_option.option_price) * count;

      await prisma.Order_Item.update({
        where: {
          order_id_item_id_option_id: {
            order_id,
            item_id: id,
            option_id: product_option.option_id,
          },
        },
        data: {
          item_name: name,
          item_option: product_option.name,
          payment_price,
          image_path,
        },
      });

      await prisma.cart.delete({
        where: {
          user_id_item_id_option_id: {
            user_id: order.user_id,
            item_id: id,
            option_id: product_option.option_id,
          },
        },
      });
    }

    const redirectUrl =
      process.env.NODE_ENV === "production"
        ? "https://mystore-bay.vercel.app"
        : "http://localhost:3000";

    res.redirect(302, `${redirectUrl}/orderComplete?order_id=${order_id}`);
  } catch (error) {
    console.error("Error updating product:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the product" });
  }
});

module.exports = router;
