const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const randomPrice = (basePrice) => {
  const minPercentage = 0.25;
  const maxPercentage = 0.5;
  const randomPercentage =
    Math.random() * (maxPercentage - minPercentage) + minPercentage;

  const optionPrice = Math.floor(basePrice * randomPercentage);

  return optionPrice;
};

const createOption = (data) => {
  const { id, price } = data;

  const arr = [];
  const randomNumber = Math.floor(Math.random() * 6) + 1;
  const typeArr = ["A", "B", "C", "D", "E", "F"];

  for (let i = 0; i < randomNumber; i++) {
    const option_price = i === 0 ? 0 : randomPrice(price);

    arr.push({ item_id: id, name: `option${typeArr[i]}`, option_price });
  }

  return arr;
};

async function createPrdOption() {
  try {
    const products = await prisma.Product.findMany();

    const optionArr = [];

    products.forEach((val) => {
      const optionData = createOption(val);
      optionArr.push(optionData);
    });

    await prisma.Product_Option.createMany({
      data: optionArr.flat(),
    });

    console.log("Option이 성공적으로 저장되었습니다.");
  } catch (error) {
    console.error("Option 저장 중 오류가 발생했습니다:", error);
    throw error;
  }
}

createPrdOption()
  .then()
  .catch((error) => {
    console.error("Option 저장 중 오류가 발생했습니다:", error);
  });
