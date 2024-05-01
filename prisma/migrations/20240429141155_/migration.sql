-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "defaultPrice" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "discount" TEXT NOT NULL,
    "image_path" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "popularity" INTEGER NOT NULL,
    "time_sale" TEXT NOT NULL,
    "release_date" TEXT NOT NULL,
    "is_issue" BOOLEAN NOT NULL,
    "is_event" BOOLEAN NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product_Detail" (
    "id" INTEGER NOT NULL,
    "image_path" TEXT NOT NULL,
    "sub_image_path" TEXT[],
    "product_detail_image_path" TEXT[],
    "domestic" TEXT NOT NULL,
    "delivery_type" TEXT NOT NULL,
    "delivery_price" TEXT NOT NULL,

    CONSTRAINT "Product_Detail_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Product_Detail" ADD CONSTRAINT "Product_Detail_id_fkey" FOREIGN KEY ("id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
