function getCurrentDate() {
  return new Date();
}

// 랜덤한 범위 내에서 날짜를 생성하는 함수
function getRandomDateStamp(startDate, endDate) {
  const startTimestamp = startDate.getTime();
  const endTimestamp = endDate.getTime();
  const randomTimestamp =
    startTimestamp + Math.random() * (endTimestamp - startTimestamp);
  return new Date(randomTimestamp);
}

function getRandomDate(state) {
  // 현재 시간을 가져옴
  const currentDate = getCurrentDate();
  // 180일 이후의 날짜를 계산
  const preEndDate = new Date(
    currentDate.getTime() - 180 * 24 * 60 * 60 * 1000
  );
  const nextEndDate = new Date(
    currentDate.getTime() + 180 * 24 * 60 * 60 * 1000
  );
  // 랜덤한 날짜 생성
  const randomDate = getRandomDateStamp(
    currentDate,
    state === "pre" ? preEndDate : nextEndDate
  );

  // 년-월-일 형식으로 포맷
  return randomDate.toISOString().split("T")[0];
}

module.exports = {
  getRandomDate,
};
