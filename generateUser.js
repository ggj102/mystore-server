const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createUser() {
  try {
    await prisma.user.create({
      data: {
        nick_name: "testUser",
        email: "testUser1234@naver.com",
        phone: "010-1234-1234",
        address: "서울시 광진구 화양동",
        detail_address: "355번지",
        message: "배송 전에 미리 연락바랍니다.",
      },
    });
    console.log("User 성공적으로 저장되었습니다.");
  } catch (error) {
    console.error("User 저장 중 오류가 발생했습니다:", error);
  }
}

createUser()
  .then()
  .catch((error) => {
    console.error("User 저장 중 오류가 발생했습니다:", error);
  });
