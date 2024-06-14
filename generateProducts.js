const { PrismaClient } = require("@prisma/client");
const productCrawlData = require("./productCrawlData");
const prisma = new PrismaClient();

async function deleteProductAndDetailById(id) {
  const transaction = await prisma.$transaction([
    prisma.Product_Detail.delete({
      where: {
        id,
      },
    }),
    prisma.Product.delete({
      where: {
        id,
      },
    }),
  ]);

  console.log(`id가 ${id}인 제품과 id가 ${id}인 상세정보가 삭제되었습니다.`);
  return transaction;
}

// deleteProductAndDetailById(2)
//   .then(() => {
//     console.log("삭제가 완료되었습니다.");
//   })
//   .catch((error) => {
//     console.error("삭제 중 오류가 발생했습니다:", error);
//   });

async function createProducts() {
  try {
    // 제품 데이터 일괄 삽입
    const productsData = productCrawlData;

    for (let i = 0; i < productsData.length; i++) {
      const productData = productsData[i];

      const time_sale = productData.time_sale
        ? new Date(productData.time_sale)
        : null;

      await prisma.product.create({
        data: {
          ...productData,
          time_sale,
          release_date: new Date(productData.release_date),
          product_detail: {
            create: { ...productData.product_detail },
          },
        },
        include: { product_detail: true }, // product_detail을 반환하도록 include 지정
      });
    }

    console.log("Products가 성공적으로 저장되었습니다.");
  } catch (error) {
    console.error("Products 저장 중 오류가 발생했습니다:", error);
    throw error;
  }
}

createProducts()
  .then()
  .catch((error) => {
    console.error("Products 저장 중 오류가 발생했습니다:", error);
  });
