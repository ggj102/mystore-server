const puppeteer = require("puppeteer");
const { getRandomDate } = require("./utils/random/randomDate");
const fs = require("fs");
const path = require("path");

async function crawlDetailPage(data) {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(data.product_detail);

    const detailData = await page.evaluate(() => {
      const element = document.querySelector("#contents > div:nth-child(2)");

      const image_path = element
        .querySelector("div.thumbnail img")
        .getAttribute("src")
        .trim();

      const subImage = element.querySelectorAll(
        "div.detailArea div.swiper-wrapper div.swiper-slide > img"
      );

      const sub_image_path = [];

      if (subImage.length > 1) {
        subImage.forEach((el) => {
          sub_image_path.push(el.getAttribute("src").trim());
        });
      }

      const product_detail_image_path = [];

      const prdDetailImg = element.querySelectorAll(
        "#prdDetail > div.cont > img"
      );

      if (prdDetailImg.length > 0) {
        prdDetailImg.forEach((el) => {
          product_detail_image_path.push(el.getAttribute("ec-data-src").trim());
        });
      }

      const domestic = element
        .querySelector("div.infoArea tbody > tr:nth-child(5) td span")
        .textContent.trim();
      const delivery_type = element
        .querySelector("div.infoArea tbody > tr:nth-child(6) td span")
        .textContent.trim();
      const delivery_price = element
        .querySelector("div.infoArea tbody > tr:nth-child(7) td span")
        .textContent.trim();

      return {
        image_path,
        sub_image_path,
        product_detail_image_path,
        domestic,
        delivery_type,
        delivery_price,
      };
    });

    await browser.close();
    return {
      ...data,
      product_detail: detailData,
    };
  } catch (error) {
    console.error("Error:", error);
  }
}

async function crawlPage({ url, category }) {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    const productList = await page.evaluate(() => {
      const products = [];

      const elements = document.querySelectorAll(
        "#contents > div:nth-child(2) > div:nth-child(2) > ul > li"
      );

      elements.forEach((element) => {
        const productName = element
          .querySelector("div.name > a > span:nth-child(2)")
          .textContent.trim();
        const description = element
          .querySelector("div.description > ul > li:nth-child(1) > span")
          .textContent.trim();
        const price = element
          .querySelector(
            "div.description > ul > li:nth-child(2) > span:first-of-type"
          )
          .textContent.trim()
          .slice(0, -1);
        const defaultPrice = element
          .querySelector("div.description > ul > li:nth-child(3) > span")
          .textContent.trim()
          .slice(0, -1);
        const discount = element
          .querySelector("div.description > span.discount_rate")
          .textContent.trim()
          .slice(0, -1);
        const image_path = element
          .querySelector("div.prdImg > a > img")
          .getAttribute("src")
          .trim();
        const link = element
          .querySelector("div.prdImg > a")
          .getAttribute("href")
          .trim();

        products.push({
          name: productName,
          description,
          defaultPrice,
          price,
          discount,
          image_path,
          product_detail: `https://cnpmall.com${link}`,
        });
      });

      return products;
    });

    const addDataList = productList.map((val) => {
      const price = val.price.replace(",", "");
      const defaultPrice = val.defaultPrice.replace(",", "");
      const isTimeSale = Math.floor(Math.random() * 4) === 1;

      const randomValue = Math.random() * (5.0 - 1.0) + 1.0;
      const popularity = Math.round(randomValue * 10) / 10;

      const time_sale = isTimeSale ? getRandomDate("next") : "";
      const release_date = getRandomDate("pre");
      const is_issue = Math.floor(Math.random() * 2) === 1;
      const is_event = Math.floor(Math.random() * 2) === 1;

      return {
        ...val,
        price: Number(price),
        defaultPrice: Number(defaultPrice),
        discount: Number(val.discount),
        category,
        popularity,
        time_sale,
        release_date,
        is_issue,
        is_event,
      };
    });

    const addDetailList = [];

    for (let i = 0; i < addDataList.length; i++) {
      const detailList = await crawlDetailPage(addDataList[i]);
      addDetailList.push(detailList);
    }

    await browser.close();

    return addDetailList;
  } catch (error) {
    console.error("Error:", error);
  }
}

async function productCrawl() {
  const url1 = "https://cnpmall.com/category/%ED%81%B4%EB%A0%8C%EC%A7%95/60/"; //클렌징
  const url2 =
    "https://cnpmall.com/category/%EB%B6%80%EC%8A%A4%ED%84%B0%ED%86%A0%EB%84%88/61/"; // 부스터/토너
  const url21 =
    "https://cnpmall.com/category/%EB%B6%80%EC%8A%A4%ED%84%B0%ED%86%A0%EB%84%88/61/?page=2";
  const url3 =
    "https://cnpmall.com/category/%EC%95%B0%ED%94%8C%EC%97%90%EC%84%BC%EC%8A%A4/63/"; // 앰플/에센스
  const url31 =
    "https://cnpmall.com/category/%EC%95%B0%ED%94%8C%EC%97%90%EC%84%BC%EC%8A%A4/63/?page=2";
  const url4 = "https://cnpmall.com/category/%ED%81%AC%EB%A6%BC/65/"; // 크림
  const url5 =
    "https://cnpmall.com/category/%ED%8C%A9%EB%A7%88%EC%8A%A4%ED%81%AC/67/"; // 팩 마스크
  const url6 = "https://cnpmall.com/category/%EB%AF%B8%EC%8A%A4%ED%8A%B8/68/"; // 미스트
  const url7 = "https://cnpmall.com/category/%EC%84%A0%EC%BC%80%EC%96%B4/69/"; //선케어
  const url8 =
    "https://cnpmall.com/category/%EC%BF%A0%EC%85%98%EB%B2%A0%EC%9D%B4%EC%8A%A4/70/"; // 쿠션/베이스

  const urlArr = [
    { url: url1, category: "cleansing" },
    { url: url2, category: "booster_toner" },
    { url: url21, category: "booster_toner" },
    { url: url3, category: "ampoule_essence" },
    { url: url31, category: "ampoule_essence" },
    { url: url4, category: "cream" },
    { url: url5, category: "pack_mask" },
    { url: url6, category: "mist" },
    { url: url7, category: "sun_care" },
    { url: url8, category: "cushion_base" },
  ];

  const prdList = [];

  for (let i = 0; i < urlArr.length; i++) {
    const data = await crawlPage(urlArr[i]);
    prdList.push(data);
  }

  const jsonContent = JSON.stringify(prdList.flat(), null, 2); // 읽기 쉽게 들여쓰기

  // JSON 파일을 저장할 경로를 설정합니다
  const outputPath = path.join(__dirname, "productCrawlData.json");

  // 파일을 저장합니다
  fs.writeFile(outputPath, jsonContent, "utf8", (err) => {
    if (err) {
      console.error("Error writing JSON file:", err);
    } else {
      console.log("JSON file has been saved.");
    }
  });

  // return prdList.flat();
}

productCrawl();

module.exports = { productCrawl };
