import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const errorRate = new Rate("errors");

export const options = {
  stages: [
    { duration: "30s", target: 50 },
    { duration: "1m", target: 100 },
    { duration: "30s", target: 200 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    errors: ["rate<0.01"],
    http_req_duration: ["p(95)<2000"],
  },
};

const TICKERS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"];

export default function () {
  const ticker = TICKERS[Math.floor(Math.random() * TICKERS.length)];
  const res = http.get(
    `http://localhost:4000/api/v1/compliance/evaluate?ticker=${ticker}`,
    { headers: { "Content-Type": "application/json" } },
  );

  check(res, {
    "status is 200": (r) => r.status === 200,
    "has verdict": (r) => r.json("data.verdict") !== undefined,
  });

  errorRate.add(res.status !== 200);
  sleep(1);
}
