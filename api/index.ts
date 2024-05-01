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

// async function deleteProductAndDetailById(id) {
//   const transaction = await prisma.$transaction([
//     prisma.Product_Detail.delete({
//       where: {
//         id,
//       },
//     }),
//     prisma.Product.delete({
//       where: {
//         id,
//       },
//     }),
//   ]);

//   console.log(`id가 ${id}인 제품과 id가 ${id}인 상세정보가 삭제되었습니다.`);
//   return transaction;
// }

// deleteProductAndDetailById(2)
//   .then(() => {
//     console.log("삭제가 완료되었습니다.");
//   })
//   .catch((error) => {
//     console.error("삭제 중 오류가 발생했습니다:", error);
//   });

// async function createProducts() {
//   try {
//     // 제품 데이터 일괄 삽입
//     const productsData = await productCrawl();

//     for (let i = 0; i < productsData.length; i++) {
//       const productData = productsData[i];

//       await prisma.product.create({
//         data: {
//           ...productData,
//           product_detail: {
//             create: { ...productData.product_detail },
//           },
//         },
//         include: { product_detail: true }, // product_detail을 반환하도록 include 지정
//       });
//     }

//     console.log("Products가 성공적으로 저장되었습니다.");
//   } catch (error) {
//     console.error("Products 저장 중 오류가 발생했습니다:", error);
//     throw error;
//   }
// }

// createProducts()
//   .then()
//   .catch((error) => {
//     console.error("Products 저장 중 오류가 발생했습니다:", error);
//   });

app.get("/productList", async (req, res) => {
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
    ]);

    const detailData = {
      ...transaction[0],
      product_detail: { ...transaction[1] },
    };

    // 데이터를 JSON 형식으로 응답합니다.
    res.json(detailData);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

// app.post("/products", async (req, res) => {
//   try {
//     // console.log(req, "테스트");
//     const { name, price, category } = req.body; // 요청 바디에서 새 제품의 정보를 추출합니다.

//     // Prisma를 사용하여 데이터베이스에 새 제품을 추가합니다.
//     const newProduct = await prisma.product.create({
//       data: {
//         name,
//         price,
//         category,
//       },
//     });

//     // 새 제품을 JSON 형식으로 응답합니다.
//     res.json(newProduct);
//   } catch (error) {
//     console.error("Error creating product:", error);
//     res
//       .status(500)
//       .json({ error: "An error occurred while creating the product" });
//   }
// });

app.put("/products/:id", async (req, res) => {
  try {
    const productId = parseInt(req.params.id); // URL 파라미터에서 제품 ID를 가져옵니다.
    const { name, price, category } = req.body; // 요청 바디에서 새 제품 정보를 가져옵니다.

    // Prisma를 사용하여 해당 ID의 제품을 찾습니다.
    const existingProduct = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    // 해당 ID의 제품이 없는 경우 404 에러를 반환합니다.
    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Prisma를 사용하여 제품을 업데이트합니다.
    const updatedProduct = await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        name,
        price,
        category,
      },
    });

    // 업데이트된 제품을 응답합니다.
    res.json(updatedProduct);
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
