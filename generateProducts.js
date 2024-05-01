const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  // 상품 데이터 생성
  const products = [
    { name: "Product 1", price: 10.99, category: "Electronics" },
    { name: "Product 2", price: 24.99, category: "Clothing" },
    { name: "Product 3", price: 14.99, category: "Books" },
    { name: "Product 4", price: 49.99, category: "Home & Kitchen" },
    { name: "Product 5", price: 7.99, category: "Toys" },
    { name: "Product 6", price: 39.99, category: "Electronics" },
    { name: "Product 7", price: 19.99, category: "Clothing" },
    { name: "Product 8", price: 29.99, category: "Books" },
    { name: "Product 9", price: 54.99, category: "Home & Kitchen" },
    { name: "Product 10", price: 12.99, category: "Toys" },
  ];

  // 상품 데이터를 데이터베이스에 생성
  for (let productData of products) {
    await prisma.product.create({ data: productData });
  }

  console.log("10 products created successfully!");
}

main()
  .catch((err) => {
    console.error("Error creating products:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
