const express = require("express");
const router = express.Router();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { authenticateToken } = require("../../middleware/authenticate");
const { getAccessTokenUserId } = require("../../utils/getAccessTokenUserId");
const { userDeliveryAddressSchema } = require("./validationSchema");

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

router.get("/myPage", authenticateToken, async (req, res) => {
  try {
    const id = getAccessTokenUserId(req);

    const user_name = await prisma.User.findUnique({
      where: { id },
      select: { user_name: true },
    });

    const order_count = await prisma.Order.count({
      where: {
        user_id: id,
        payment_key: { not: null },
      },
    });

    const cart_count = await prisma.Cart.count({
      where: { user_id: id },
    });

    return res.json({ ...user_name, order_count, cart_count });
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
        payment_key: { not: null },
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

router.get("/deliveryList", authenticateToken, async (req, res) => {
  try {
    const user_id = getAccessTokenUserId(req);

    const deliveryData = await prisma.User_Delivery_Address.findMany({
      where: {
        user_id,
      },
      select: {
        id: true,
        user_id: true,
        is_default: true,
        recipient: true,
        phone_prefix: true,
        phone_start: true,
        phone_end: true,
        zone_code: true,
        address: true,
        detail_address: true,
        message_index: true,
        direct_message: true,
      },
      orderBy: [{ is_default: "desc" }, { updated_at: "desc" }],
    });

    res.json(deliveryData);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Network error" });
  }
});

router.get("/delivery", authenticateToken, async (req, res) => {
  try {
    const user_id = getAccessTokenUserId(req);
    const id = parseInt(req.query.delivery_id);

    const deliveryData = await prisma.User_Delivery_Address.findUnique({
      where: {
        user_id,
        id,
      },
      select: {
        id: true,
        user_id: true,
        is_default: true,
        recipient: true,
        phone_prefix: true,
        phone_start: true,
        phone_end: true,
        zone_code: true,
        address: true,
        detail_address: true,
        message_index: true,
        direct_message: true,
      },
    });

    res.json(deliveryData);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Network error" });
  }
});

const deliveryDataCheck = async (user_id, data, res) => {
  const validationData = await userDeliveryAddressSchema
    .validate(data)
    .then(() => true)
    .catch(() => false);

  if (!validationData) {
    return res.status(400).json({ message: "입력이 잘못된 부분이 있습니다." });
  }
  const copyData = { ...data };
  delete copyData.is_default;

  const existingData = await prisma.User_Delivery_Address.findMany({
    where: {
      ...copyData,
      user_id,
    },
  });

  if (existingData.length > 0) {
    return res.status(400).json({
      message: "동일한 배송지가 존재합니다.\n수정 후 다시 시도해주세요.",
    });
  }

  return "ok";
};

const isDefaultCheck = async (is_default) => {
  if (!is_default) return;

  const existingData = await prisma.User_Delivery_Address.findMany({
    where: {
      is_default,
    },
  });

  if (existingData[0]) {
    const id = existingData[0].id;
    const user_id = existingData[0].user_id;

    await prisma.User_Delivery_Address.update({
      where: { id, user_id },
      data: { is_default: false },
    });
  }
};

router.post("/delivery", authenticateToken, async (req, res) => {
  try {
    const user_id = getAccessTokenUserId(req);
    const result = await deliveryDataCheck(user_id, req.body, res);

    if (result !== "ok") return result;

    await isDefaultCheck(req.body.is_default);

    await prisma.User_Delivery_Address.create({
      data: {
        ...req.body,
        user_id,
      },
    });

    res.json({ message: "success" });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Network error" });
  }
});

router.put("/delivery", authenticateToken, async (req, res) => {
  try {
    const { id, data } = req.body;
    const user_id = getAccessTokenUserId(req);
    const result = await deliveryDataCheck(user_id, data, res);

    if (result !== "ok") return result;

    await isDefaultCheck(data.is_default);

    await prisma.User_Delivery_Address.update({
      where: { id, user_id },
      data,
    });

    res.json({ message: "success" });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Network error" });
  }
});

router.delete("/delivery", authenticateToken, async (req, res) => {
  try {
    const user_id = getAccessTokenUserId(req);
    const id = req.body.id;

    await prisma.User_Delivery_Address.delete({
      where: { id, user_id },
    });

    return res.json({ message: "success" });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.get("/recentlyView", authenticateToken, async (req, res) => {
  try {
    const user_id = getAccessTokenUserId(req);

    const recentlyView = await prisma.User_Recently_View.findMany({
      where: {
        user_id,
      },
      orderBy: {
        updated_at: "desc",
      },
    });

    const itemList = [];

    for (const data of recentlyView) {
      const item = await prisma.Product.findUnique({
        where: {
          id: data.item_id,
        },
      });

      itemList.push(item);
    }

    return res.json(itemList);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

router.post("/recentlyView", authenticateToken, async (req, res) => {
  try {
    const user_id = getAccessTokenUserId(req);
    const item_id = req.body.id;

    await prisma.User_Recently_View.upsert({
      where: {
        user_id_item_id: {
          user_id,
          item_id,
        },
      },
      create: {
        user_id,
        item_id,
      },
      update: {
        user_id,
        item_id,
      },
    });

    return res.json({ message: "success" });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

module.exports = router;
