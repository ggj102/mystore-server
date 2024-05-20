require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
const { sql } = require("@vercel/postgres");

const bodyParser = require("body-parser");
const path = require("path");

const { PrismaClient } = require("@prisma/client");
const { productCrawl } = require("../dataCrawling");
const prisma = new PrismaClient();

// Create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use(express.static("public"));
app.use(cors({ origin: "http://localhost:3000" }));

// JSON 형식의 요청 바디를 해석하기 위한 body-parser 설정
app.use(bodyParser.json());
// URL 인코딩된 요청 바디를 해석하기 위한 body-parser 설정
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "..", "components", "home.htm"));
});

app.get("/about", function (req, res) {
  res.sendFile(path.join(__dirname, "..", "components", "about.htm"));
});

app.get("/uploadUser", function (req, res) {
  res.sendFile(
    path.join(__dirname, "..", "components", "user_upload_form.htm")
  );
});

// -------------- test --------------------

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

app.get("/testUserInfo", async (req, res) => {
  try {
    // Prisma를 사용하여 데이터베이스에서 데이터를 가져옵니다.
    const user = await prisma.user.findUnique({
      where: { id: 1 },
    });

    // 데이터를 JSON 형식으로 응답합니다.
    res.json(user);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

app.get("/productList", async (req, res) => {
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

app.get("/allProductList", async (req, res) => {
  try {
    // Prisma를 사용하여 데이터베이스에서 데이터를 가져옵니다.
    const products = await prisma.Product.findMany();

    // 데이터를 JSON 형식으로 응답합니다.
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

app.get("/timeSaleProduct", async (req, res) => {
  try {
    const currentDate = new Date();
    const yesterday = new Date(currentDate);

    yesterday.setDate(currentDate.getDate() - 1);

    const pageNumber = parseInt(req.query.page) || 1;
    const skip = (pageNumber - 1) * PAGE_SIZE; // 페이지 번호에 따른 skip 값 계산
    const take = PAGE_SIZE; // 페이지당 항목 수

    const products = await prisma.Product.findMany({
      where: { time_sale: { not: null, gt: yesterday.toISOString() } },
      orderBy: { time_sale: "asc" },
      skip,
      take,
    });

    const totalCount = await prisma.product.count({
      // 전체 항목 수를 가져오는 쿼리 추가
      where: { time_sale: { not: null, gt: yesterday.toISOString() } },
    });

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    // 데이터를 JSON 형식으로 응답합니다.
    res.json({ data: products, totalPages, totalCount });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

app.get("/searchResult", async (req, res) => {
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

app.get("/productDetail/:id", async (req, res) => {
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

app.get("/productOption", async (req, res) => {
  try {
    const id = parseInt(req.query.id);

    const results = await prisma.Product_Option.findMany({
      where: {
        item_id: id,
      },
    });

    res.json(results);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

app.get("/cart", async (req, res) => {
  try {
    const id = parseInt(req.query.id);

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
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

app.post("/cart", async (req, res) => {
  try {
    for (const data of req.body) {
      const { user_id, item_id, option_id } = data;

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
        await prisma.cart.create({ data });
      }
    }

    return res.json({ message: "success" });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

app.put("/cart", async (req, res) => {
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

app.delete("/cart", async (req, res) => {
  try {
    for (const data of req.body) {
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

app.get("/order", async (req, res) => {
  try {
    const order_id = parseInt(req.query.order_id);

    const transaction = await prisma.$transaction([
      prisma.Order.findUnique({
        where: {
          id: order_id,
        },
      }),

      prisma.Order_Item.findMany({
        where: {
          order_id,
        },
      }),
    ]);

    const [order, order_item] = transaction;

    return res.json({ order, order_item });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

app.post("/order", async (req, res) => {
  try {
    const { user_id, order_item } = req.body;

    const result = await prisma.Order.create({
      data: {
        user_id,
        order_Item: {
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
      include: { order_Item: true },
    });

    return res.json({ order_id: result.id });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

app.put("/order", async (req, res) => {
  try {
    const order_id = parseInt(req.query.order_id);

    const existingOrder = await prisma.Order.findUnique({
      where: {
        id: order_id,
      },
    });

    // 해당 ID의 제품이 없는 경우 404 에러를 반환합니다.
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

const getOrderItem = async (order_id) => {
  const items = await prisma.Order_Item.findMany({
    where: {
      order_id,
    },
  });

  const order_items = Array();

  for (const item of items) {
    const { item_id, option_id, count } = item;

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

    const itemData = {
      ...transaction[0],
      order_id,
      cart_info: { count },
      product_detail: transaction[1],
      product_option: transaction[2],
    };

    order_items.push(itemData);
  }

  return order_items;
};

app.get("/orderItem", async (req, res) => {
  try {
    const order_id = parseInt(req.query.order_id);

    const order_items = await getOrderItem(order_id);

    return res.json(order_items);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

app.delete("/orderItem", async (req, res) => {
  try {
    const { order_id, item_id, option_id } = req.body;

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

app.get("/success", async (req, res) => {
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

    res.redirect(
      302,
      `http://localhost:3000/orderComplete?order_id=${order_id}`
    );
  } catch (error) {
    console.error("Error updating product:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the product" });
  }
});

// -------------- test --------------------

app.post("/uploadSuccessful", urlencodedParser, async (req, res) => {
  try {
    await sql`INSERT INTO Users (Id, Name, Email) VALUES (${req.body.user_id}, ${req.body.name}, ${req.body.email});`;
    res.status(200).send("<h1>User added successfully</h1>");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error adding user");
  }
});

app.get("/allUsers", async (req, res) => {
  try {
    const users = await sql`SELECT * FROM Users;`;
    if (users && users.rows.length > 0) {
      let tableContent = users.rows
        .map(
          (user) =>
            `<tr>
                        <td>${user.id}</td>
                        <td>${user.name}</td>
                        <td>${user.email}</td>
                    </tr>`
        )
        .join("");

      res.status(200).send(`
                <html>
                    <head>
                        <title>Users</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                            }
                            table {
                                width: 100%;
                                border-collapse: collapse;
                                margin-bottom: 15px;
                            }
                            th, td {
                                border: 1px solid #ddd;
                                padding: 8px;
                                text-align: left;
                            }
                            th {
                                background-color: #f2f2f2;
                            }
                            a {
                                text-decoration: none;
                                color: #0a16f7;
                                margin: 15px;
                            }
                        </style>
                    </head>
                    <body>
                        <h1>Users</h1>
                        <table>
                            <thead>
                                <tr>
                                    <th>User ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableContent}
                            </tbody>
                        </table>
                        <div>
                            <a href="/">Home</a>
                            <a href="/uploadUser">Add User</a>
                        </div>
                    </body>
                </html>
            `);
    } else {
      res.status(404).send("Users not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving users");
  }
});

app.listen(3005, () => console.log("Server ready on port 3005."));

module.exports = app;
